'use client';

import { Store, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Nette, herbruikbare filiaal-selector (i.p.v. een lange rij knoppen).
export function FiliaalSelect({
  filialen,
  value,
  onChange,
  includeAll = true,
  allLabel = 'Alle filialen',
  className,
}: {
  filialen: Array<{ id: string; naam: string }>;
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Store
        className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
        strokeWidth={1.75}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filiaal"
        className="h-10 w-full appearance-none rounded-full border bg-background pl-9 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {includeAll && <option value="alle">{allLabel}</option>}
        {filialen.map((f) => (
          <option key={f.id} value={f.id}>
            {f.naam}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground"
        strokeWidth={1.75}
      />
    </div>
  );
}
