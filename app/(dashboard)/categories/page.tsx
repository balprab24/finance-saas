'use client';

import { Plus, Tags } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table';
import { DataError } from '@/components/data-error';
import { EmptyState } from '@/components/empty-state';
import { PageMasthead } from '@/components/page-masthead';
import { StatementSheet } from '@/components/statement-sheet';

import { columns } from './columns';
import { useNewCategory } from '@/features/categories/hooks/use-new-category';
import { useGetCategories } from '@/features/categories/api/use-get-categories';
import { useBulkDeleteCategories } from '@/features/categories/api/use-bulk-delete-categories';

export default function CategoriesPage() {
  const newCategory = useNewCategory();
  const categoriesQuery = useGetCategories();
  const deleteCategories = useBulkDeleteCategories();
  const categories = categoriesQuery.data || [];

  const isDisabled = categoriesQuery.isLoading || deleteCategories.isPending;

  const count = categories.length;

  return (
    <StatementSheet
      masthead={
        <PageMasthead
          title="Categories"
          meta={
            categoriesQuery.isLoading
              ? 'Loading…'
              : `${count} ${count === 1 ? 'category' : 'categories'}`
          }
          actions={
            <Button
              onClick={newCategory.onOpen}
              size="sm"
              className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[#2b2f36]"
            >
              <Plus className="mr-2 size-3.5" />
              Add category
            </Button>
          }
        />
      }
    >
      <div className="p-5 sm:p-6">
        {categoriesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md bg-black/[0.05]" />
            ))}
          </div>
        ) : categoriesQuery.isError && !categoriesQuery.data ? (
          <DataError
            className="border-0"
            title="Couldn't load your categories"
            message="We couldn't reach your categories. Check your connection and try again."
            onRetry={() => categoriesQuery.refetch()}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No categories yet"
            message="Create categories like Groceries or Rent to sort transactions and see where your money goes."
            action={
              <Button
                onClick={newCategory.onOpen}
                size="sm"
                className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[#2b2f36]"
              >
                <Plus className="mr-2 size-3.5" />
                Add category
              </Button>
            }
          />
        ) : (
          <DataTable
            filterKey="name"
            columns={columns}
            data={categories}
            onDelete={(rows) => deleteCategories.mutate({ ids: rows.map((r) => r.original.id) })}
            disabled={isDisabled}
          />
        )}
      </div>
    </StatementSheet>
  );
}
