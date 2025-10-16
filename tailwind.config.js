/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      container: {
        center: true,
        padding: "1rem",
        screens: {
          sm: "640px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1440px",
        },
      },

      /* Paleta de marca (tuya) */
      colors: {
        brand: {
          DEFAULT: "#7c3aed",
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },

      boxShadow: {
        "xs-soft": "0 1px 2px rgba(0,0,0,0.06)",
        card: "0 8px 30px rgba(0,0,0,0.06)",
      },

      borderRadius: { "2xl": "1rem" },

      /* ===== Animaciones Footer Waves ===== */
      keyframes: {
        /* desplazamiento horizontal continuo para parallax */
        "wave-x": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" } // 200% de ancho total (dos tiles)
        },
        /* corrimiento muy sutil del gradiente (colores “corren”) */
        "grad-x": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-25%)" }
        },
      },
      animation: {
        "wave-slow": "wave-x 55s linear infinite",
        "wave-mid":  "wave-x 35s linear infinite",
        "wave-fast": "wave-x 18s linear infinite",
        "grad-move": "grad-x 60s linear infinite", // cambia a 20s si lo querés más notorio
      },
    },
  },
  plugins: [
    // require('@tailwindcss/forms'),
  ],
};
