import React from "react";

export default function FooterWaves() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" aria-hidden="true">
      <svg
        className="absolute bottom-0 left-0 w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        <defs>
          {/* Forma base de la ola (no se toca) */}
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />

          {/* Degradado por tokens (light/dark) */}
          <linearGradient id="ns-wave-grad" x1="0" y1="0" x2="150" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="var(--ns-wave-1)" />
            <stop offset="50%"  stopColor="var(--ns-wave-2)" />
            <stop offset="100%" stopColor="var(--ns-wave-3)" />
          </linearGradient>
        </defs>

        {/* Capas con gradiente + nuevas animaciones LR/RL y velocidades/delays */}
        <g fill="url(#ns-wave-grad)">
          {/* Fondo (más lenta, R→L) */}
          <g className="ns-wave-rl ns-speed-9s ns-delay-240">
            <use href="#gentle-wave" x="48" y="0" opacity="0.55" />
          </g>

          {/* Segunda (L→R) */}
          <g className="ns-wave-lr ns-speed-84s ns-delay-120">
            <use href="#gentle-wave" x="48" y="3" opacity="0.70" />
          </g>

          {/* Tercera (R→L) */}
          <g className="ns-wave-rl ns-speed-72s ns-delay-360">
            <use href="#gentle-wave" x="48" y="5" opacity="0.85" />
          </g>

          {/* Superior (más rápida, L→R) */}
          <g className="ns-wave-lr ns-speed-6s ns-delay-0">
            <use href="#gentle-wave" x="48" y="7" opacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}
