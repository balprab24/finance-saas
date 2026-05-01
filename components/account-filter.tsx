'use client';

import qs from 'query-string';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetAccounts } from '@/features/accounts/api/use-get-accounts';
import { useGetSummary } from '@/features/summary/api/use-get-summary';

export function AccountFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const accountId = params.get('accountId') || 'all';
  const from = params.get('from') || '';
  const to = params.get('to') || '';

  const { data: accounts, isLoading: accountsLoading } = useGetAccounts();
  const { isLoading: summaryLoading } = useGetSummary();

  const onChange = (newValue: string) => {
    const query = {
      accountId: newValue,
      from,
      to,
    };
    if (newValue === 'all') query.accountId = '';
    const url = qs.stringifyUrl({ url: pathname, query }, { skipEmptyString: true, skipNull: true });
    router.push(url);
  };

  return (
    <Select value={accountId} onValueChange={onChange} disabled={accountsLoading || summaryLoading}>
      <SelectTrigger className="h-9 w-full rounded-full border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-4 text-[13px] font-medium text-[var(--aurex-text-1)] outline-none transition-colors hover:bg-[var(--aurex-surface-hover)] hover:border-[var(--aurex-border-strong)] focus:ring-0 focus:ring-offset-0 lg:w-auto">
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All accounts</SelectItem>
        {accounts?.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
