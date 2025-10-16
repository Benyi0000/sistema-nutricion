// src/components/landing/NutritionistCard.jsx
import { memo } from "react";

/**
 * Card minimalista para una nutricionista
 * Props:
 * - profile: { name, degree, photo, tags[], bullets[], slug }
 * - onContact?: () => void
 * - onLogin?: () => void
 */
function NutritionistCard({ profile, onContact, onLogin }) {
  if (!profile) return null;

  const { name, degree, photo, tags = [], bullets = [] } = profile;

  return (
    <article
      className="
        group relative rounded-3xl border border-[var(--border-1)]
        bg-[var(--surface-0)] dark:bg-[var(--surface-2)]
        shadow-[0_1px_1px_rgba(17,17,26,0.05)]
        hover:shadow-[0_8px_28px_rgba(17,17,26,0.10)]
        transition-all duration-300
      "
    >
      {/* header */}
      <div className="p-5 md:p-6 flex gap-5 md:items-center">
        <div className="shrink-0">
          <div className="overflow-hidden rounded-2xl ring-1 ring-[var(--border-1)]">
            <img
              src={photo}
              alt={name}
              className="h-28 w-28 md:h-32 md:w-32 object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* tags */}
          {!!tags.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full
                    bg-[var(--brand-50)]/70 text-[var(--brand-700)]
                    dark:bg-[var(--brand-600)]/10 dark:text-[var(--brand-200)]
                    ring-1 ring-[var(--border-1)] px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl md:text-2xl font-bold text-[var(--text-1)]">
            {name}
          </h3>
          {degree && (
            <p className="mt-1 text-[var(--text-2)] text-sm">{degree}</p>
          )}

          {!!bullets.length && (
            <ul className="mt-4 space-y-2">
              {bullets.slice(0, 3).map((b, i) => (
                <li
                  key={i}
                  className="text-[var(--text-2)] text-[15px] leading-relaxed
                             pl-6 relative"
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-[7px] h-2 w-2 rounded-full
                               bg-[var(--brand-500)]/80"
                  />
                  {b}
                </li>
              ))}
            </ul>
          )}

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onContact}
              className="inline-flex items-center rounded-full
                         bg-[var(--brand-600)] px-5 py-2.5 text-sm font-semibold
                         text-white shadow-sm transition hover:shadow-md
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-300)]"
            >
              Contactar
            </button>
            <button
              onClick={onLogin}
              className="inline-flex items-center rounded-full
                         border border-[var(--border-1)] bg-[var(--surface-0)]
                         px-5 py-2.5 text-sm font-semibold text-[var(--text-1)]
                         hover:bg-[var(--brand-50)]
                         dark:hover:bg-[var(--brand-600)]/10"
            >
              Agendar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(NutritionistCard);
