'use client';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  columnIndex: number;
  selectedColumns: Record<string, string | null>;
  onChange: (columnIndex: number, value: string | null) => void;
};

const options = ['amount', 'payee', 'date'];

export function TableHeadSelect({ columnIndex, selectedColumns, onChange }: Props) {
  const currentSelection = selectedColumns[`column_${columnIndex}`];

  return (
    <Select
      value={currentSelection || 'skip'}
      onValueChange={(value) => onChange(columnIndex, value)}
    >
      <SelectTrigger
        className={cn(
          'h-8 w-full justify-start gap-2 rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-2.5 text-[12.5px] font-medium capitalize text-[var(--aurex-text-2)] hover:bg-[var(--aurex-surface-hover)] focus:ring-0 focus:ring-offset-0',
          currentSelection &&
            'border-[rgba(22,24,29,0.32)] bg-[rgba(22,24,29,0.1)] text-[var(--aurex-brand-text)]',
        )}
      >
        <SelectValue placeholder="Skip" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="skip">Skip</SelectItem>
        {options.map((option, index) => {
          const disabled =
            Object.values(selectedColumns).includes(option) &&
            selectedColumns[`column_${columnIndex}`] !== option;
          return (
            <SelectItem key={index} value={option} disabled={disabled} className="capitalize">
              {option}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
