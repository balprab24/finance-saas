'use client';

import { z } from 'zod';
import { Archive, ArchiveRestore } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name must be 120 characters or fewer'),
});
type FormValues = z.input<typeof formSchema>;

type Props = {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onArchive?: () => void;
  onRestore?: () => void;
  archived?: boolean;
  disabled?: boolean;
};

export function AccountForm({
  id,
  defaultValues,
  onSubmit,
  onArchive,
  onRestore,
  archived,
  disabled,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = (values: FormValues) => onSubmit(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input disabled={disabled} placeholder="e.g. Cash, Bank, Credit Card" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={disabled}>
          {id ? 'Save changes' : 'Create account'}
        </Button>
        {!!id && archived && (
          <Button type="button" disabled={disabled} onClick={onRestore} className="w-full" variant="outline">
            <ArchiveRestore className="size-4 mr-2" />
            Restore account
          </Button>
        )}
        {!!id && !archived && (
          <Button type="button" disabled={disabled} onClick={onArchive} className="w-full" variant="outline">
            <Archive className="size-4 mr-2" />
            Archive account
          </Button>
        )}
      </form>
    </Form>
  );
}
