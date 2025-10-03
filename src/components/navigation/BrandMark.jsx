// src/components/navigation/BrandMark.jsx
import { BRAND } from "../../lib/brand";

export default function BrandMark({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 hover:opacity-90"
      aria-label={BRAND.alt}
    >
      {BRAND.logoLight && (
        <img
          src={BRAND.logoLight}
          alt={BRAND.alt}
          className={`block w-auto object-contain shrink-0 ${BRAND.header.logoClass}`}
          draggable={false}
        />
      )}

      {BRAND.showWordmark && (
        <span
          className={`font-semibold tracking-tight ${BRAND.header.textClass} text-gray-900 dark:text-white`}
        >
          {BRAND.name}
        </span>
      )}
    </button>
  );
}
