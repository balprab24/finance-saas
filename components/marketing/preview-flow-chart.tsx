"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { AUREX_COLORS, CASH_FLOW_COLORS } from "@/lib/colors";

type Variant = "Area" | "Line" | "Bar";
const INCOME = CASH_FLOW_COLORS.income;
const EXPENSES = CASH_FLOW_COLORS.expenses;

function ToggleButtons({
  active,
  onChange,
  size,
}: {
  active: Variant;
  onChange: (v: Variant) => void;
  size: "sm" | "lg";
}) {
  const gap = size === "sm" ? "gap-1" : "gap-1.5";
  const padding = size === "sm" ? "px-2 py-1" : "px-2.5 py-1";
  const textSize = size === "sm" ? "text-[11.5px]" : "text-[13px]";
  return (
    <div className={`flex items-center ${gap}`}>
      {(["Area", "Line", "Bar"] as Variant[]).map((v) => {
        const isActive = active === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={isActive}
            className={`rounded-md ${padding} ${textSize} font-medium transition-colors ${
              isActive
                ? "bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)] ring-1 ring-[var(--aurex-border-strong)]"
                : "text-[var(--aurex-text-3)] hover:text-[var(--aurex-text-1)]"
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

function GridLines({ rows, width }: { rows: number; width: number }) {
  const step = width === 600 ? 36 : 40;
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <line
          key={i}
          x1="0"
          x2={width}
          y1={step * (i + 1)}
          y2={step * (i + 1)}
          stroke="rgba(0,0,0,0.08)"
        />
      ))}
    </>
  );
}

const SMALL_INCOME =
  "M0,110 C60,90 100,40 160,52 C220,64 260,28 320,40 C380,52 420,80 480,58 C540,40 580,30 600,18";
const SMALL_EXPENSE =
  "M0,140 C60,130 100,110 160,118 C220,126 260,100 320,108 C380,116 420,130 480,118 C540,108 580,120 600,114";

function SmallLineOrArea({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 600 180" className="mt-3 h-[170px] w-full">
      <defs>
        <linearGradient id="smIncome" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={INCOME} stopOpacity="0.55" />
          <stop offset="100%" stopColor={INCOME} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="smExpense" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={EXPENSES} stopOpacity="0.45" />
          <stop offset="100%" stopColor={EXPENSES} stopOpacity="0" />
        </linearGradient>
      </defs>
      <GridLines rows={4} width={600} />
      {filled && (
        <path d={`${SMALL_EXPENSE} L600,180 L0,180 Z`} fill="url(#smExpense)" />
      )}
      <path d={SMALL_EXPENSE} fill="none" stroke={EXPENSES} strokeWidth="2" />
      {filled && (
        <path d={`${SMALL_INCOME} L600,180 L0,180 Z`} fill="url(#smIncome)" />
      )}
      <path d={SMALL_INCOME} fill="none" stroke={INCOME} strokeWidth="2.2" />
      <circle cx="600" cy="18" r="4" fill={INCOME}>
        <animate
          attributeName="r"
          values="4;6;4"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="600" cy="114" r="3" fill={EXPENSES}>
        <animate
          attributeName="r"
          values="3;5;3"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

function SmallBar() {
  const buckets = [
    { income: 80, expense: 32 },
    { income: 108, expense: 54 },
    { income: 138, expense: 66 },
    { income: 96, expense: 42 },
    { income: 128, expense: 58 },
    { income: 90, expense: 50 },
    { income: 120, expense: 62 },
    { income: 152, expense: 74 },
  ];
  const bottom = 170;
  const startX = 28;
  const bucketW = 72;
  const barW = 26;
  const inner = 4;
  return (
    <svg viewBox="0 0 600 180" className="mt-3 h-[170px] w-full">
      <defs>
        <linearGradient id="smBarInc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={INCOME} stopOpacity="0.95" />
          <stop offset="100%" stopColor={INCOME} stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="smBarExp" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={EXPENSES} stopOpacity="0.95" />
          <stop offset="100%" stopColor={EXPENSES} stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <GridLines rows={4} width={600} />
      {buckets.map((b, i) => {
        const x = startX + i * bucketW;
        return (
          <g key={i}>
            <rect
              x={x}
              y={bottom - b.income}
              width={barW}
              height={b.income}
              rx={3}
              fill="url(#smBarInc)"
            />
            <rect
              x={x + barW + inner}
              y={bottom - b.expense}
              width={barW}
              height={b.expense}
              rx={3}
              fill="url(#smBarExp)"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function PreviewFlowChartSmall() {
  const [variant, setVariant] = useState<Variant>("Area");
  return (
    <div className="aurex-card-marketing relative overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-[var(--aurex-text-1)]">
            Cash flow
          </div>
          <div className="text-[11px] text-[var(--aurex-text-3)]">
            Income vs. expenses · daily
          </div>
        </div>
        <ToggleButtons active={variant} onChange={setVariant} size="sm" />
      </div>
      {variant === "Bar" ? (
        <SmallBar />
      ) : (
        <SmallLineOrArea filled={variant === "Area"} />
      )}
      <div className="mt-2 flex items-center gap-4 text-[11px] text-[var(--aurex-text-2)]">
        <span
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: INCOME }}
        />
        Income
        <span
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: EXPENSES }}
        />
        Expenses
      </div>
    </div>
  );
}

const LARGE_INCOME =
  "M0,180 C100,160 180,90 260,108 C340,128 420,60 500,80 C580,100 660,150 740,118 C820,90 900,40 980,68 C1060,98 1140,50 1200,30";
const LARGE_EXPENSE =
  "M0,210 C100,200 180,180 260,186 C340,194 420,160 500,170 C580,180 660,200 740,180 C820,160 900,170 980,160 C1060,150 1140,170 1200,158";

function LargeLineOrArea({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 1200 280" className="h-[260px] w-full">
      <defs>
        <linearGradient id="lgIncome" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={INCOME} stopOpacity="0.45" />
          <stop offset="100%" stopColor={INCOME} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lgExpense" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={EXPENSES} stopOpacity="0.4" />
          <stop offset="100%" stopColor={EXPENSES} stopOpacity="0" />
        </linearGradient>
      </defs>
      <GridLines rows={6} width={1200} />
      {filled && (
        <path
          d={`${LARGE_EXPENSE} L1200,280 L0,280 Z`}
          fill="url(#lgExpense)"
        />
      )}
      <path d={LARGE_EXPENSE} fill="none" stroke={EXPENSES} strokeWidth="2" />
      {filled && (
        <path d={`${LARGE_INCOME} L1200,280 L0,280 Z`} fill="url(#lgIncome)" />
      )}
      <path d={LARGE_INCOME} fill="none" stroke={INCOME} strokeWidth="2.5" />
    </svg>
  );
}

function LargeBar() {
  const buckets = [
    { income: 92, expense: 48 },
    { income: 118, expense: 60 },
    { income: 148, expense: 68 },
    { income: 108, expense: 54 },
    { income: 138, expense: 62 },
    { income: 96, expense: 56 },
    { income: 142, expense: 70 },
    { income: 106, expense: 50 },
    { income: 162, expense: 72 },
    { income: 132, expense: 64 },
    { income: 178, expense: 80 },
    { income: 204, expense: 92 },
  ];
  const bottom = 260;
  const startX = 30;
  const bucketW = 96;
  const barW = 34;
  const inner = 6;
  return (
    <svg viewBox="0 0 1200 280" className="h-[260px] w-full">
      <defs>
        <linearGradient id="lgBarInc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={INCOME} stopOpacity="0.95" />
          <stop offset="100%" stopColor={INCOME} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="lgBarExp" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={EXPENSES} stopOpacity="0.95" />
          <stop offset="100%" stopColor={EXPENSES} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <GridLines rows={6} width={1200} />
      {buckets.map((b, i) => {
        const x = startX + i * bucketW;
        return (
          <g key={i}>
            <rect
              x={x}
              y={bottom - b.income}
              width={barW}
              height={b.income}
              rx={4}
              fill="url(#lgBarInc)"
            />
            <rect
              x={x + barW + inner}
              y={bottom - b.expense}
              width={barW}
              height={b.expense}
              rx={4}
              fill="url(#lgBarExp)"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function PreviewFlowChartLarge() {
  const [variant, setVariant] = useState<Variant>("Area");
  return (
    <div
      className="aurex-card-marketing aurex-reveal relative overflow-hidden p-6 sm:p-7"
      data-reveal
      style={{ ["--reveal-delay" as string]: "120ms" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between border-b border-[var(--aurex-border)] pb-4">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="size-4" style={{ color: AUREX_COLORS.ink }} />
          <span className="text-[14px] font-semibold text-[var(--aurex-text-1)]">
            Cash flow · Last 90 days
          </span>
        </div>
        <ToggleButtons active={variant} onChange={setVariant} size="lg" />
      </div>
      <div className="pt-6">
        {variant === "Bar" ? (
          <LargeBar />
        ) : (
          <LargeLineOrArea filled={variant === "Area"} />
        )}
      </div>
    </div>
  );
}
