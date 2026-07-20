import { getToestellenLijst } from '@/lib/tracker/queries';
import { AanbevelingenClient } from './aanbevelingen-client';

export const dynamic = 'force-dynamic';

function score(t: { margePct: number; verkoopsnelheid: number; voorraadTotaal: number }) {
  const marge = (Math.min(Math.max(t.margePct, 0), 40) / 40) * 100;
  const snelheid = (t.verkoopsnelheid / 10) * 100;
  const voorraad = (Math.min(t.voorraadTotaal, 20) / 20) * 100;
  return Math.round(marge * 0.5 + snelheid * 0.3 + voorraad * 0.2);
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
