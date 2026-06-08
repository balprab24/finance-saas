'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table';

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

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5 pb-16 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[26px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)] lg:text-[30px]">
          Categories
        </h1>
      </div>
      <div className="aurex-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--aurex-text-1)]">
            Your categories
          </h2>
          <Button
            onClick={newCategory.onOpen}
            size="sm"
            className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[#2b2f36]"
          >
            <Plus className="mr-2 size-3.5" />
            Add category
          </Button>
        </div>
        <div className="mt-4">
          {categoriesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md bg-black/[0.05]" />
              ))}
            </div>
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
      </div>
    </div>
  );
}
