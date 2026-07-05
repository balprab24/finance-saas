import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';

// Rendered per-request so Next can stamp the middleware CSP nonce onto the
// page's inline scripts; a static prerender would ship nonce-less scripts
// that the strict CSP blocks.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Privacy — Aurex',
  description: 'How Aurex handles your financial data, in plain language.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="June 13, 2026"
      intro="Aurex is an early-stage personal-finance tool. This page explains, in plain language, how it handles your data today. It is a summary of how the product works, not a legal contract."
      sections={[
        {
          heading: 'What Aurex stores',
          paragraphs: [
            'The records you create or import: your accounts, categories, transactions, and any budgets you set. Amounts are stored as exact integer values, never as approximate floating-point numbers.',
            'A small amount of operational data needed to run the service: an identifier that ties your records to your sign-in, and internal logs and counters used to sync your data, diagnose problems, and prevent abuse.',
            'If you connect a bank, Aurex also stores data from that connection — see “Optional bank connections” below.',
          ],
        },
        {
          heading: 'Your workspace is scoped to you',
          paragraphs: [
            'Every record belongs to your account. Each request to the server is filtered by your account, so another signed-in user cannot read or change your data.',
          ],
        },
        {
          heading: 'CSV imports stay in your browser',
          paragraphs: [
            'When you import a bank CSV, the file is parsed in your browser. You map its columns to a date, an amount, and a payee, and review the rows before any of it is saved.',
          ],
        },
        {
          heading: 'Sign-in',
          paragraphs: [
            <>
              Authentication is handled by Clerk. Aurex never sees or stores your
              password.
            </>,
          ],
        },
        {
          heading: 'Optional bank connections',
          paragraphs: [
            'Connecting a bank through Plaid is optional. You can use Aurex entirely with manual entry and CSV imports if you prefer not to link an account.',
            'When you do link a bank, Aurex stores an access token for that connection — encrypted at rest — along with the account and transaction data Plaid syncs from it, and a record of each sync so it can keep your statement current. Disconnecting a bank revokes that token with Plaid so it can no longer be used, and the synced accounts are archived rather than erased so your past statements stay accurate.',
          ],
        },
        {
          heading: 'Deleting your data',
          paragraphs: [
            'You can delete transactions and categories. Deleting a category leaves its transactions in place, marked uncategorized. An account that still has transactions is archived rather than erased, so your past statements stay accurate.',
          ],
        },
        {
          heading: 'Questions',
          paragraphs: [
            <>
              See the <Link href="/support" className="underline underline-offset-2 hover:text-[var(--aurex-text-2)]">Support</Link> page for how to get in touch.
            </>,
          ],
        },
      ]}
    />
  );
}
