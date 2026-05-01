import { IconType } from 'react-icons';
import { VariantProps, cva } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';
import CountUp from 'react-countup';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const boxVariant = cva('grid size-11 shrink-0 place-items-center rounded-[12px] ring-1 transition-shadow', {
  variants: {
    variant: {
      default:
        'bg-[rgba(99,102,241,0.16)] ring-[rgba(99,102,241,0.32)] shadow-[0_0_24px_rgba(99,102,241,0.28)]',
      success:
        'bg-[rgba(52,211,153,0.16)] ring-[rgba(52,211,153,0.36)] shadow-[0_0_24px_rgba(52,211,153,0.32)]',
      danger:
        'bg-[rgba(251,113,133,0.16)] ring-[rgba(251,113,133,0.36)] shadow-[0_0_24px_rgba(251,113,133,0.32)]',
      warning:
        'bg-[rgba(251,191,36,0.16)] ring-[rgba(251,191,36,0.36)] shadow-[0_0_24px_rgba(251,191,36,0.32)]',
    },
  },
  defaultVariants: { variant: 'default' },
});

const iconVariant = cva('size-5', {
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
      ? 'text-[#34d399] bg-[rgba(52,211,153,0.12)] ring-[rgba(52,211,153,0.32)]'
      : percentageChange < 0
        ? 'text-[#fb7185] bg-[rgba(251,113,133,0.12)] ring-[rgba(251,113,133,0.32)]'
        : 'text-[var(--aurex-text-2)] bg-[var(--aurex-surface)] ring-[var(--aurex-border)]';

  return (
    <div className="aurex-card aurex-card-hover relative overflow-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-[15px] font-medium tracking-tight text-[var(--aurex-text-2)] line-clamp-1">
            {title}
          </div>
          {dateRange ? (
            <div className="text-[12px] text-[var(--aurex-text-3)] line-clamp-1">
              {dateRange}
            </div>
          ) : null}
        </div>
        <div className={cn(boxVariant({ variant }))}>
          <Icon className={cn(iconVariant({ variant }))} />
        </div>
      </div>
      <div className="mt-5 text-[34px] font-semibold tracking-tight text-[var(--aurex-text-1)] line-clamp-1 break-all sm:text-[40px]">
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
          'mt-4 inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ring-1',
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
    <div className="aurex-card relative h-[208px] overflow-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-3 w-40 bg-white/10" />
        </div>
        <Skeleton className="size-11 rounded-[12px] bg-white/10" />
      </div>
      <Skeleton className="mt-5 h-9 w-32 bg-white/10" />
      <Skeleton className="mt-4 h-5 w-32 rounded-full bg-white/10" />
    </div>
  );
}
