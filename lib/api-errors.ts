// Extract a human-readable message from a failed Hono fetch Response. The API
// either returns `{error: string}` (our jsonError) or a zValidator default
// shape `{success: false, error: {name: 'ZodError', message: '[...]'}}`. We
// try each in turn and fall back to the provided default.
export async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.clone().json()) as
      | { error?: string | { name?: string; message?: string }; details?: unknown }
      | undefined;

    if (!body) return fallback;

    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error;
    }

    if (body.error && typeof body.error === 'object') {
      // zValidator default: error is a serialized ZodError. Try to peel out
      // the first issue's message so users see something actionable instead
      // of "ZodError".
      const raw = body.error.message;
      if (typeof raw === 'string') {
        try {
          const issues = JSON.parse(raw) as Array<{ message?: string; path?: (string | number)[] }>;
          if (Array.isArray(issues) && issues[0]?.message) {
            const path = issues[0].path?.length ? `${issues[0].path.join('.')}: ` : '';
            return `${path}${issues[0].message}`;
          }
        } catch {
          return raw;
        }
      }
    }
  } catch {
    // ignore JSON parse errors
  }
  return fallback;
}
