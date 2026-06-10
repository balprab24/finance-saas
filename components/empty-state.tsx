'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type Props = {
  icon: LucideIcon;
  title: string;
  message?: string;
  /** A caller-provided primary action (Button or Link) rendered below the copy. */
  action?: ReactNode;
  className?: string;
};

// Shared first-run / no-data state for in-app surfaces (accounts, categories,
// budgets, ...). It is the empty sibling of `DataError`: the same house idiom —
// a dashed hairline surface, a neutral text-3 icon chip, ink title + text-3 copy —
// but for "nothing here yet" rather than a failed fetch, with an optional primary
// action so a first-time user is pointed at the next step instead of a blank table.
export function EmptyState({ icon: Icon, title, message, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--aurex-border)] bg-[var(--aurex-surface)] p-8 text-center',
        className,
      )}
    >
      <div className="rounded-full bg-[var(--aurex-surface-hover)] p-2.5">
        <Icon className="size-5 text-[var(--aurex-text-3)]" />
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-medium text-[var(--aurex-text-1)]">{title}</p>
        {message ? (
          <p className="mx-auto max-w-sm text-[12.5px] text-[var(--aurex-text-3)]">{message}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
