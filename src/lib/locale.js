// src/lib/locale.js
export const LANGS = {
  "es-AR": { short: "ES", label: "Español (AR)" },
  "en-US": { short: "EN", label: "English (US)" },
  "pt-BR": { short: "PT", label: "Português (BR)" },
  "it-IT": { short: "IT", label: "Italiano (IT)" }
};

export function langToFlag(code) {
  switch (code) {
    case "es-AR": return "🇦🇷";
    case "en-US": return "🇺🇸";
    case "pt-BR": return "🇧🇷";
    case "it-IT": return "🇮🇹";
    default: return "🏳️";
  }
}
