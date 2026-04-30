'use client';

import { useOpenAccount } from '@/features/accounts/hooks/use-open-account';
import { cn } from '@/lib/utils';

type Props = { account: string | null; accountId: string };

export function AccountColumn({ account, accountId }: Props) {
  const { onOpen } = useOpenAccount();
  const onClick = () => onOpen(accountId);
  return (
    <span onClick={onClick} className={cn('flex items-center cursor-pointer hover:underline')}>
      {account ?? 'Unknown'}
    </span>
  );
}
