'use client';

import { useState } from 'react';
import { FileSearch, PieChart, Radar, Target } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieVariant } from '@/components/pie-variant';
import { RadarVariant } from '@/components/radar-variant';
import { RadialVariant } from '@/components/radial-variant';

type Props = {
  data?: { name: string; value: number }[];
};

export function SpendingPie({ data = [] }: Props) {
  const [chartType, setChartType] = useState('pie');

  return (
    <div className="aurex-card relative overflow-hidden p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[20px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Top categories
          </h3>
          <p className="text-[13px] text-[var(--aurex-text-3)]">
            Where the money is going
          </p>
        </div>
        <Select defaultValue={chartType} onValueChange={setChartType}>
          <SelectTrigger className="h-9 rounded-full border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-3.5 text-[13px] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] focus:ring-0 focus:ring-offset-0 lg:w-auto">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pie">
              <div className="flex items-center">
                <PieChart className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Pie chart</p>
              </div>
            </SelectItem>
            <SelectItem value="radar">
              <div className="flex items-center">
                <Radar className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Radar chart</p>
              </div>
            </SelectItem>
            <SelectItem value="radial">
              <div className="flex items-center">
                <Target className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Radial chart</p>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-5">
        {data.length === 0 ? (
          <div className="flex h-[350px] w-full flex-col items-center justify-center gap-y-3 rounded-xl bg-[var(--aurex-surface)] ring-1 ring-[var(--aurex-border)]">
            <div className="rounded-full bg-[var(--aurex-surface-hover)] p-3">
              <FileSearch className="size-6 text-[var(--aurex-text-3)]" />
            </div>
            <p className="text-[14px] text-[var(--aurex-text-3)]">
              No spending in this period.
            </p>
          </div>
        ) : (
          <>
            {chartType === 'pie' && <PieVariant data={data} />}
            {chartType === 'radar' && <RadarVariant data={data} />}
            {chartType === 'radial' && <RadialVariant data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

export function SpendingPieLoading() {
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
