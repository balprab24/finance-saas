'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LedgerAmount } from '@/components/money';
import { PageMasthead } from '@/components/page-masthead';
import { StatementSection } from '@/components/statement-section';
import { StatementSheet } from '@/components/statement-sheet';
import { ImportTable } from './import-table';
import { convertAmountToMiliunits } from '@/lib/utils';
import { parseCsvDate } from '@/lib/csv-date';

const outputFormat = 'yyyy-MM-dd';
const requiredOptions = ['amount', 'date', 'payee'] as const;

type SelectedColumnsState = Record<string, string | null>;
type Step = 'map' | 'review';
type FormattedRow = { amount: number; date: string; payee: string; notes?: string };
type RowError = { row: number; reason: string };

type Props = {
  data: string[][];
  onCancel: () => void;
  onSubmit: (data: FormattedRow[]) => void;
};

function buildRows(data: string[][], selectedColumns: SelectedColumnsState) {
  const headers = data[0];
  const body = data.slice(1);

  const mappedHeaders = headers.map((_, index) => {
    const key = `column_${index}`;
    return selectedColumns[key] || null;
  });

  const mappedBody = body
    .map((row) => row.map((cell, index) => (selectedColumns[`column_${index}`] ? cell : null)))
    .filter((row) => row.some((c) => c !== null));

  const objects = mappedBody.map((row) =>
    row.reduce((acc: Record<string, string>, cell, index) => {
      const header = mappedHeaders[index];
      if (header !== null && cell !== null) acc[header] = cell;
      return acc;
    }, {}),
  );

  const errors: RowError[] = [];
  const formatted: FormattedRow[] = [];

  objects.forEach((item, index) => {
    const rowNumber = index + 2; // +1 for header, +1 for 1-based display
    const parsedDate = parseCsvDate(item.date);
    if (!parsedDate) {
      errors.push({ row: rowNumber, reason: `Unrecognized date "${item.date ?? ''}"` });
      return;
    }
    const amount = parseFloat(item.amount);
    if (Number.isNaN(amount)) {
      errors.push({ row: rowNumber, reason: `Invalid amount "${item.amount ?? ''}"` });
      return;
    }
    if (!item.payee || item.payee.trim().length === 0) {
      errors.push({ row: rowNumber, reason: 'Missing payee' });
      return;
    }
    formatted.push({
      payee: item.payee,
      amount: convertAmountToMiliunits(amount),
      date: format(parsedDate, outputFormat),
    });
  });

  // Detect duplicates within the import set itself (same date + amount + payee).
  const signatures = new Map<string, number[]>();
  formatted.forEach((row, i) => {
    const key = `${row.date}|${row.amount}|${row.payee.trim().toLowerCase()}`;
    const list = signatures.get(key) ?? [];
    list.push(i);
    signatures.set(key, list);
  });
  const duplicateIndices = new Set<number>();
  for (const indices of signatures.values()) {
    if (indices.length > 1) {
      // mark all but the first as duplicates
      indices.slice(1).forEach((i) => duplicateIndices.add(i));
    }
  }

  return { formatted, errors, duplicateIndices };
}

