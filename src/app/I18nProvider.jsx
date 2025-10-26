// src/app/I18nProvider.jsx
import { useEffect, useState } from "react";
import i18n from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import es from "../locales/es-AR.json";
import en from "../locales/en-US.json";
import pt from "../locales/pt-BR.json";
import it from "../locales/it-IT.json";

const resources = {
  "es-AR": { translation: es },
  "en-US": { translation: en },
  "pt-BR": { translation: pt },
  "it-IT": { translation: it },
};

export default function I18nProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    i18n
      .use(initReactI18next)
      .use(LanguageDetector)
      .init({
        resources,
        // ⚠️ Forzamos idioma para descartar problemas del detector:
        lng: "es-AR",
        fallbackLng: "es-AR",
        supportedLngs: Object.keys(resources),
        detection: {
          order: ["localStorage", "querystring", "navigator"],
          lookupLocalStorage: "lang",
          caches: ["localStorage"],
        },
        interpolation: { escapeValue: false },
        debug: true, // ver logs en consola
      })
      .then(() => {
        // Exponer para chequear rápido en la consola del navegador:
        window.__i18n = i18n;
        setReady(true);
        console.log("[i18n] listo con idioma:", i18n.language);
      })
      .catch((e) => console.error("[i18n] init error:", e));
  }, []);

  if (!ready) return null;
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
