import { cn } from '@/lib/utils';

type LogoMarkProps = {
  /** Pixel size of the square badge. */
  size?: number;
  className?: string;
};

/**
 * Aurex mark — a custom geometric "A" monogram (no stock icon) set in a solid
 * ink badge. Drawn as crisp SVG strokes so it reads cleanly from 16px (dashboard
 * header) up to large marketing sizes.
 */
export function LogoMark({ size = 30, className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        'relative inline-grid place-items-center text-white',
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        background: 'var(--aurex-brand)',
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
      >
        {/* Two angled legs forming the apex of the A */}
        <path
          d="M4.8 19.2 L12 4.6 L19.2 19.2"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Crossbar */}
        <path
          d="M8.4 13.4 H15.6"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="pointer-events-none absolute inset-0 ring-1 ring-white/30"
        style={{ borderRadius: Math.round(size * 0.32) }}
      />
    </span>
  );
}

type LogoProps = LogoMarkProps & {
  /** Wordmark font size in px. Defaults to a size paired with the mark. */
  wordmarkSize?: number;
  /** Render only the mark, no "Aurex" text. */
  markOnly?: boolean;
  wordmarkClassName?: string;
};

/** Mark + "Aurex" wordmark. Wrap in a Link at the call site. */
export function Logo({
  size = 30,
  wordmarkSize,
  markOnly = false,
  className,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} className={className} />
      {!markOnly && (
        <span
          className={cn(
            'font-semibold tracking-tight text-[var(--aurex-text-1)]',
            wordmarkClassName,
          )}
          style={{ fontSize: wordmarkSize ?? Math.round(size * 0.6) }}
        >
          Aurex
        </span>
      )}
    </span>
  );
}
