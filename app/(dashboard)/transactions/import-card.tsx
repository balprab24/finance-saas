'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportTable } from './import-table';
import { convertAmountToMiliunits } from '@/lib/utils';
import { parseCsvDate } from '@/lib/csv-date';

const outputFormat = 'yyyy-MM-dd';

const requiredOptions = ['amount', 'date', 'payee'] as const;

type SelectedColumnsState = Record<string, string | null>;

type Props = {
  data: string[][];
  onCancel: () => void;
  onSubmit: (
    data: { amount: number; date: Date; payee: string; notes?: string }[],
  ) => void;
};

export function ImportCard({ data, onCancel, onSubmit }: Props) {
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumnsState>({});

  const headers = data[0];
  const body = data.slice(1);

  const onTableHeadSelectChange = (columnIndex: number, value: string | null) => {
    setSelectedColumns((prev) => {
      const newSelectedColumns = { ...prev };
      for (const key in newSelectedColumns) {
        if (newSelectedColumns[key] === value) newSelectedColumns[key] = null;
      }
      if (value === 'skip') value = null;
      newSelectedColumns[`column_${columnIndex}`] = value;
      return newSelectedColumns;
    });
  };

  const progress = Object.values(selectedColumns).filter(Boolean).length;

  const handleContinue = () => {
    const getColumnIndex = (column: string) => column.split('_')[1];
    const mappedData = {
      headers: headers.map((_, index) => {
        const columnIndex = getColumnIndex(`column_${index}`);
        return selectedColumns[`column_${columnIndex}`] || null;
      }),
      body: body
        .map((row) => row.map((cell, index) => (selectedColumns[`column_${index}`] ? cell : null)))
        .filter((row) => row.some((c) => c !== null)),
    };
    const arrayOfData = mappedData.body.map((row) =>
      row.reduce((acc: Record<string, string>, cell, index) => {
        const header = mappedData.headers[index];
        if (header !== null && cell !== null) acc[header] = cell;
        return acc;
      }, {}),
    );

    const errors: { row: number; reason: string }[] = [];
    const formatted: Record<string, unknown>[] = [];

    arrayOfData.forEach((item, index) => {
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
      formatted.push({
        ...item,
        amount: convertAmountToMiliunits(amount),
        date: format(parsedDate, outputFormat),
      });
    });

    if (errors.length > 0) {
      const preview = errors
        .slice(0, 3)
        .map((e) => `row ${e.row}: ${e.reason}`)
        .join('; ');
      const rest = errors.length > 3 ? ` (+${errors.length - 3} more)` : '';
      toast.error(`Import blocked: ${errors.length} invalid row(s). ${preview}${rest}`);
      return;
    }

    onSubmit(formatted as never);
  };

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">Import transaction</CardTitle>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Button onClick={onCancel} size="sm" className="w-full lg:w-auto" variant="outline">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={progress < requiredOptions.length}
              onClick={handleContinue}
              className="w-full lg:w-auto"
            >
              Continue ({progress} / {requiredOptions.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ImportTable
            headers={headers}
            body={body}
            selectedColumns={selectedColumns}
            onTableHeadSelectChange={onTableHeadSelectChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
