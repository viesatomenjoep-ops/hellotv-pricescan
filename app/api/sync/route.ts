import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runSync } from '@/lib/vendit/run-sync';
import { MockVenditAdapter } from '@/lib/vendit/mock';
import { matchProducts } from '@/lib/matching/match-products';

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

  // TODO: vervang MockVenditAdapter door VenditRestAdapter zodra de Vendit-config binnen is (C2).
  const summary = await runSync(new MockVenditAdapter());
  const match = await matchProducts(); // matcher draait na elke sync (D2)
  return NextResponse.json({ ...summary, match });
}

export const GET = handle;
export const POST = handle;
