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
    <div className="aurex-card p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Top categories
          </h3>
          <p className="text-[12.5px] text-[var(--aurex-text-3)]">
            Where the money is going
          </p>
        </div>
        <Select defaultValue={chartType} onValueChange={setChartType}>
          <SelectTrigger className="h-8 w-full rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-2.5 text-[12.5px] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] focus:ring-0 focus:ring-offset-0 lg:w-[148px]">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pie">
              <div className="flex items-center">
                <PieChart className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Pie</p>
              </div>
            </SelectItem>
            <SelectItem value="radar">
              <div className="flex items-center">
                <Radar className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Radar</p>
              </div>
            </SelectItem>
            <SelectItem value="radial">
              <div className="flex items-center">
                <Target className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Radial</p>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4">
        {data.length === 0 ? (
          <div className="flex h-[340px] w-full flex-col items-center justify-center gap-y-3 rounded-md border border-dashed border-[var(--aurex-border)] bg-[var(--aurex-surface)]">
            <div className="rounded-full bg-[var(--aurex-surface-hover)] p-2.5">
              <FileSearch className="size-5 text-[var(--aurex-text-3)]" />
            </div>
            <p className="text-[13px] text-[var(--aurex-text-3)]">
              No spending in this period
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
    <div className="aurex-card p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-5 w-32 bg-white/8" />
        <Skeleton className="h-8 w-full rounded-md bg-white/8 lg:w-[148px]" />
      </div>
      <Skeleton className="mt-6 h-[340px] w-full rounded-md bg-white/8" />
    </div>
  );
}
