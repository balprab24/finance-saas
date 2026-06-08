'use client';

import { Legend, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

// Qualitative palette for category breakdowns: distinct hues for separable data,
// with decorative chrome kept neutral elsewhere.
const COLORS = ['#16181d', '#5b6470', '#b45309', '#c0392b', '#6b7280', '#117a4b'];

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
          label={{ position: 'insideStart', fill: '#ffffff', fontSize: 11 }}
          background={{ fill: 'rgba(0,0,0,0.06)' }}
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
