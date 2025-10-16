// src/components/landing/NutritionistSection.jsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import NutritionistCarousel from "./NutritionistCarousel.jsx";

/** Convierte el bio largo en lead + bullets (3 áreas) si no vienen ya */
function parseBio(bio = "") {
  const blocks = bio
    .split(/\n\s*\n/) // separa por líneas en blanco
    .map((b) => b.trim())
    .filter(Boolean);

  const areaKeys = [
    "Nutrición y Obesidad:",
    "Nutrición Deportiva:",
    "Nutrición Infantil y Educación Alimentaria:",
    // EN
    "Obesity and Weight Management:",
    "Sports Nutrition:",
    "Child Nutrition and Food Education:",
    // PT
    "Nutrição e Obesidade:",
    "Nutrição Esportiva:",
    "Nutrição Infantil e Educação Alimentar:",
    // IT
    "Nutrizione e Obesità:",
    "Nutrizione Sportiva:",
    "Nutrizione Infantile ed Educazione Alimentare:",
  ];

  const areas = [];
  const rest = [];

  for (const block of blocks) {
    const k = areaKeys.find((key) => block.startsWith(key));
    if (k) {
      areas.push({
        title: k.replace(/:$/, ""),
        text: block.replace(k, "").trim(),
      });
    } else {
      rest.push(block);
    }
  }

  const lead = rest[0] || "";
  const bullets = areas.slice(0, 3).map((a) => `${a.title}: ${a.text}`);
  return { lead, bullets, areas };
}

/** Normaliza cualquier perfil del i18n a la forma esperada por la Card */
function normalizeProfile(p, fallbackName, fallbackDegree, fallbackPhoto, fallbackTags) {
  if (!p) return null;

  // Si trae bio pero no trae bullets, los generamos
  let bullets = p.bullets || [];
  let lead = p.lead || "";

  if ((!bullets.length || !lead) && p.bio) {
    const parsed = parseBio(p.bio);
    if (!bullets.length) bullets = parsed.bullets;
    if (!lead) lead = parsed.lead;
  }

  return {
    id: p.id || p.slug || p.name || fallbackName,
    name: p.name || fallbackName,
    degree: p.degree || fallbackDegree,
    photo: p.photo || fallbackPhoto,
    tags: p.tags || fallbackTags || [],
    bullets,
    lead,
  };
}

export default function NutritionistSection() {
  const { t } = useTranslation();

  // Título de sección: usa el de "profile.title" si no definiste uno específico para el carrusel
  const sectionTitle = t("profilesTitle", {
    defaultValue: t("profile.title", "Conoce a la profesional"),
  });

  // Intentamos leer el array 'profiles' (nuevo modelo). Si no existe, caemos al perfil único.
  const profilesFromI18n = t("profiles", { returnObjects: true });
  const hasArray = Array.isArray(profilesFromI18n) && profilesFromI18n.length > 0;

  // Fallback (tu modelo actual)
  const single = !hasArray && {
    name: t("profile.name"),
    degree: t("profile.degree"),
    photo: t("profile.photo"),
    tags: t("profile.tags", { returnObjects: true }) || [],
    bio: t("profile.bio"),
  };

  const items = useMemo(() => {
    if (hasArray) {
      // normalizamos todos los perfiles del array
      return profilesFromI18n
        .map((p) =>
          normalizeProfile(
            p,
            t("profile.name"),
            t("profile.degree"),
            t("profile.photo"),
            t("profile.tags", { returnObjects: true })
          )
        )
        .filter(Boolean);
    }
    // si no hay array, normalizamos el único
    return [
      normalizeProfile(
        single,
        t("profile.name"),
        t("profile.degree"),
        t("profile.photo"),
        t("profile.tags", { returnObjects: true })
      ),
    ].filter(Boolean);
  }, [hasArray, profilesFromI18n, single, t]);

  // Callbacks CTAs
  const onContactProfile = (profile) => {
    const prefill =
      t("whatsapp.greetings.morning", "¡Hola!") +
      ` ${profile?.name ? `Soy ${profile.name}. ` : ""}` +
      t(
        "whatsapp.message",
        "Me gustaría obtener más información sobre una posible consulta. ¡Muchas gracias!"
      );
    window.dispatchEvent(new CustomEvent("open-whatsapp", { detail: { prefill } }));
  };

  const onLoginProfile = () => {
    window.location.href = "/login";
  };

  if (!items.length) return null;

  return (
    <section className="py-14 md:py-20" aria-labelledby="nutritionists-title">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <h2
          id="nutritionists-title"
          className="text-center text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-1)]"
        >
          {sectionTitle}
        </h2>

        <div className="mt-8">
          <NutritionistCarousel
            items={items}
            onContactProfile={onContactProfile}
            onLoginProfile={onLoginProfile}
          />
        </div>
      </div>
    </section>
  );
}
