import { IconType } from 'react-icons';
import { VariantProps, cva } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';
import CountUp from 'react-countup';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const boxVariant = cva(
  'grid size-10 shrink-0 place-items-center rounded-[10px] ring-1',
  {
    variants: {
      variant: {
        default: 'bg-[rgba(99,102,241,0.12)] ring-[rgba(99,102,241,0.22)]',
        success: 'bg-[rgba(52,211,153,0.12)] ring-[rgba(52,211,153,0.24)]',
        danger: 'bg-[rgba(251,113,133,0.12)] ring-[rgba(251,113,133,0.24)]',
        warning: 'bg-[rgba(251,191,36,0.12)] ring-[rgba(251,191,36,0.24)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const iconVariant = cva('size-[18px]', {
  variants: {
    variant: {
      default: 'fill-[#a5b4fc] text-[#a5b4fc]',
      success: 'fill-[#34d399] text-[#34d399]',
      danger: 'fill-[#fb7185] text-[#fb7185]',
      warning: 'fill-[#fbbf24] text-[#fbbf24]',
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

export function DataCard({
  icon: Icon,
  title,
  value = 0,
  variant,
  dateRange,
  percentageChange = 0,
}: Props) {
  const trendClass =
    percentageChange > 0
      ? 'text-[#34d399] bg-[rgba(52,211,153,0.1)]'
      : percentageChange < 0
        ? 'text-[#fb7185] bg-[rgba(251,113,133,0.1)]'
        : 'text-[var(--aurex-text-3)] bg-[var(--aurex-surface)]';

  return (
    <div className="aurex-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="text-[13px] font-medium text-[var(--aurex-text-3)] line-clamp-1">
            {title}
          </div>
          {dateRange ? (
            <div className="text-[11px] text-[var(--aurex-text-4)] line-clamp-1">
              {dateRange}
            </div>
          ) : null}
        </div>
        <div className={cn(boxVariant({ variant }))}>
          <Icon className={cn(iconVariant({ variant }))} />
        </div>
      </div>
      <div className="mt-4 font-mono text-[26px] font-semibold tracking-tight tabular-nums text-[var(--aurex-text-1)] line-clamp-1 break-all sm:text-[30px]">
        <CountUp
          preserveValue
          start={0}
          end={value}
          decimals={2}
          decimalPlaces={2}
          formattingFn={formatCurrency}
        />
      </div>
      <span
        className={cn(
          'mt-3 inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-medium tabular-nums',
          trendClass,
        )}
      >
        {formatPercentage(percentageChange, { addPrefix: true })} vs last period
      </span>
    </div>
  );
}

export function DataCardLoading() {
  return (
    <div className="aurex-card h-[170px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 bg-white/8" />
          <Skeleton className="h-3 w-32 bg-white/8" />
        </div>
        <Skeleton className="size-10 rounded-[10px] bg-white/8" />
      </div>
      <Skeleton className="mt-4 h-8 w-32 bg-white/8" />
      <Skeleton className="mt-3 h-4 w-28 rounded-md bg-white/8" />
    </div>
  );
}
