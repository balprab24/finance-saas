'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  ArrowRight,
  CircleDollarSign,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Upload,
  WalletCards,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

const metrics = [
  { label: 'Remaining', value: '$8,420.50', tone: 'text-sky-300' },
  { label: 'Income', value: '$12,300.00', tone: 'text-emerald-300' },
  { label: 'Expenses', value: '$3,879.50', tone: 'text-rose-300' },
];

const features = [
  {
    icon: WalletCards,
    title: 'Organize accounts',
    description: 'Keep checking, savings, and cards in one clean workspace.',
  },
  {
    icon: PieChart,
    title: 'See spending clearly',
    description: 'Break expenses down by category, date range, and account.',
  },
  {
    icon: Upload,
    title: 'Import transactions',
    description: 'Bring in CSV activity and clean it up before saving.',
  },
];

function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 top-20 overflow-hidden opacity-85"
    >
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute left-1/2 top-20 w-[min(1040px,92vw)] -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900/90 p-4 shadow-2xl shadow-black/40 lg:top-12">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-sky-500 text-white">
              <CircleDollarSign className="size-5" />
            </div>
            <div>
              <div className="h-3 w-24 rounded bg-white/80" />
              <div className="mt-2 h-2 w-36 rounded bg-white/20" />
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="h-7 w-20 rounded-md bg-white/10" />
            <div className="h-7 w-24 rounded-md bg-sky-400/30" />
          </div>
        </div>

        <div className="grid gap-4 pt-4 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-white/45">
                {metric.label}
              </div>
              <div className={`mt-3 text-2xl font-semibold tracking-tight ${metric.tone}`}>
                {metric.value}
              </div>
              <div className="mt-4 h-2 rounded bg-white/10">
                <div className="h-2 w-2/3 rounded bg-current opacity-50" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="h-3 w-28 rounded bg-white/70" />
                <div className="mt-2 h-2 w-44 rounded bg-white/20" />
              </div>
              <TrendingUp className="size-5 text-emerald-300" />
            </div>
            <div className="flex h-44 items-end gap-3">
              {[42, 68, 52, 78, 61, 88, 72, 96, 84].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t bg-sky-300/70"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="h-3 w-24 rounded bg-white/70" />
                <div className="mt-2 h-2 w-32 rounded bg-white/20" />
              </div>
              <ShieldCheck className="size-5 text-emerald-300" />
            </div>
            <div className="space-y-3">
              {['Groceries', 'Rent', 'Dining', 'Transport'].map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-white/50" />
                  <div className="h-2 flex-1 rounded bg-white/15">
                    <div
                      className="h-2 rounded bg-emerald-300/70"
                      style={{ width: `${78 - index * 13}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const showDashboardCta = isLoaded && isSignedIn;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative min-h-[86svh] overflow-hidden">
        <DashboardPreview />

        <div className="relative z-10 mx-auto flex min-h-[86svh] max-w-screen-2xl flex-col px-5 py-5 sm:px-8 lg:px-14">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white">
              <CircleDollarSign className="size-7 text-sky-300" />
              <span className="text-xl font-semibold tracking-tight">Finance</span>
            </Link>

            <div className="flex items-center gap-2">
              {showDashboardCta ? (
                <Button asChild className="bg-white text-slate-950 hover:bg-sky-100">
                  <Link href="/dashboard">
                    Go to dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild className="bg-white text-slate-950 hover:bg-sky-100">
                  <Link href="/sign-up">
                    Create account
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                </>
              )}
            </div>
          </header>

          <div className="flex flex-1 items-center">
            <div className="max-w-2xl py-20">
              <p className="mb-4 inline-flex rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-sm text-sky-100">
                Personal finance tracking without the spreadsheet sprawl
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Finance
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                Track accounts, categorize transactions, import CSV activity, and understand cash flow from one focused dashboard.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {showDashboardCta ? (
                  <Button asChild size="lg" className="bg-sky-300 text-slate-950 hover:bg-sky-200">
                    <Link href="/dashboard">
                      Open dashboard
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                  <Button asChild size="lg" className="bg-sky-300 text-slate-950 hover:bg-sky-200">
                    <Link href="/sign-up">
                      Start tracking
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/20 bg-slate-950/70 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white px-5 py-14 text-slate-950 sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-screen-2xl gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <feature.icon className="size-6 text-sky-600" />
              <h2 className="mt-5 text-lg font-semibold tracking-tight">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
