import Image from 'next/image';

// Compacte campagne-strip met de actieve actie + verkoopdoelstellingen (voor de verkoper).
export function CampagneBanner() {
  const doelen = ['1 op 2 = OLED', '4 op 10 = Samsung', '6 op 10 = 2026-model'];
  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3">
      <div className="flex items-center gap-2">
        <Image src="/hellotv-bubble.png" alt="helloTV" width={28} height={28} className="h-5 w-auto" />
        <p className="text-sm font-semibold">OLED Weken · tot 20% korting</p>
        <span className="ml-auto text-xs text-muted-foreground">t/m zo 2 aug</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {doelen.map((d) => (
          <span
            key={d}
            className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
