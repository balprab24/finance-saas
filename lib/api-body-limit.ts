import { bodyLimit } from 'hono/body-limit';

// 2 MB leaves headroom above the worst-case legitimate payload: a bulk-create
// of MAX_BULK_INSERT (500) transactions with maximal notes/payee fields lands
// around 1.3 MB of JSON.
export const MAX_API_BODY_BYTES = 2 * 1024 * 1024;

export const apiBodyLimit = bodyLimit({
  maxSize: MAX_API_BODY_BYTES,
  onError: (c) => c.json({ error: 'Request body too large' }, 413),
});
