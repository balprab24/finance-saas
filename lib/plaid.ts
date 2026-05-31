import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from 'plaid';

let plaidClient: PlaidApi | null = null;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function getPlaidClient() {
  if (plaidClient) return plaidClient;

  const env = (process.env.PLAID_ENV || 'sandbox').trim().toLowerCase();
  const basePath = PlaidEnvironments[env as keyof typeof PlaidEnvironments];
  if (!basePath) {
    throw new Error('PLAID_ENV must be sandbox or production');
  }

  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': requiredEnv('PLAID_CLIENT_ID'),
        'PLAID-SECRET': requiredEnv('PLAID_SECRET'),
        'Plaid-Version': '2020-09-14',
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
  return plaidClient;
}

export function getPlaidProducts() {
  const raw = process.env.PLAID_PRODUCTS || 'transactions';
  const products = raw.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);

  return products.map((product) => {
    if (product === 'transactions') return Products.Transactions;
    throw new Error(`Unsupported Plaid product: ${product}`);
  });
}

export function getPlaidCountryCodes() {
  const raw = process.env.PLAID_COUNTRY_CODES || 'US';
  const countries = raw.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);

  return countries.map((country) => {
    if (country === 'US') return CountryCode.Us;
    throw new Error(`Unsupported Plaid country code: ${country}`);
  });
}

export function getPlaidWebhookUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return undefined;
  return new URL('/api/plaid/webhook', appUrl).toString();
}
