'use client';

import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';

type Props = {
  data: { date: Date | string; income: number; expenses: number }[];
};

export function AreaVariant({ data }: Props) {
  // Recharts 3.x ResponsiveContainer creates a width:0 inner wrapper for self-
  // measurement; wrapping in a stable-sized div keeps the chart paintable when
  // the parent reflows (and lets Playwright fullPage screenshots capture it).
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
        <defs>
          <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="2%" stopColor="#117a4b" stopOpacity={0.5} />
            <stop offset="98%" stopColor="#117a4b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="2%" stopColor="#c0392b" stopOpacity={0.5} />
            <stop offset="98%" stopColor="#c0392b" stopOpacity={0} />
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
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(22, 24, 29,0.4)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="income"
          stackId="income"
          strokeWidth={2.4}
          stroke="#117a4b"
          fill="url(#income)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: '#117a4b' }}
          animationDuration={900}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stackId="expenses"
          strokeWidth={2.4}
          stroke="#c0392b"
          fill="url(#expenses)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: '#c0392b' }}
          animationDuration={900}
          animationEasing="ease-out"
        />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
