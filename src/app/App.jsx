// src/app/App.jsx
import { useTranslation } from "react-i18next";

import Navbar from "../components/navigation/Navbar.jsx";
import Hero from "../components/landing/Hero.jsx";
import ServicesSection from "../components/landing/ServicesSection.jsx";
import WhyUsSection from "../components/landing/WhyUsSection.jsx";
import NutritionistSection from "../components/landing/NutritionistSection.jsx";
import TestimonialsSection from "../components/landing/TestimonialsSection.jsx";
import FAQSection from "../components/landing/FAQSection.jsx";
import ContactCTA from "../components/landing/ContactCTA.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import FabWhatsApp from "../components/common/FabWhatsApp.jsx";
import { BRAND } from "../lib/brand";

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh scroll-smooth bg-white text-gray-900 dark:bg-neutral-900 dark:text-white antialiased selection:bg-violet-200/60 dark:selection:bg-violet-400/30">
      {/* Header */}
      <Navbar />

      {/* Main */}
      <main id="content" className="relative scroll-pt-16">
        {/* Título accesible para lectores de pantalla */}
        <h1 className="sr-only">
          {t("hero.title", { brand: BRAND?.name ?? "NutriSalud" })}
        </h1>

        {/* HERO con banda sutil */}
        <section className="bg-gradient-to-b from-violet-50/70 to-transparent dark:from-neutral-900">
          <Hero />
        </section>

        {/* SERVICES */}
        <section id="services" aria-labelledby="services-title">
          <ServicesSection />
        </section>

        {/* WHY US */}
        <section id="why-us" aria-labelledby="whyus-title">
          <WhyUsSection />
        </section>

        {/* Perfil de la profesional */}
        <section id="profile" aria-labelledby="profile-title">
          <NutritionistSection />
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" aria-labelledby="testimonials-title">
          <TestimonialsSection />
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title">
          <FAQSection />
        </section>

        {/* CTA final (WhatsApp) */}
        <ContactCTA />
      </main>

      {/* Footer del sitio */}
      <SiteFooter />

      {/* Botón flotante de WhatsApp */}
      <FabWhatsApp />
    </div>
  );
}
