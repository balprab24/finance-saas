import { IconType } from 'react-icons';
import { VariantProps, cva } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';
import CountUp from 'react-countup';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const boxVariant = cva('shrink-0 rounded-xl p-3 ring-1', {
  variants: {
    variant: {
      default: 'bg-blue-500/10 ring-blue-500/20',
      success: 'bg-emerald-500/10 ring-emerald-500/20',
      danger: 'bg-rose-500/10 ring-rose-500/20',
      warning: 'bg-yellow-500/10 ring-yellow-500/20',
    },
  },
  defaultVariants: { variant: 'default' },
});

const iconVariant = cva('size-6', {
  variants: {
    variant: {
      default: 'fill-blue-500',
      success: 'fill-emerald-500',
      danger: 'fill-rose-500',
      warning: 'fill-yellow-500',
    },
  },
  defaultVariants: { variant: 'default' },
});

type BoxVariants = VariantProps<typeof boxVariant>;
type IconVariants = VariantProps<typeof iconVariant>;

type Props = BoxVariants &
  IconVariants & {
    icon: LucideIcon | IconType;
    title: string;
    value?: number;
    dateRange?: string;
    percentageChange?: number;
  };

export function DataCard({ icon: Icon, title, value = 0, variant, dateRange, percentageChange = 0 }: Props) {
  const trendClass =
    percentageChange > 0
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : percentageChange < 0
        ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
        : 'bg-slate-50 text-slate-600 ring-slate-500/20';

  return (
    <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between gap-x-4">
        <div className="space-y-1.5">
          <CardTitle className="text-sm font-medium tracking-tight text-muted-foreground line-clamp-1">
            {title}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-1">{dateRange}</CardDescription>
        </div>
        <div className={cn(boxVariant({ variant }))}>
          <Icon className={cn(iconVariant({ variant }))} />
        </div>
      </CardHeader>
      <CardContent>
        <h1 className="font-semibold text-3xl tracking-tight mb-3 line-clamp-1 break-all">
          <CountUp preserveValue start={0} end={value} decimals={2} decimalPlaces={2} formattingFn={formatCurrency} />
        </h1>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            trendClass,
          )}
        >
          {formatPercentage(percentageChange, { addPrefix: true })} vs last period
        </span>
      </CardContent>
    </Card>
  );
}

export function DataCardLoading() {
  return (
    <Card className="rounded-2xl border-none shadow-sm h-[192px]">
      <CardHeader className="flex flex-row items-center justify-between gap-x-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="size-12 rounded-xl" />
      </CardHeader>
      <CardContent>
        <Skeleton className="shrink-0 h-9 w-32 mb-3" />
        <Skeleton className="shrink-0 h-5 w-32 rounded-full" />
      </CardContent>
    </Card>
  );
}
