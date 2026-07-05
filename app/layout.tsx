import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Schibsted_Grotesk, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';

import './globals.css';
import { QueryProvider } from '@/providers/query-provider';

// "Light Counter" type system: one grotesque (Schibsted Grotesk) carries UI and
// headings through weight contrast, with Geist Mono for tabular figures. Variable
// axis means no explicit weight array; --font-display points at the same grotesque
// (see globals.css @theme).
const grotesk = Schibsted_Grotesk({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The middleware CSP allows scripts by nonce ('strict-dynamic' disables host
  // allowlists), so Clerk must stamp the nonce onto the clerk-js script tag it
  // injects. Every page renders dynamically, so headers() is always available.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
      nonce={nonce}
      dynamic
    >
      <html
        lang="en"
        className={`${grotesk.variable} ${geistMono.variable}`}
      >
        <body suppressHydrationWarning className="antialiased">
          <QueryProvider>
            <Toaster theme="light" />
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
