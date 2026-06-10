export const AUREX_COLORS = {
  ink: '#16181d',
  ink2: '#3a414b',
  ink3: '#5b6470',
  ink4: '#8a9099',
  paper: '#f5f6f7',
  surface: '#ffffff',
  bar: '#2b2f36',
  income: '#117a4b',
  expense: '#c0392b',
  warning: '#b45309',
  neutral: '#6b7280',
} as const;

export const CASH_FLOW_COLORS = {
  income: AUREX_COLORS.income,
  expenses: AUREX_COLORS.expense,
} as const;

export const CATEGORY_CHART_COLORS = [
  AUREX_COLORS.ink,
  AUREX_COLORS.ink3,
  AUREX_COLORS.warning,
  AUREX_COLORS.expense,
  AUREX_COLORS.neutral,
  AUREX_COLORS.income,
] as const;
