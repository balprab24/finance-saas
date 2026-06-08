'use client';

import { format } from 'date-fns';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';

type Props = {
  data: { date: Date | string; income: number; expenses: number }[];
};

export function LineVariant({ data }: Props) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="date"
            tickFormatter={(v) => format(new Date(v), 'dd MMM')}
            style={{ fontSize: '12px', fill: 'var(--aurex-text-3)' }}
            tick={{ fill: 'var(--aurex-text-3)' }}
            tickMargin={16}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(22, 24, 29,0.4)', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#117a4b' }}
            dataKey="income"
            stroke="#117a4b"
            strokeWidth={2.4}
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#c0392b' }}
            dataKey="expenses"
            stroke="#c0392b"
            strokeWidth={2.4}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
