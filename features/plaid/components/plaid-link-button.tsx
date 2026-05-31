'use client';

import { useCallback, useEffect, useState } from 'react';
import { Landmark, Loader2 } from 'lucide-react';
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from 'react-plaid-link';

import { Button } from '@/components/ui/button';
import { useCreateLinkToken } from '@/features/plaid/api/use-create-link-token';
import { useExchangePublicToken } from '@/features/plaid/api/use-exchange-public-token';

type Props = {
  disabled?: boolean;
};

export function PlaidLinkButton({ disabled }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const createLinkToken = useCreateLinkToken();
  const exchangePublicToken = useExchangePublicToken();

  const onSuccess = useCallback(
    (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      const institution = metadata.institution
        ? {
            name: metadata.institution.name ?? null,
            institution_id: metadata.institution.institution_id ?? null,
          }
        : null;

      exchangePublicToken.mutate(
        { publicToken, metadata: { institution } },
        { onSettled: () => setLinkToken(null) },
      );
    },
    [exchangePublicToken],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, open, ready]);

  const onClick = async () => {
    const response = await createLinkToken.mutateAsync();
    setLinkToken(response.data.linkToken);
  };

  const isPending = createLinkToken.isPending || exchangePublicToken.isPending;

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isPending}
      size="sm"
      variant="outline"
      className="h-9 border-[var(--aurex-border)] bg-[var(--aurex-surface-2)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
    >
      {isPending ? (
        <Loader2 className="mr-2 size-3.5 animate-spin" />
      ) : (
        <Landmark className="mr-2 size-3.5" />
      )}
      Connect bank
    </Button>
  );
}
