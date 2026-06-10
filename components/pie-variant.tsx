'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryTooltip } from '@/components/category-tooltip';
import { AUREX_COLORS, CATEGORY_CHART_COLORS } from '@/lib/colors';
import { formatPercentage } from '@/lib/utils';

type Props = { data: { name: string; value: number }[] };

export function PieVariant({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="right"
          iconType="circle"
          content={({ payload }) => (
            <ul className="flex flex-col space-y-2">
              {payload?.map((entry, index) => {
                const value = (entry.payload as unknown as { value: number }).value;
                const percent = total > 0 ? (value / total) * 100 : 0;
                return (
                  <li key={`item-${index}`} className="flex items-center space-x-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="space-x-1">
                      <span className="text-[13px] text-[var(--aurex-text-2)]">{entry.value}</span>
                      <span className="text-[13px] font-medium text-[var(--aurex-text-1)]">
                        {formatPercentage(percent)}
                      </span>
                    </div>
                  </li>
                );
              })}
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
          fill={AUREX_COLORS.ink}
          dataKey="value"
          labelLine={false}
          stroke={AUREX_COLORS.surface}
          strokeWidth={2}
          animationDuration={800}
          animationBegin={0}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]} />
          ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
