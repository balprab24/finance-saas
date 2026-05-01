'use client';

import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';

type Props = {
  data: { date: Date | string; income: number; expenses: number }[];
};

export function AreaVariant({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,255,0.1)" vertical={false} />
        <defs>
          <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="2%" stopColor="#34d399" stopOpacity={0.5} />
            <stop offset="98%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="2%" stopColor="#fb7185" stopOpacity={0.5} />
            <stop offset="98%" stopColor="#fb7185" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          axisLine={false}
          tickLine={false}
          dataKey="date"
          tickFormatter={(value) => format(new Date(value), 'dd MMM')}
          style={{ fontSize: '12px', fill: 'var(--aurex-text-3)' }}
          tick={{ fill: 'var(--aurex-text-3)' }}
          tickMargin={16}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.4)', strokeWidth: 1 }} />
        <Area type="monotone" dataKey="income" stackId="income" strokeWidth={2.4} stroke="#34d399" fill="url(#income)" />
        <Area type="monotone" dataKey="expenses" stackId="expenses" strokeWidth={2.4} stroke="#fb7185" fill="url(#expenses)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
