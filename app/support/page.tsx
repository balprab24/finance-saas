import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';

export const metadata: Metadata = {
  title: 'Support — Aurex',
  description: 'How to get help with Aurex.',
};

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      updated="June 12, 2026"
      intro="How to get going with Aurex and where to turn when something is unclear."
      sections={[
        {
          heading: 'Getting started',
          paragraphs: [
            'Create a workspace, add an account, and import a bank CSV. You map its columns to a date, an amount, and a payee, then read the rows back as a reconciled statement.',
            <>
              The <Link href="/#how-it-works" className="underline underline-offset-2 hover:text-[var(--aurex-text-2)]">How it works</Link> section walks through that flow end to end.
            </>,
          ],
        },
        {
          heading: 'Supported imports',
          paragraphs: [
            'Aurex reads standard CSV exports. As long as the file has columns for the date, the amount, and a description or payee, you can map them during import — even if your bank names them differently.',
          ],
        },
        {
          heading: 'Your data',
          paragraphs: [
            <>
              For how Aurex stores and isolates your records, see the{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--aurex-text-2)]">Privacy</Link> page.
            </>,
          ],
        },
        {
          heading: 'Reaching us',
          paragraphs: [
            'Aurex is built by a small team and is early in its life. A dedicated support inbox is being set up; in the meantime, expect support channels to be announced here.',
          ],
        },
      ]}
    />
  );
}
