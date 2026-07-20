'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface HistoryRow {
  field: string;
  new_cents: number | null;
  changed_at: string;
}

// Prijshistorie: inkoop + verkoop als twee lijnen (D3). Nieuwste prijzen als eindpunt.
export function PriceHistoryChart({
  history,
  currentPurchase,
  currentSale,
}: {
  history: HistoryRow[];
  currentPurchase: number | null;
  currentSale: number | null;
}) {
  const points = history
    .slice()
    .reverse()
    .map((h) => ({
      date: h.changed_at.slice(5, 10),
      inkoop: h.field === 'purchase' && h.new_cents != null ? h.new_cents / 100 : undefined,
      verkoop: h.field === 'sale' && h.new_cents != null ? h.new_cents / 100 : undefined,
    }));
  points.push({
    date: 'nu',
    inkoop: currentPurchase != null ? currentPurchase / 100 : undefined,
    verkoop: currentSale != null ? currentSale / 100 : undefined,
  });

  if (points.length <= 1) {
    return <p className="text-sm text-muted-foreground">Nog geen historie.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis fontSize={12} unit="€" />
        <Tooltip formatter={(v) => [`€ ${v}`, '']} />
        <Line
          type="monotone"
          dataKey="inkoop"
          stroke="#111111"
          connectNulls
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="verkoop"
          stroke="#2563B8"
          connectNulls
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
