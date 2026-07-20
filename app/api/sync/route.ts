import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runSync } from '@/lib/vendit/run-sync';
import { MockVenditAdapter } from '@/lib/vendit/mock';
import { matchProducts } from '@/lib/matching/match-products';
import { getNotifier, type Alert } from '@/lib/notify/notifier';

// Sync-endpoint (C4). Beveiligd met Authorization: Bearer CRON_SECRET.
// Vercel-cron stuurt een GET met deze header; de admin-actie stuurt een POST.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RUNNING_LOCK_MINUTES = 15;

async function handle(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  const cutoff = new Date(Date.now() - RUNNING_LOCK_MINUTES * 60_000).toISOString();
  const { data: running } = await db
    .from('sync_runs')
    .select('id')
    .eq('status', 'running')
    .gte('started_at', cutoff)
    .limit(1);
  if (running && running.length > 0) {
    return NextResponse.json({ error: 'Er draait al een sync' }, { status: 409 });
  }

  const notifier = getNotifier();

  // TODO: vervang MockVenditAdapter door VenditRestAdapter zodra de Vendit-config binnen is (C2).
  let summary;
  try {
    summary = await runSync(new MockVenditAdapter());
  } catch (e) {
    await notifier.send([
      { type: 'sync_failed', message: e instanceof Error ? e.message : 'Sync mislukt' },
    ]);
    return NextResponse.json({ error: 'Sync mislukt' }, { status: 500 });
  }
  const match = await matchProducts(); // matcher draait na elke sync (D2)

  const alerts: Alert[] = [];
  if (summary.itemsSeen > 0 && summary.unmatched / summary.itemsSeen > 0.2) {
    alerts.push({
      type: 'high_unmatched',
      message: `${summary.unmatched}/${summary.itemsSeen} artikelen ongematcht (>20%).`,
    });
  }
  if (summary.quarantined > 0) {
    alerts.push({
      type: 'new_quarantine',
      message: `${summary.quarantined} prijswijziging(en) in quarantaine.`,
    });
  }
  for (const m of summary.marginAlerts) {
    alerts.push({
      type: 'margin_drop',
      message: `Product ${m.productId} onder marge-drempel (${m.marginPct}%).`,
    });
  }
  await notifier.send(alerts);

  return NextResponse.json({ ...summary, match, alerts: alerts.length });
}

export const GET = handle;
export const POST = handle;
