import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

function Item({ q, a, index }) {
  const [open, setOpen] = useState(false);
  const btnId = useId();
  const panelId = useId();

  return (
    <div
      className="
        rounded-xl border border-[var(--border-1)]
        bg-[var(--surface-0)] dark:bg-[var(--surface-2)]
      "
    >
      <button
        id={btnId}
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="
          w-full text-left px-4 md:px-5 py-3 md:py-4
          flex items-center justify-between gap-4
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[var(--brand-300)]
          rounded-xl
        "
      >
        <span className="font-medium text-[var(--text-1)]">{q}</span>
        <span
          className={`
            inline-block h-5 w-5 rounded-full grid place-items-center
            border border-[var(--border-1)]
            transition-transform ${open ? "rotate-180" : ""}
          `}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        hidden={!open}
        className="px-4 md:px-5 pb-4 md:pb-5 text-[var(--text-2)]"
      >
        {a}
      </div>
    </div>
  );
}

export default function FAQSection() {
  const { t } = useTranslation();
  const items = t("faq.items", { returnObjects: true }) || [];
  if (!items.length) return null;

  return (
    <section id="faq" className="py-16 md:py-24" aria-labelledby="faq-title">
      <h2
        id="faq-title"
        className="text-center text-2xl md:text-3xl font-bold text-[var(--text-1)]"
      >
        {t("faq.title", "Preguntas Frecuentes")}
      </h2>

      <div className="mt-8 space-y-3 max-w-4xl mx-auto">
        {items.map((it, i) => (
          <Item key={i} q={it.q} a={it.a} index={i} />
        ))}
      </div>
    </section>
  );
}
