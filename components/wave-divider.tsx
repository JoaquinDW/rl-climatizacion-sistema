/**
 * Separador con los dos arcos cruzados del logo de RL: el frío (teal) baja
 * y el calor (naranja) sube, cruzándose al medio. Decorativo: no anuncia
 * nada a los lectores de pantalla.
 */
export function WaveDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className="h-10 w-full sm:h-14"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient id="rl-wave-frio" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#007e95" stopOpacity="0" />
            <stop offset="0.35" stopColor="#4fafc4" stopOpacity="0.85" />
            <stop offset="1" stopColor="#9ad5e1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rl-wave-calor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f3ae7f" stopOpacity="0" />
            <stop offset="0.65" stopColor="#d25e23" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ae4a19" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Arco frío: entra alto y baja */}
        <path
          d="M0 24 C 300 4, 620 66, 1200 52"
          fill="none"
          stroke="url(#rl-wave-frio)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Arco cálido: entra bajo y sube, cruzando al primero */}
        <path
          d="M0 56 C 340 74, 700 12, 1200 30"
          fill="none"
          stroke="url(#rl-wave-calor)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
