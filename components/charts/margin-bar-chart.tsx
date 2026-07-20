'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function MarginBarChart({ data }: { data: Array<{ brand: string; avgMarginPct: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="brand" fontSize={12} />
        <YAxis fontSize={12} unit="%" />
        <Tooltip formatter={(v) => [`${v}%`, 'Gem. marge']} />
        <Bar dataKey="avgMarginPct" fill="#FFD200" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
