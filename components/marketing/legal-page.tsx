import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';

const SHELL = 'mx-auto w-full max-w-[760px] px-6 sm:px-8';

export type LegalSection = { heading: string; paragraphs: ReactNode[] };

/* Shared chrome for the lightweight legal/support pages. Same Light Counter
   register as the landing page — light paper, graphite ink, ruled headers, no
   brand hue — but standalone (no scroll-spy nav) so each page reads as a document. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-[var(--aurex-bg)] text-[var(--aurex-text-1)] antialiased">
      <header className="border-b border-[var(--aurex-border)] bg-[var(--aurex-bg-elev)]">
        <div className={`${SHELL} flex h-[68px] items-center justify-between`}>
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[17px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
              Aurex
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--aurex-text-2)] transition-colors hover:text-[var(--aurex-text-1)]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </div>
      </header>

      <article className={`${SHELL} py-14 sm:py-20`}>
        <p className="font-mono text-[12.5px] tabular-nums text-[var(--aurex-text-3)]">
          Last updated {updated}
        </p>
        <h1 className="mt-4 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--aurex-text-1)] sm:text-[52px]">
          {title}
        </h1>
        <p className="mt-6 max-w-[640px] text-[17px] leading-[1.65] text-[var(--aurex-text-2)]">
          {intro}
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="border-b border-[var(--aurex-border-strong)] pb-2.5 text-[15px] font-semibold text-[var(--aurex-text-2)]">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-3.5">
                {section.paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-[16px] leading-[1.65] text-[var(--aurex-text-1)]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <footer className="border-t border-[var(--aurex-border)] py-10">
        <div className={`${SHELL} flex items-center justify-between`}>
          <span className="text-[12.5px] text-[var(--aurex-text-3)]">
            © {new Date().getFullYear()} Aurex
          </span>
          <nav className="flex items-center gap-x-6">
            <Link
              href="/privacy"
              className="text-[13px] text-[var(--aurex-text-2)] transition-colors hover:text-[var(--aurex-text-1)]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[13px] text-[var(--aurex-text-2)] transition-colors hover:text-[var(--aurex-text-1)]"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="text-[13px] text-[var(--aurex-text-2)] transition-colors hover:text-[var(--aurex-text-1)]"
            >
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
