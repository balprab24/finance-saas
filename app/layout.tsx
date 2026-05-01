import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';

import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { SheetProvider } from '@/providers/sheet-provider';

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
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          suppressHydrationWarning
          className={`${inter.variable} ${geistMono.variable} antialiased`}
        >
          <QueryProvider>
            <SheetProvider />
            <Toaster theme="dark" />
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
