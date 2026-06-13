import { cn, formatCurrency } from '@/lib/utils';

type Props = {
  /** Amount in dollars (not milliunits). */
  value: number;
  /** Show a leading "+" on positive values (negatives always show U+2212).
   *  Use for signed ledger figures like transaction amounts. */
  signed?: boolean;
  /** 'auto' colors by financial meaning (income green / expense red / zero
   *  graphite); 'neutral' keeps ink for plain totals and magnitudes; 'balance'
   *  is ink when ≥ 0 and red when negative (remaining / over-budget). */
  tone?: 'auto' | 'neutral' | 'balance';
  className?: string;
};

function toneClass(value: number, tone: 'auto' | 'neutral' | 'balance') {
  if (tone === 'neutral') return 'text-[var(--aurex-text-1)]';
  if (tone === 'balance') {
    return value < 0 ? 'text-[var(--aurex-expense)]' : 'text-[var(--aurex-text-1)]';
  }
  if (value > 0) return 'text-[var(--aurex-income)]';
  if (value < 0) return 'text-[var(--aurex-expense)]';
  return 'text-[var(--aurex-text-2)]';
}

// The ledger figure: every monetary value in the app set the way the landing
// statement sets it — Geist Mono, tabular figures, sign-driven money color, with
// a true minus (U+2212) so signs share the mono column width. Color is always
// paired with the sign, never carried by hue alone (color-blind safe).
export function LedgerAmount({ value, signed = false, tone = 'auto', className }: Props) {
  const sign = value < 0 ? '−' : signed && value > 0 ? '+' : '';
  return (
    <span className={cn('font-mono tabular-nums', toneClass(value, tone), className)}>
      {sign}
      {formatCurrency(Math.abs(value))}
    </span>
  );
}
