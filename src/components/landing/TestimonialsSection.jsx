import { useTranslation } from "react-i18next";

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const items = t("testimonials.items", { returnObjects: true }) || [];

  if (!items.length) return null;

  return (
    <section
      id="testimonials"
      className="py-16 md:py-24"
      aria-labelledby="testimonials-title"
    >
      <h2
        id="testimonials-title"
        className="text-center text-2xl md:text-3xl font-bold text-[var(--text-1)]"
      >
        {t("testimonials.title", "Testimonios de Pacientes")}
      </h2>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <article
            key={i}
            className="
              group relative overflow-hidden rounded-2xl
              bg-[var(--surface-0)] dark:bg-[var(--surface-2)]
              border border-[var(--border-1)]
              shadow-[0_1px_1px_rgba(17,17,26,0.05)]
              hover:shadow-[0_10px_24px_rgba(17,17,26,0.08)]
              transition
            "
          >
            {/* glow sutil */}
            <div
              aria-hidden="true"
              className="
                absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity
                bg-[radial-gradient(600px_200px_at_50%_-20%,var(--brand-100),transparent)]
                dark:bg-[radial-gradient(600px_200px_at_50%_-20%,var(--brand-600),transparent)]
              "
            />
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="
                    h-10 w-10 shrink-0 rounded-full grid place-items-center
                    bg-[var(--brand-50)]/70 text-[var(--brand-600)]
                    dark:bg-[var(--brand-600)]/15 dark:text-[var(--brand-400)]
                    font-semibold
                  "
                  aria-hidden="true"
                >
                  {(it.name || "?").slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-1)] leading-tight">
                    {it.name}
                  </p>
                  <p className="text-xs text-[var(--text-3)]">
                    {it.meta}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[var(--text-2)] leading-relaxed">
                “{it.quote}”
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
