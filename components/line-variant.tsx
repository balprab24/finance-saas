'use client';

import { format } from 'date-fns';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';

type Props = {
  data: { date: Date | string; income: number; expenses: number }[];
};

export function LineVariant({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
        <XAxis axisLine={false} tickLine={false} dataKey="date" tickFormatter={(v) => format(new Date(v), 'dd MMM')} style={{ fontSize: '12px' }} tickMargin={16} />
        <Tooltip content={<CustomTooltip />} />
        <Line dot={false} dataKey="income" stroke="#3d82f6" strokeWidth={2} className="drop-shadow-sm" />
        <Line dot={false} dataKey="expenses" stroke="#f43f5e" strokeWidth={2} className="drop-shadow-sm" />
      </LineChart>
    </ResponsiveContainer>
  );
}
