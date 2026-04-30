import { isValid, parse } from 'date-fns';

const KNOWN_FORMATS = [
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'dd/MM/yyyy',
  'd/M/yyyy',
  'MM-dd-yyyy',
  'dd-MM-yyyy',
  'MMM d, yyyy',
  'MMM dd yyyy',
  'd MMM yyyy',
  'dd MMM yyyy',
];

export function parseCsvDate(input: string | null | undefined): Date | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const fmt of KNOWN_FORMATS) {
    const d = parse(trimmed, fmt, new Date());
    if (isValid(d)) return d;
  }

  // Last resort: native parser handles ISO 8601 + RFC 2822 reliably.
  const native = new Date(trimmed);
  if (isValid(native) && !Number.isNaN(native.getTime())) return native;

  return null;
}
