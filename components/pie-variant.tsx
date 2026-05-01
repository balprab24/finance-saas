'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryTooltip } from '@/components/category-tooltip';
import { formatPercentage } from '@/lib/utils';

const COLORS = ['#6366f1', '#22d3ee', '#34d399', '#fb7185', '#fbbf24', '#a78bfa'];

type Props = { data: { name: string; value: number }[] };

export function PieVariant({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
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
                      {formatPercentage((entry.payload as unknown as { percent: number }).percent * 100)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        />
        <Tooltip content={<CategoryTooltip />} />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={92}
          innerRadius={62}
          paddingAngle={3}
          fill="#6366f1"
          dataKey="value"
          labelLine={false}
          stroke="rgba(11,15,36,0.6)"
          strokeWidth={2}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
