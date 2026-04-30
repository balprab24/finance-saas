'use client';

import { useState } from 'react';
import { FileSearch, PieChart, Radar, Target } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <CardTitle className="text-lg font-semibold tracking-tight line-clamp-1">
          Categories
        </CardTitle>
        <Select defaultValue={chartType} onValueChange={setChartType}>
          <SelectTrigger className="lg:w-auto h-9 rounded-lg px-3">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pie">
              <div className="flex items-center">
                <PieChart className="size-4 mr-2 shrink-0" />
                <p className="line-clamp-1">Pie chart</p>
              </div>
            </SelectItem>
            <SelectItem value="radar">
              <div className="flex items-center">
                <Radar className="size-4 mr-2 shrink-0" />
                <p className="line-clamp-1">Radar chart</p>
              </div>
            </SelectItem>
            <SelectItem value="radial">
              <div className="flex items-center">
                <Target className="size-4 mr-2 shrink-0" />
                <p className="line-clamp-1">Radial chart</p>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col gap-y-3 items-center justify-center h-[350px] w-full rounded-xl bg-muted/30">
            <div className="rounded-full bg-muted p-3">
              <FileSearch className="size-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No spending in this period.</p>
          </div>
        ) : (
          <>
            {chartType === 'pie' && <PieVariant data={data} />}
            {chartType === 'radar' && <RadarVariant data={data} />}
            {chartType === 'radial' && <RadialVariant data={data} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SpendingPieLoading() {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 lg:w-[140px] w-full rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}
