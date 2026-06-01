import { db } from '@/db/drizzle';
import { plaidWebhookEvents } from '@/db/schema';

export async function recordPlaidWebhookEvent({
  requestBodySha256,
  plaidItemId,
  webhookType,
  webhookCode,
}: {
  requestBodySha256: string;
  plaidItemId?: string | null;
  webhookType?: string | null;
  webhookCode?: string | null;
}) {
  const [inserted] = await db
    .insert(plaidWebhookEvents)
    .values({
      requestBodySha256,
      plaidItemId: plaidItemId || null,
      webhookType: webhookType || null,
      webhookCode: webhookCode || null,
    })
    .onConflictDoNothing()
    .returning({ requestBodySha256: plaidWebhookEvents.requestBodySha256 });

  return { isReplay: !inserted };
}
