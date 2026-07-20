'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function ChangesPerDayChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis allowDecimals={false} fontSize={12} />
        <Tooltip formatter={(v) => [`${v}`, 'Wijzigingen']} />
        <Area type="monotone" dataKey="count" stroke="#19445B" fill="#19445B" fillOpacity={0.15} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
