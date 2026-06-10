'use client';

import { useState } from 'react';
import { AreaChart, BarChart3, FileSearch, LineChart } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaVariant } from '@/components/area-variant';
import { BarVariant } from '@/components/bar-variant';
import { LineVariant } from '@/components/line-variant';
import { CASH_FLOW_COLORS } from '@/lib/colors';

type Props = {
  data?: { date: Date | string; income: number; expenses: number }[];
};

export function Chart({ data = [] }: Props) {
  const [chartType, setChartType] = useState('area');

  return (
    <div className="aurex-card p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Cash flow
          </h3>
          <p className="text-[12.5px] text-[var(--aurex-text-3)]">
            Income vs. expenses across the selected period
          </p>
        </div>
        <Select defaultValue={chartType} onValueChange={setChartType}>
          <SelectTrigger className="h-8 w-full rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-2.5 text-[12.5px] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] focus:ring-0 focus:ring-offset-0 lg:w-[148px]">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="area">
              <div className="flex items-center">
                <AreaChart className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Area</p>
              </div>
            </SelectItem>
            <SelectItem value="line">
              <div className="flex items-center">
                <LineChart className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Line</p>
              </div>
            </SelectItem>
            <SelectItem value="bar">
              <div className="flex items-center">
                <BarChart3 className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Bar</p>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-3 flex items-center gap-5 text-[12px] text-[var(--aurex-text-2)]">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: CASH_FLOW_COLORS.income }}
          />
          Income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: CASH_FLOW_COLORS.expenses }}
          />
          Expenses
        </span>
      </div>
      <div className="mt-3">
        {data.length === 0 ? (
          <div className="flex h-[340px] w-full flex-col items-center justify-center gap-y-3 rounded-md border border-dashed border-[var(--aurex-border)] bg-[var(--aurex-surface)]">
            <div className="rounded-full bg-[var(--aurex-surface-hover)] p-2.5">
              <FileSearch className="size-5 text-[var(--aurex-text-3)]" />
            </div>
            <p className="text-[13px] text-[var(--aurex-text-3)]">
              No transactions in this period
            </p>
          </div>
        ) : (
          <>
            {chartType === 'area' && <AreaVariant data={data} />}
            {chartType === 'bar' && <BarVariant data={data} />}
            {chartType === 'line' && <LineVariant data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

export function ChartLoading() {
  return (
    <div className="aurex-card p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-5 w-32 bg-black/[0.06]" />
        <Skeleton className="h-8 w-full rounded-md bg-black/[0.06] lg:w-[148px]" />
      </div>
      <Skeleton className="mt-6 h-[340px] w-full rounded-md bg-black/[0.06]" />
    </div>
  );
}
