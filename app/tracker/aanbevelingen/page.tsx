import { getToestellenLijst } from '@/lib/tracker/queries';
import { AanbevelingenClient } from './aanbevelingen-client';

export const dynamic = 'force-dynamic';

// Score wordt gedreven door de marge (hoogste marge = beste score). Bij weinig voorraad (<10)
// zakt de score, want dan is het model minder makkelijk te verkopen.
function score(t: { margePct: number; voorraadTotaal: number }) {
  const margeScore = Math.min(Math.max(t.margePct, 0), 45) * 2; // 45% → 90
  const voorraadFactor = t.voorraadTotaal >= 10 ? 1 : 0.6 + 0.04 * t.voorraadTotaal; // 0→0.6, 10→1
  return Math.round(margeScore * voorraadFactor);
}

export default async function AanbevelingenPage() {
  const toestellen = await getToestellenLijst();
  const items = toestellen.map((t) => ({
    id: t.id,
    model: t.model,
    merk: t.merk,
    klasse: t.klasse,
    inch: t.inch,
    margePct: t.margePct,
    voorraadTotaal: t.voorraadTotaal,
    score: score(t),
  }));
  return <AanbevelingenClient items={items} />;
}
