import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';

import './globals.css';
import { QueryProvider } from '@/providers/query-provider';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  axes: ['opsz'],
});
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aurex — Money, in clear view',
  description:
    'Aurex is a premium personal-finance workspace. Track accounts, categorize transactions, import CSVs, and understand cash flow with charts that tell the whole story.',
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
      <html lang="en" className={`dark ${inter.variable} ${geistMono.variable}`}>
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
