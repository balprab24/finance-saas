import { cn } from '@/lib/utils';

type Props = {
  /** Surface title, set in the brand grotesque (Schibsted Grotesk). */
  title: string;
  /** Quiet meta line under the title — count / period / "as of" freshness cue. */
  meta?: React.ReactNode;
  /** Right-aligned controls: filters, primary action. */
  actions?: React.ReactNode;
  className?: string;
};

// The document header shared by every statement surface: a grotesque title, a
// quiet meta line (count / period / "as of"), and a right-aligned actions slot,
// set over the major section rule. Replaces each page's floating h1 + inner h2,
// so every authenticated surface opens like the dashboard statement — one sheet
// with a masthead, not a title hovering above a separate boxed table.
export function PageMasthead({ title, meta, actions, className }: Props) {
  return (
    <div
      data-testid="page-masthead"
      className={cn(
        'flex flex-col gap-3 border-b border-[var(--aurex-rule)] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-medium leading-tight tracking-[-0.01em] text-[var(--aurex-text-1)] sm:text-[26px]">
          {title}
        </h1>
        {meta ? (
          <p className="mt-0.5 text-[12.5px] tabular-nums text-[var(--aurex-text-3)]">{meta}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
