'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Lichtgewicht, offline kaartweergave: projecteert lat/lng van de filialen op een SVG-vlak
// (geen externe kaartlib). XL = gevuld, standaard = omlijnd, nog-niet-open = gestreept.

interface MapFiliaal {
  id: string;
  naam: string;
  plaats: string | null;
  type: string | null;
  opent: string | null;
  aantal: number;
  lat: number | null;
  lng: number | null;
}

// Grofweg de bounding box van Nederland, met wat marge.
const LAT_MIN = 50.7;
const LAT_MAX = 53.6;
const LNG_MIN = 3.3;
const LNG_MAX = 7.25;
const W = 380;
const H = 460;
const PAD = 26;

function project(lat: number, lng: number): [number, number] {
  const x = PAD + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (W - 2 * PAD);
  const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (H - 2 * PAD);
  return [x, y];
}

export function FilialenMap({ filialen }: { filialen: MapFiliaal[] }) {
  const router = useRouter();
  const [actief, setActief] = useState<string | null>(null);
  const punten = filialen.filter((f) => f.lat != null && f.lng != null);
  const gekozen = punten.find((f) => f.id === actief) ?? null;

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-sm font-semibold">Nederland</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-primary ring-1 ring-foreground/30" />
            XL
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-foreground/60 bg-background" />
            Standaard
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-orange-500 bg-background" />
            Opent
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto max-h-[60vh] w-full max-w-[420px]" role="img" aria-label="Kaart van de filialen">
        {/* achtergrondvlak + subtiel raster */}
        <rect x="1" y="1" width={W - 2} height={H - 2} rx="14" className="fill-muted/40 stroke-border" />
        {Array.from({ length: 5 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={PAD + (i * (W - 2 * PAD)) / 4}
            y1={PAD}
            x2={PAD + (i * (W - 2 * PAD)) / 4}
            y2={H - PAD}
            className="stroke-border/40"
            strokeDasharray="2 4"
          />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={PAD}
            y1={PAD + (i * (H - 2 * PAD)) / 5}
            x2={W - PAD}
            y2={PAD + (i * (H - 2 * PAD)) / 5}
            className="stroke-border/40"
            strokeDasharray="2 4"
          />
        ))}

        {punten.map((f) => {
          const [x, y] = project(f.lat as number, f.lng as number);
          const isActief = f.id === actief;
          const r = isActief ? 8 : 6;
          const opening = !!f.opent;
          const xl = f.type === 'xl';
          return (
            <g
              key={f.id}
              transform={`translate(${x} ${y})`}
              className="cursor-pointer"
              onMouseEnter={() => setActief(f.id)}
              onMouseLeave={() => setActief((a) => (a === f.id ? null : a))}
              onClick={() => router.push(`/tracker/voorraad?filiaal=${f.id}`)}
            >
              {isActief && <circle r={r + 4} className="fill-primary/20" />}
              <circle
                r={r}
                className={
                  opening
                    ? 'fill-background stroke-orange-500'
                    : xl
                      ? 'fill-primary stroke-foreground/40'
                      : 'fill-background stroke-foreground/60'
                }
                strokeWidth={2}
                strokeDasharray={opening ? '3 2' : undefined}
              />
              {isActief && (
                <text
                  y={-r - 6}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-semibold"
                  style={{ paintOrder: 'stroke' }}
                  stroke="var(--background, #fff)"
                  strokeWidth="3"
                >
                  {f.plaats ?? f.naam}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="min-h-[2.5rem] px-1 pt-2 text-sm">
        {gekozen ? (
          <p>
            <span className="font-semibold">{gekozen.naam}</span>{' '}
            <span className="text-muted-foreground">
              · {gekozen.opent ? `opent ${gekozen.opent}` : `${gekozen.aantal} toestellen`}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">Beweeg over een stip of tik om naar de voorraad te gaan.</p>
        )}
      </div>
    </div>
  );
}
