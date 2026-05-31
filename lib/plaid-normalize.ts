import type { AccountBase, Transaction } from 'plaid';

const PAYEE_MAX = 200;
const ACCOUNT_NAME_MAX = 120;

function truncate(value: string, max: number) {
  return value.length > max ? value.slice(0, max).trim() : value;
}

export function plaidAmountToMilliunits(amount: number) {
  return Math.round(-amount * 1000);
}

export function plaidDateToDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) throw new Error(`Invalid Plaid date: ${value}`);
    return fallback;
  }

  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
}

export function plaidTransactionPayee(transaction: Transaction) {
  const payee = transaction.merchant_name || transaction.name || 'Plaid transaction';
  return truncate(payee.trim() || 'Plaid transaction', PAYEE_MAX);
}

export function plaidAccountDisplayName(account: AccountBase, institutionName?: string | null) {
  const base = account.official_name || account.name || 'Linked account';
  const mask = account.mask ? ` ${account.mask}` : '';
  const institution = institutionName ? `${institutionName} ` : '';
  return truncate(`${institution}${base}${mask}`.replace(/\s+/g, ' ').trim(), ACCOUNT_NAME_MAX);
}
