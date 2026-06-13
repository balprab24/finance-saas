import { cn } from '@/lib/utils';

type Props = {
  /** The document header — typically a <PageMasthead />. */
  masthead: React.ReactNode;
  /** Sheet body. Manage its own padding (a padded region, a full-bleed table,
   *  or composed <StatementSection />s separated by hairlines). */
  children: React.ReactNode;
  className?: string;
};

// One ruled statement sheet: the framed page surface every authenticated route
// shares (mirrors the dashboard at app/(dashboard)/dashboard/page.tsx). A
// masthead over the major rule, then a body whose sections are divided by
// hairlines inside one frame — never a stack of separate boxes.
export function StatementSheet({ masthead, children, className }: Props) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl pb-16 pt-6">
      <div
        data-testid="statement-sheet"
        className={cn('aurex-card overflow-hidden p-0', className)}
      >
        {masthead}
        {children}
      </div>
    </div>
  );
}
