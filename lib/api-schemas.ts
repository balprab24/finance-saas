import { z } from 'zod';

export const MAX_BULK_IDS = 500;
export const MAX_BULK_INSERT = 500;

const NAME_MAX = 120;
const PAYEE_MAX = 200;
const NOTES_MAX = 2000;
const ID_MAX = 64;
// Amount is an integer in milliunits (1/1000 of a dollar). Bound generously
// while still rejecting absurd values that would suggest a client bug.
const AMOUNT_MIN = -1_000_000_000_000;
const AMOUNT_MAX = 1_000_000_000_000;

const idString = z.string().trim().min(1).max(ID_MAX);

const nameString = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(NAME_MAX, `Name must be ${NAME_MAX} characters or fewer`);

const payeeString = z
  .string()
  .trim()
  .min(1, 'Payee is required')
  .max(PAYEE_MAX, `Payee must be ${PAYEE_MAX} characters or fewer`);

const notesString = z
  .string()
  .trim()
  .max(NOTES_MAX, `Notes must be ${NOTES_MAX} characters or fewer`)
  .nullable()
  .optional();

const amountInteger = z
  .number({ message: 'Amount must be a number' })
  .int('Amount must be an integer (milliunits)')
  .min(AMOUNT_MIN)
  .max(AMOUNT_MAX);

const transactionDate = z.coerce
  .date()
  .refine((d) => Number.isFinite(d.getTime()), 'Invalid date');

// Matches the original frontend-facing contract: `id` may be missing in the
// URL params shape because Hono's RPC client sometimes types path params as
// optional. Routes enforce presence at runtime and return 400 if missing.
export const idParamSchema = z.object({ id: idString.optional() });

export const createAccountSchema = z.object({ name: nameString });
export const updateAccountSchema = createAccountSchema;

export const createCategorySchema = z.object({ name: nameString });
export const updateCategorySchema = createCategorySchema;

export const exchangePublicTokenSchema = z.object({
  publicToken: z.string().trim().min(1, 'Public token is required'),
  metadata: z
    .object({
      institution: z
        .object({
          name: z.string().trim().nullable().optional(),
          institution_id: z.string().trim().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .passthrough()
    .optional(),
});

export const createTransactionSchema = z.object({
  amount: amountInteger,
  payee: payeeString,
  notes: notesString,
  date: transactionDate,
  accountId: idString,
  categoryId: idString.nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema;

export const bulkIdsSchema = z.object({
  ids: z.array(idString).min(1, 'At least one id is required').max(MAX_BULK_IDS, `Up to ${MAX_BULK_IDS} ids per request`),
});

export const bulkCreateTransactionsSchema = z
  .array(createTransactionSchema)
  .min(1, 'At least one row is required')
  .max(MAX_BULK_INSERT, `Up to ${MAX_BULK_INSERT} rows per request`);

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// Client hooks default unset URL params to '' (e.g. `params.get('from') || ''`),
// so the API sees `?from=&to=&accountId=`. Treat empty strings as absent.
const emptyToUndef = (v: unknown) => (v === '' ? undefined : v);

export const dateRangeQuerySchema = z
  .object({
    from: z.preprocess(emptyToUndef, isoDateString.optional()),
    to: z.preprocess(emptyToUndef, isoDateString.optional()),
    accountId: z.preprocess(emptyToUndef, idString.optional()),
  })
  .refine(
    (q) => !q.from || !q.to || q.from <= q.to,
    { message: '`from` must be on or before `to`', path: ['from'] },
  );

const monthString = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format');

// Budget limits are positive integer milliunits; a budget of $0 is meaningless,
// so clearing a budget is done via DELETE rather than POSTing amount 0.
const budgetAmount = z
  .number({ message: 'Amount must be a number' })
  .int('Amount must be an integer (milliunits)')
  .min(1, 'Amount must be greater than zero')
  .max(AMOUNT_MAX);

export const upsertBudgetSchema = z.object({
  categoryId: idString,
  month: monthString,
  amount: budgetAmount,
});

export const budgetMonthQuerySchema = z.object({
  month: z.preprocess(emptyToUndef, monthString.optional()),
});

export const ignoreRecurringSchema = z.object({
  merchantKey: z
    .string()
    .trim()
    .min(1, 'Merchant is required')
    .max(PAYEE_MAX, `Merchant must be ${PAYEE_MAX} characters or fewer`),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
