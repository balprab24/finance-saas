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
      <div className="mx-auto w-full max-w-screen-2xl pb-16 pt-8">
        <div className="aurex-card p-6">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <div className="mt-6 flex h-[500px] w-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[var(--aurex-text-3)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 pb-16 pt-8">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--aurex-text-3)]">
          Categories
        </span>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--aurex-text-1)] lg:text-[34px]">
          Tag the spend, see the pattern
        </h1>
      </div>
      <div className="aurex-card p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Your categories
          </h2>
          <Button
            onClick={newCategory.onOpen}
            size="sm"
            className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-[0_8px_24px_rgba(99,102,241,0.32)] hover:from-[#7a7df7] hover:to-[#9b6cf8]"
          >
            <Plus className="mr-2 size-4" />
            Add new
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
