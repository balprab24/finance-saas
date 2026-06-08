import { cn } from '@/lib/utils';

type Props = {
  /** Section heading, set in the brand grotesque (Schibsted Grotesk). */
  title: string;
  /** Period / "as of" line under the title — the freshness trust cue. */
  caption?: string;
  /** Optional right-aligned node (legend, link). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

// The seed of the "Ledger" system: a statement section is a grotesque heading +
// optional period caption over a hairline rule, then its body. No enclosing card
// of its own — sections are composed inside one frame and separated by rules, so
// the page reads as a single statement rather than a stack of boxes.
export function StatementSection({ title, caption, action, className, children }: Props) {
  return (
    <section className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--aurex-border)] pb-3">
        <div className="min-w-0">
          <h3 className="font-display text-[19px] font-medium leading-tight tracking-[-0.01em] text-[var(--aurex-text-1)]">
            {title}
          </h3>
          {caption ? (
            <p className="mt-0.5 text-[12px] text-[var(--aurex-text-3)]">{caption}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
