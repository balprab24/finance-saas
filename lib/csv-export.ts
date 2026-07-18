// Pure CSV assembly for the transactions export. Two rules govern the format:
//
// 1. Formula-injection guard: user-entered text starting with = + - @ TAB or CR
//    gets an apostrophe prefix so spreadsheet apps treat it as text, never as a
//    formula. Applied to text columns only — amount/date are self-generated
//    numerals, and prefixing a negative amount would corrupt the column.
// 2. Amounts are dollars at exact 3-decimal milliunit precision, formatted with
//    integer math only. -15990 milliunits => "-15.990", which the CSV import's
//    Math.round(parseFloat(x) * 1000) maps back to -15990 exactly.

import { format } from 'date-fns';

const NEEDS_QUOTING = /[",\r\n]/;
const FORMULA_LEADERS = new Set(['=', '+', '-', '@', '\t', '\r']);

export function escapeCsvField(value: string): string {
  let out = value;
  if (out.length > 0 && FORMULA_LEADERS.has(out[0])) {
    out = `'${out}`;
  }
  if (NEEDS_QUOTING.test(out)) {
    out = `"${out.replace(/"/g, '""')}"`;
  }
  return out;
}

export function formatAmountForCsv(milliunits: number): string {
  const sign = milliunits < 0 ? '-' : '';
  const abs = Math.abs(milliunits);
  const whole = Math.trunc(abs / 1000);
  const frac = String(abs % 1000).padStart(3, '0');
  return `${sign}${whole}.${frac}`;
}

export type TransactionCsvRow = {
  date: Date;
  payee: string;
  amount: number;
  category: string | null;
  account: string;
  notes: string | null;
};

// Lowercase header names match the import flow's column mapper, so an exported
// file re-imports without manual mapping.
export const TRANSACTIONS_CSV_HEADER = 'date,payee,amount,category,account,notes';

export function buildTransactionsCsv(rows: TransactionCsvRow[]): string {
  const lines = [TRANSACTIONS_CSV_HEADER];
  for (const row of rows) {
    lines.push(
      [
        format(row.date, 'yyyy-MM-dd'),
        escapeCsvField(row.payee),
        formatAmountForCsv(row.amount),
        escapeCsvField(row.category ?? ''),
        escapeCsvField(row.account),
        escapeCsvField(row.notes ?? ''),
      ].join(','),
    );
  }
  return `${lines.join('\r\n')}\r\n`;
}
