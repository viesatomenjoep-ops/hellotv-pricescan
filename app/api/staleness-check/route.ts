import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getNotifier } from '@/lib/notify/notifier';

// Staleness-bewaking (C5): alarmeert als de laatste succesvolle sync ouder is dan 4 uur
// binnen winkeltijden (08:00–21:00 NL). Lichte cron, los van de sync zelf.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nlHour = Number(
    new Intl.DateTimeFormat('nl-NL', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Europe/Amsterdam',
    }).format(new Date()),
  );
  const winkeltijden = nlHour >= 8 && nlHour < 21;
  if (!winkeltijden) return NextResponse.json({ checked: false, reason: 'buiten winkeltijden' });

  const db = createAdminClient();
  const { data: last } = await db
    .from('sync_runs')
    .select('finished_at')
    .eq('status', 'success')
    .order('finished_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const finishedAt = last?.finished_at ? new Date(last.finished_at).getTime() : 0;
  const ageHours = (Date.now() - finishedAt) / 3_600_000;
  const stale = ageHours > 4;

  if (stale) {
    await getNotifier().send([
      {
        type: 'stale',
        message: last?.finished_at
          ? `Laatste succesvolle sync is ${ageHours.toFixed(1)} u oud (>4 u).`
          : 'Nog geen succesvolle sync.',
      },
    ]);
  }

  return NextResponse.json({ checked: true, stale, ageHours: Math.round(ageHours * 10) / 10 });
}
