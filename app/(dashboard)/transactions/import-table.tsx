'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableHeadSelect } from './table-head-select';

type Props = {
  headers: string[];
  body: string[][];
  selectedColumns: Record<string, string | null>;
  onTableHeadSelectChange: (columnIndex: number, value: string | null) => void;
};

const PREVIEW_ROWS = 6;

export function ImportTable({
  headers,
  body,
  selectedColumns,
  onTableHeadSelectChange,
}: Props) {
  const preview = body.slice(0, PREVIEW_ROWS);
  const remaining = body.length - preview.length;

  return (
    <div className="overflow-hidden rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-bg-elev)]">
      <Table>
        <TableHeader>
          <TableRow className="border-[var(--aurex-border)] bg-[var(--aurex-surface)] hover:bg-[var(--aurex-surface)]">
            {headers.map((_item, index) => (
              <TableHead key={index} className="h-12 align-middle">
                <TableHeadSelect
                  columnIndex={index}
                  selectedColumns={selectedColumns}
                  onChange={onTableHeadSelectChange}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className="border-[var(--aurex-border)] hover:bg-[var(--aurex-surface)]"
            >
              {row.map((cell, cellIndex) => {
                const isMapped = !!selectedColumns[`column_${cellIndex}`];
                return (
                  <TableCell
                    key={cellIndex}
                    className={`py-2.5 text-[12.5px] tabular-nums ${
                      isMapped ? 'text-[var(--aurex-text-1)]' : 'text-[var(--aurex-text-3)]'
                    }`}
                  >
                    {cell || <span className="italic opacity-60">empty</span>}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {remaining > 0 ? (
        <div className="border-t border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-3 py-2 text-[11.5px] text-[var(--aurex-text-3)]">
          Showing first {preview.length} of {body.length} rows ({remaining} more not shown)
        </div>
      ) : null}
    </div>
  );
}
