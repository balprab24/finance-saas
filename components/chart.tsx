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

type Props = {
  data?: { date: Date | string; income: number; expenses: number }[];
};

export function Chart({ data = [] }: Props) {
  const [chartType, setChartType] = useState('area');

  return (
    <div className="aurex-card relative overflow-hidden p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[20px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Cash flow
          </h3>
          <p className="text-[13px] text-[var(--aurex-text-3)]">
            Income vs. expenses across the selected period
          </p>
        </div>
        <Select defaultValue={chartType} onValueChange={setChartType}>
          <SelectTrigger className="h-9 rounded-full border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-3.5 text-[13px] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] focus:ring-0 focus:ring-offset-0 lg:w-auto">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="area">
              <div className="flex items-center">
                <AreaChart className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Area chart</p>
              </div>
            </SelectItem>
            <SelectItem value="line">
              <div className="flex items-center">
                <LineChart className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Line chart</p>
              </div>
            </SelectItem>
            <SelectItem value="bar">
              <div className="flex items-center">
                <BarChart3 className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Bar chart</p>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 flex items-center gap-5 text-[12.5px] text-[var(--aurex-text-2)]">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#34d399] shadow-[0_0_10px_#34d399]" />
          Income
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#fb7185] shadow-[0_0_10px_#fb7185]" />
          Expenses
        </span>
      </div>
      <div className="mt-3">
        {data.length === 0 ? (
          <div className="flex h-[350px] w-full flex-col items-center justify-center gap-y-3 rounded-xl bg-[var(--aurex-surface)] ring-1 ring-[var(--aurex-border)]">
            <div className="rounded-full bg-[var(--aurex-surface-hover)] p-3">
              <FileSearch className="size-6 text-[var(--aurex-text-3)]" />
            </div>
            <p className="text-[14px] text-[var(--aurex-text-3)]">
              No transactions in this period.
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
    <div className="aurex-card relative overflow-hidden p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-7 w-40 bg-white/10" />
        <Skeleton className="h-9 w-full rounded-full bg-white/10 lg:w-[140px]" />
      </div>
      <Skeleton className="mt-6 h-[350px] w-full rounded-xl bg-white/10" />
    </div>
  );
}
