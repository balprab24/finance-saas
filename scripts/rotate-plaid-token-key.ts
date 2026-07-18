import 'dotenv/config';
import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

config({ path: '.env.local' });

import * as schema from '../db/schema';
import { getActiveSecretVersion, reencryptSecret } from '../lib/server-crypto';
import { resolveDbOptions } from '../lib/db-config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_PLAID_KEY_ROTATION !== 'true') {
  console.error(
    'Refusing to rotate Plaid keys in production. Set ALLOW_PROD_PLAID_KEY_ROTATION=true to override.',
  );
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const client = postgres(connectionString, {
  prepare: false,
  ...resolveDbOptions(connectionString),
});
const db = drizzle(client, { schema });

async function main() {
  const activeVersion = getActiveSecretVersion();
  const rows = await db
    .select({
      id: schema.plaidItems.id,
      accessToken: schema.plaidItems.accessToken,
    })
    .from(schema.plaidItems);

  let rotated = 0;
  for (const row of rows) {
    const [version] = row.accessToken.split(':');
    if (version === activeVersion) continue;

    const nextPayload = reencryptSecret(row.accessToken);
    rotated += 1;

    if (!dryRun) {
      await db
        .update(schema.plaidItems)
        .set({ accessToken: nextPayload, updatedAt: new Date() })
        .where(eq(schema.plaidItems.id, row.id));
    }
  }

  console.log(
    `${dryRun ? 'Would rotate' : 'Rotated'} ${rotated} Plaid access token(s) to ${activeVersion}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => client.end());
