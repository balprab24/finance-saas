'use client';

import { Legend, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

// Qualitative palette for category breakdowns — distinct hues led by the brand
// indigo. Categorical data needs separable colors; the decorative chrome stays
// single-indigo elsewhere.
const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#fb7185', '#a78bfa', '#34d399'];

type Props = { data: { name: string; value: number }[] };

export function RadialVariant({ data }: Props) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
        cx="50%"
        cy="48%"
        barSize={14}
        innerRadius="28%"
        outerRadius="92%"
        data={data.map((item, index) => ({ ...item, fill: COLORS[index % COLORS.length] }))}
      >
        <RadialBar
          label={{ position: 'insideStart', fill: '#f5f7ff', fontSize: 11 }}
          background={{ fill: 'rgba(148,163,255,0.08)' }}
          cornerRadius={4}
          dataKey="value"
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="right"
          iconType="circle"
          content={({ payload }) => (
            <ul className="flex flex-col space-y-2">
              {payload?.map((entry, index) => (
                <li key={`item-${index}`} className="flex items-center space-x-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="space-x-1">
                    <span className="text-[13px] text-[var(--aurex-text-2)]">{entry.value}</span>
                    <span className="text-[13px] font-medium text-[var(--aurex-text-1)]">
                      {formatCurrency((entry.payload as unknown as { value: number }).value)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