export function ImportCard({ data, onCancel, onSubmit }: Props) {
  const [step, setStep] = useState<Step>('map');
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumnsState>({});

  const onTableHeadSelectChange = (columnIndex: number, value: string | null) => {
    setSelectedColumns((prev) => {
      const next: SelectedColumnsState = { ...prev };
      for (const key in next) {
        if (next[key] === value) next[key] = null;
      }
      if (value === 'skip') value = null;
      next[`column_${columnIndex}`] = value;
      return next;
    });
  };

  const headers = data[0] ?? [];
  const body = data.slice(1);
  const progress = Object.values(selectedColumns).filter(Boolean).length;
  const canReview = progress >= requiredOptions.length;

  const { formatted, errors, duplicateIndices } = useMemo(
    () => (canReview ? buildRows(data, selectedColumns) : { formatted: [], errors: [], duplicateIndices: new Set<number>() }),
    [data, selectedColumns, canReview],
  );

  const submit = () => onSubmit(formatted);

  return (
    <StatementSheet
      masthead={
        <PageMasthead
          title="Import CSV"
          meta={step === 'map' ? 'Map your CSV columns' : 'Review before importing'}
          actions={<Stepper step={step} />}
        />
      }
    >
      {step === 'map' ? (
        <MapStep
          headers={headers}
          body={body}
          selectedColumns={selectedColumns}
          onTableHeadSelectChange={onTableHeadSelectChange}
          onCancel={onCancel}
          onContinue={() => setStep('review')}
          canContinue={canReview}
          progress={progress}
          requiredCount={requiredOptions.length}
        />
      ) : (
        <ReviewStep
          formatted={formatted}
          errors={errors}
          duplicateIndices={duplicateIndices}
          totalCsvRows={body.length}
          onBack={() => setStep('map')}
          onSubmit={submit}
        />
      )}
    </StatementSheet>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = [
    { key: 'map', label: '1. Map columns' },
    { key: 'review', label: '2. Review' },
  ] as const;
  return (
    <ol className="flex flex-wrap items-center gap-2 text-[12.5px]">
      {steps.map((s, i) => {
        const isActive = s.key === step;
        const isDone = step === 'review' && s.key === 'map';
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${
                isActive
                  ? 'border-[var(--aurex-border-strong)] bg-[var(--aurex-brand-soft)] text-[var(--aurex-brand-text)]'
                  : isDone
                    ? 'border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-2)]'
                    : 'border-[var(--aurex-border)] bg-transparent text-[var(--aurex-text-3)]'
              }`}
            >
              {isDone ? <CheckCircle2 className="size-3.5" /> : null}
              {s.label}
            </span>
            {i < steps.length - 1 ? (
              <span className="h-px w-6 bg-[var(--aurex-border)]" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function MapStep({
  headers,
  body,
  selectedColumns,
  onTableHeadSelectChange,
  onCancel,
  onContinue,
  canContinue,
  progress,
  requiredCount,
}: {
  headers: string[];
  body: string[][];
  selectedColumns: SelectedColumnsState;
  onTableHeadSelectChange: (columnIndex: number, value: string | null) => void;
  onCancel: () => void;
  onContinue: () => void;
  canContinue: boolean;
  progress: number;
  requiredCount: number;
}) {
  return (
    <StatementSection
      title="Map columns"
      caption="Pick a role for each column. Required: amount, date, payee."
    >
      <div className="mb-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center justify-center rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-2.5 py-1 text-[12px] text-[var(--aurex-text-2)]">
          {progress} / {requiredCount} required mapped
        </span>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={onCancel}
            size="sm"
            variant="outline"
            className="h-9 border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canContinue}
            onClick={onContinue}
            className="h-9 bg-[var(--aurex-brand)] hover:bg-[var(--aurex-bar)]"
          >
            Continue
            <ArrowRight className="ml-1.5 size-3.5" />
          </Button>
        </div>
      </div>
      <ImportTable
        headers={headers}
        body={body}
        selectedColumns={selectedColumns}
        onTableHeadSelectChange={onTableHeadSelectChange}
      />
    </StatementSection>
  );
}

function ReviewStep({
  formatted,
  errors,
  duplicateIndices,
  totalCsvRows,
  onBack,
  onSubmit,
}: {
  formatted: FormattedRow[];
  errors: RowError[];
  duplicateIndices: Set<number>;
  totalCsvRows: number;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const validCount = formatted.length;
  const dupCount = duplicateIndices.size;
  const errorCount = errors.length;
  const canSubmit = validCount > 0;

  return (
    <>
      <StatementSection
        title="Review summary"
        caption={`${totalCsvRows} CSV rows checked before import`}
        className="border-b border-[var(--aurex-rule)]"
      >
        <div className="grid gap-3 border-y border-[var(--aurex-border)] py-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryStat
            label="Ready to import"
            value={validCount}
            hint={`from ${totalCsvRows} CSV rows`}
            icon={<CheckCircle2 className="size-4 text-[var(--aurex-income)]" />}
          />
          <SummaryStat
            label="Invalid rows"
            value={errorCount}
            hint={errorCount > 0 ? 'will be skipped' : 'none'}
            icon={<XCircle className="size-4 text-[var(--aurex-expense)]" />}
          />
          <SummaryStat
            label="Likely duplicates"
            value={dupCount}
            hint={dupCount > 0 ? 'flagged in preview' : 'none'}
            icon={<AlertTriangle className="size-4 text-[var(--aurex-warn)]" />}
          />
        </div>

        {errorCount > 0 ? (
          <div className="mt-4 border-t border-[var(--aurex-expense-line)] bg-[var(--aurex-expense-soft)] p-4">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-[var(--aurex-expense)]" />
              <h3 className="text-[13.5px] font-semibold text-[var(--aurex-text-1)]">
                {errorCount} row{errorCount === 1 ? '' : 's'} will be skipped
              </h3>
            </div>
            <ul className="mt-2.5 max-h-40 space-y-1 overflow-y-auto pr-1 text-[12.5px]">
              {errors.slice(0, 50).map((e) => (
                <li
                  key={e.row}
                  className="flex items-baseline justify-between gap-2 text-[var(--aurex-text-2)]"
                >
                  <span className="font-mono text-[var(--aurex-text-3)]">row {e.row}</span>
                  <span className="flex-1 text-right">{e.reason}</span>
                </li>
              ))}
              {errorCount > 50 ? (
                <li className="text-[11.5px] text-[var(--aurex-text-3)]">
                  …and {errorCount - 50} more
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </StatementSection>

      <StatementSection title="Preview of valid rows">
        <div className="mb-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-9 border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
            onClick={onBack}
          >
            <ArrowLeft className="mr-1.5 size-3.5" />
            Back to mapping
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="h-9 bg-[var(--aurex-brand)] hover:bg-[var(--aurex-bar)]"
          >
            Import {validCount} {validCount === 1 ? 'transaction' : 'transactions'}
          </Button>
        </div>
        {validCount === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-4 py-8 text-center text-[13px] text-[var(--aurex-text-3)]">
            No valid rows to import. Go back and fix the column mapping.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--aurex-border)]">
            <table className="w-full min-w-[520px]">
              <thead className="bg-[var(--aurex-surface)] text-[11.5px] uppercase tracking-[0.08em] text-[var(--aurex-text-3)]">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Payee</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {formatted.slice(0, 25).map((row, i) => {
                  const isDup = duplicateIndices.has(i);
                  return (
                    <tr
                      key={`${row.date}-${row.payee}-${i}`}
                      className="border-t border-[var(--aurex-border)]"
                    >
                      <td className="px-3 py-2 font-mono text-[12.5px] text-[var(--aurex-text-2)]">
                        {row.date}
                      </td>
                      <td className="px-3 py-2 text-[var(--aurex-text-1)]">{row.payee}</td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        <LedgerAmount value={row.amount / 1000} signed className="text-[13px]" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {isDup ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--aurex-warn-soft)] px-1.5 py-0.5 text-[11.5px] font-medium text-[var(--aurex-warn)]">
                            <AlertTriangle className="size-3" />
                            Duplicate
                          </span>
                        ) : (
                          <span className="text-[11.5px] text-[var(--aurex-text-3)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {validCount > 25 ? (
              <div className="border-t border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-3 py-2 text-[11.5px] text-[var(--aurex-text-3)]">
                Showing first 25 of {validCount} rows
              </div>
            ) : null}
          </div>
        )}
      </StatementSection>
    </>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="p-1">
      <div className="flex items-start justify-between">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--aurex-text-3)]">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-1.5 text-[24px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
        {value}
      </div>
      <div className="text-[12px] text-[var(--aurex-text-3)]">{hint}</div>
    </div>
  );
}
