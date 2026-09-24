/**
 * Separador inspirado en líneas de pista y cortes de carrocería. Es puramente
 * decorativo y no agrega ruido para lectores de pantalla.
 */
export function MotorsportDivider({
  className = "",
}: {
  className?: string
}) {
  return (
    <div className={`relative select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1200 62"
        preserveAspectRatio="none"
        className="h-9 w-full sm:h-12"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient id="track-gold-muted" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#D7C180" stopOpacity="0" />
            <stop offset="0.22" stopColor="#D7C180" stopOpacity="0.45" />
            <stop offset="0.78" stopColor="#D7C180" stopOpacity="0.45" />
            <stop offset="1" stopColor="#D7C180" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="track-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#D6A82F" stopOpacity="0" />
            <stop offset="0.34" stopColor="#D6A82F" stopOpacity="0.95" />
            <stop offset="0.7" stopColor="#F0CF6A" stopOpacity="0.9" />
            <stop offset="1" stopColor="#D6A82F" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M0 34 H1200"
          fill="none"
          stroke="url(#track-gold-muted)"
          strokeWidth="2"
        />
        <path
          d="M265 43 H490 L525 18 H730 L765 43 H980"
          fill="none"
          stroke="url(#track-gold)"
          strokeWidth="5"
          strokeLinejoin="bevel"
        />
        <path
          d="M485 48 L535 12 M665 48 L715 12"
          fill="none"
          stroke="#D6A82F"
          strokeWidth="4"
          strokeLinecap="square"
          opacity="0.48"
        />
      </svg>
    </div>
  )
}
