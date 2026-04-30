'use client';

import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';

type Props = {
  data: { date: Date | string; income: number; expenses: number }[];
};

export function BarVariant({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
        <XAxis axisLine={false} tickLine={false} dataKey="date" tickFormatter={(v) => format(new Date(v), 'dd MMM')} style={{ fontSize: '12px' }} tickMargin={16} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="income" fill="#3d82f6" className="drop-shadow-sm" />
        <Bar dataKey="expenses" fill="#f43f5e" className="drop-shadow-sm" />
      </BarChart>
    </ResponsiveContainer>
  );
}
