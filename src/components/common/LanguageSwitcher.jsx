// src/components/common/LanguageSwitcher.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGS, langToFlag } from "../../lib/locale";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language || "es-AR";
  const [open, setOpen] = useState(false);

  const onSelect = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t("common.change_language")}
      >
        <span className="text-xl">{langToFlag(current)}</span>
        <span className="font-medium">{LANGS[current].short}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-44 rounded-xl border border-black/10 bg-white shadow-lg p-1 z-50"
        >
          {Object.entries(LANGS).map(([code, meta]) => (
            <li key={code}>
              <button
                role="option"
                aria-selected={code === current}
                onClick={() => onSelect(code)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 ${
                  code === current ? "bg-black/5" : ""
                }`}
              >
                <span className="text-xl">{langToFlag(code)}</span>
                <span className="text-sm">{meta.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
