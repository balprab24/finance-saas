import type { Metadata } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';

import './globals.css';
import { QueryProvider } from '@/providers/query-provider';

// Editorial type system: a serif display face for headlines, a clean grotesk for
// body/UI, and a mono for tabular figures. Deliberately not Inter.
const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  axes: ['opsz'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://aurex.app'),
  title: {
    default: 'Aurex',
    template: '%s · Aurex',
  },
  description:
    'Aurex is a personal-finance workspace for tracking accounts, categorizing transactions, importing CSVs, and reading your cash flow — exact to the cent.',
  openGraph: {
    title: 'Aurex',
    description: 'A personal-finance workspace. Every dollar, accounted for.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
    >
      <html
        lang="en"
        className={`dark ${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}
      >
        <body suppressHydrationWarning className="antialiased">
          <QueryProvider>
            <Toaster theme="dark" />
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
