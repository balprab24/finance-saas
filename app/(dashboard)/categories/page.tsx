'use client';

import { Loader2, Plus } from 'lucide-react';

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

  if (categoriesQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl pb-16 pt-6">
        <div className="aurex-card p-5">
          <Skeleton className="h-6 w-44 bg-white/8" />
          <div className="mt-5 flex h-[420px] w-full items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5 pb-16 pt-6">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
          Categories
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight text-[var(--aurex-text-1)] lg:text-[28px]">
          Tag the spend, see the pattern
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
            className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[#7a7df7]"
          >
            <Plus className="mr-2 size-3.5" />
            Add category
          </Button>
        </div>
        <div className="mt-4">
          <DataTable
            filterKey="name"
            columns={columns}
            data={categories}
            onDelete={(rows) => deleteCategories.mutate({ ids: rows.map((r) => r.original.id) })}
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
}
