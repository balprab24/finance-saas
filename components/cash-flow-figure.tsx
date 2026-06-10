'use client';

import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';
import { CASH_FLOW_COLORS } from '@/lib/colors';

type Props = {
  data: { date: Date | string; income: number; expenses: number }[];
};

// Compact axis ticks: $940, $1.2k, $12k. A real Y axis means a value can be read
// off the chart at rest — no hover required — which the old gradient area chart
// (no Y axis) could not do.
function abbreviateCurrency(value: number) {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `$${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `$${Math.round(value)}`;
}

// Clamp the Y axis to a "nice" ceiling derived from the data instead of Recharts'
// `'auto'`. With spiky cash-flow (one paycheck, many near-zero days) `'auto'`
// pinned the top to the lone spike and flattened everything else onto the baseline,
// so the chart read as blank. A padded, rounded ceiling keeps the shape legible.
function niceCeiling(value: number) {
  if (value <= 0) return 100;
  const padded = value * 1.1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  return Math.ceil(padded / magnitude) * magnitude;
}

export function CashFlowFigure({ data }: Props) {
  const peak = data.reduce((max, d) => Math.max(max, d.income, d.expenses), 0);
  const yMax = niceCeiling(peak);

  // ResponsiveContainer measures a width:0 inner wrapper on first paint; a stable
  // sized div keeps the chart paintable across reflow and screenshot capture.
  return (
    <div className="h-[220px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          {/* Solid hairline horizontals — ruled statement lines, not the Recharts
              default dashed grid. */}
          <CartesianGrid stroke="var(--aurex-border)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => format(new Date(value), 'dd MMM')}
            tickMargin={12}
            minTickGap={28}
            tick={{ fill: 'var(--aurex-text-3)', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={56}
            domain={[0, yMax]}
            tickCount={5}
            allowDecimals={false}
            tickFormatter={abbreviateCurrency}
            tickMargin={8}
            tick={{ fill: 'var(--aurex-text-3)', fontSize: 11 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(22, 24, 29, 0.4)', strokeWidth: 1 }}
          />
          {/* Flat low-opacity tint under each line (a constant fill, not a
              gradient) so a near-flat series still reads as a shape. */}
          <Area
            type="monotone"
            dataKey="income"
            stroke={CASH_FLOW_COLORS.income}
            strokeWidth={2.5}
            fill={CASH_FLOW_COLORS.income}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: CASH_FLOW_COLORS.income }}
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke={CASH_FLOW_COLORS.expenses}
            strokeWidth={2.5}
            fill={CASH_FLOW_COLORS.expenses}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: CASH_FLOW_COLORS.expenses }}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
