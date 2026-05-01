'use client';

import { Legend, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#6366f1', '#22d3ee', '#34d399', '#fb7185', '#fbbf24', '#a78bfa'];

type Props = { data: { name: string; value: number }[] };

export function RadialVariant({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadialBarChart
        cx="50%"
        cy="30%"
        barSize={10}
        innerRadius="90%"
        outerRadius="40%"
        data={data.map((item, index) => ({ ...item, fill: COLORS[index % COLORS.length] }))}
      >
        <RadialBar
          label={{ position: 'insideStart', fill: '#f5f7ff', fontSize: 12 }}
          background={{ fill: 'rgba(148,163,255,0.1)' }}
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
                    style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
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
  );
}
