'use client';

import { useState } from 'react';
import { AreaChart, BarChart3, FileSearch, LineChart } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const onTypeChange = (type: string) => setChartType(type);

  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <CardTitle className="text-lg font-semibold tracking-tight line-clamp-1">
          Transactions
        </CardTitle>
        <Select defaultValue={chartType} onValueChange={onTypeChange}>
          <SelectTrigger className="lg:w-auto h-9 rounded-lg px-3">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="area">
              <div className="flex items-center">
                <AreaChart className="size-4 mr-2 shrink-0" />
                <p className="line-clamp-1">Area chart</p>
              </div>
            </SelectItem>
            <SelectItem value="line">
              <div className="flex items-center">
                <LineChart className="size-4 mr-2 shrink-0" />
                <p className="line-clamp-1">Line chart</p>
              </div>
            </SelectItem>
            <SelectItem value="bar">
              <div className="flex items-center">
                <BarChart3 className="size-4 mr-2 shrink-0" />
                <p className="line-clamp-1">Bar chart</p>
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
            <p className="text-muted-foreground text-sm">No transactions in this period.</p>
          </div>
        ) : (
          <>
            {chartType === 'area' && <AreaVariant data={data} />}
            {chartType === 'bar' && <BarVariant data={data} />}
            {chartType === 'line' && <LineVariant data={data} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ChartLoading() {
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
