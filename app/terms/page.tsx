import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';

export const metadata: Metadata = {
  title: 'Terms — Aurex',
  description: 'Plain-language terms for using Aurex.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="June 12, 2026"
      intro="Plain-language terms for using Aurex while it is in active development. They describe how the product is meant to be used and set expectations while features are still settling."
      sections={[
        {
          heading: 'Using the service',
          paragraphs: [
            'Aurex is a personal-finance tool for keeping your own records: tracking accounts, categories, and transactions, and reading them back as a reconciled statement.',
          ],
        },
        {
          heading: 'About the figures',
          paragraphs: [
            'Sample numbers shown on the marketing pages are illustrative. The statements inside your workspace reflect only the data you enter or import.',
            'Aurex reports your numbers; it does not provide financial, tax, or investment advice.',
          ],
        },
        {
          heading: 'Availability and changes',
          paragraphs: [
            'Aurex is an early product. Features may change, and the service is provided on an as-is basis while it develops.',
          ],
        },
        {
          heading: 'Your account',
          paragraphs: [
            'You are responsible for keeping your sign-in secure and for the accuracy of the records you add.',
          ],
        },
        {
          heading: 'Updates to these terms',
          paragraphs: [
            'These terms may be updated as the product matures. The date above reflects the most recent revision.',
          ],
        },
      ]}
    />
  );
}
