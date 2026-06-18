'use client';

import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';
import { CASH_FLOW_COLORS } from '@/lib/colors';
import { formatCurrency } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

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
  const reduceMotion = usePrefersReducedMotion();

  // The SVG carries no semantics, so it is hidden from assistive tech and the data
  // is exposed as a visually-hidden table instead — the canonical non-visual
  // reading of the same series, also available to users who can't hover.
  return (
    <figure className="m-0">
      <div className="h-[220px] w-full sm:h-[300px]" aria-hidden="true">
        {/* ResponsiveContainer measures a width:0 inner wrapper on first paint; a
            stable sized div keeps the chart paintable across reflow and capture. */}
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
            isAnimationActive={!reduceMotion}
            animationDuration={reduceMotion ? 0 : 700}
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
            isAnimationActive={!reduceMotion}
            animationDuration={reduceMotion ? 0 : 700}
            animationEasing="ease-out"
          />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Non-visual equivalent of the chart: the same series as a table, read by
          screen readers and reachable without hover. */}
      <figcaption className="sr-only">
        <table>
          <caption>Daily income and expenses for the selected period.</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Income</th>
              <th scope="col">Expenses</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={String(d.date)}>
                <th scope="row">{format(new Date(d.date), 'MMM d, yyyy')}</th>
                <td>{formatCurrency(d.income)}</td>
                <td>{formatCurrency(d.expenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
