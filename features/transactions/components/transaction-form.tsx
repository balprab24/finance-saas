'use client';

import { z } from 'zod';
import { Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/select';
import { DatePicker } from '@/components/date-picker';
import { AmountInput } from '@/components/amount-input';
import { convertAmountToMiliunits } from '@/lib/utils';
import type { CreateTransactionInput } from '@/lib/api-schemas';

const formSchema = z.object({
  date: z.date({ message: 'Pick a date for this transaction' }),
  accountId: z.string().min(1, 'Select an account'),
  categoryId: z.string().nullable().optional(),
  payee: z
    .string()
    .trim()
    .min(1, 'Add a payee')
    .max(200, 'Payee must be 200 characters or fewer'),
  amount: z
    .string()
    .min(1, 'Enter an amount')
    .refine((v) => !Number.isNaN(parseFloat(v)) && Number.isFinite(parseFloat(v)), {
      message: 'Amount must be a number',
    })
    .refine((v) => parseFloat(v) !== 0, { message: 'Amount cannot be zero' }),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must be 2000 characters or fewer')
    .nullable()
    .optional(),
});

type FormValues = {
  date: Date;
  accountId: string;
  categoryId?: string | null;
  payee: string;
  amount: string;
  notes?: string | null;
};

type Props = {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: CreateTransactionInput) => void;
  onDelete?: () => void;
  disabled?: boolean;
  accountOptions: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
  onCreateAccount: (name: string) => void;
  onCreateCategory: (name: string) => void;
};

export function TransactionForm({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  accountOptions,
  categoryOptions,
  onCreateAccount,
  onCreateCategory,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const handleSubmit = (values: FormValues) => {
    const amount = parseFloat(values.amount);
    const amountInMiliunits = convertAmountToMiliunits(amount);
    onSubmit({ ...values, amount: amountInMiliunits });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value as Date | undefined}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="accountId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select an account"
                  options={accountOptions}
                  onCreate={onCreateAccount}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Category <span className="text-[var(--aurex-text-3)] font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a category"
                  options={categoryOptions}
                  onCreate={onCreateCategory}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="payee"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payee</FormLabel>
              <FormControl>
                <Input disabled={disabled} placeholder="e.g. Whole Foods" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="amount"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <AmountInput {...field} disabled={disabled} placeholder="0.00" />
              </FormControl>
              <p className="text-[11.5px] text-[var(--aurex-text-3)]">
                Negative for expenses, positive for income.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="notes"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Notes <span className="text-[var(--aurex-text-3)] font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="e.g. trip to Tahoe with friends"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled}>
          {id ? 'Save changes' : 'Create transaction'}
        </Button>
        {!!id && (
          <Button
            type="button"
            disabled={disabled}
            onClick={onDelete}
            className="w-full"
            variant="outline"
          >
            <Trash className="size-4 mr-2" />
            Delete transaction
          </Button>
        )}
      </form>
    </Form>
  );
}
