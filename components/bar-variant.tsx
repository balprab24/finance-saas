'use client';

import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';
import { CASH_FLOW_COLORS } from '@/lib/colors';

type Props = {
  data: { date: Date | string; income: number; expenses: number }[];
};

export function BarVariant({ data }: Props) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22, 24, 29, 0.08)' }} />
          <Bar
            dataKey="income"
            fill={CASH_FLOW_COLORS.income}
            radius={[6, 6, 0, 0]}
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="expenses"
            fill={CASH_FLOW_COLORS.expenses}
            radius={[6, 6, 0, 0]}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
