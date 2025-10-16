// src/app/App.jsx
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import Navbar from "../components/navigation/Navbar.jsx";
import Hero from "../components/landing/Hero.jsx";
import ServicesSection from "../components/landing/ServicesSection.jsx";
import WhyUsSection from "../components/landing/WhyUsSection.jsx";
import NutritionistSection from "../components/landing/NutritionistSection.jsx";
import TestimonialsSection from "../components/landing/TestimonialsSection.jsx";
import FAQSection from "../components/landing/FAQSection.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import FabWhatsApp from "../components/common/FabWhatsApp.jsx";
import { BRAND } from "../lib/brand";

/* === Reveal on scroll === */
function useRevealOnScroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function RevealSection({ as: Tag = "section", className = "", children, ...rest }) {
  const ref = useRevealOnScroll();
  return (
    <Tag ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export default function App() {
  const { t } = useTranslation();

  // contenedor reutilizable
  const Wrap = ({ children, className = "container-narrow" }) => (
    <div className={`${className} px-6 md:px-8`}>{children}</div>
  );

  return (
    <div className="min-h-dvh text-[var(--text-1)] antialiased bg-[var(--surface-0)]">
      <Navbar />

      <main id="content" className="relative scroll-pt-16 page-wash">
        {/* SEO/Accesibilidad */}
        <h1 className="sr-only">
          {t("hero.title", { brand: BRAND?.name ?? "NutriSalud" })}
        </h1>

        {/* HERO con feather inferior para disolver la unión */}
        <div className="hero-join">
          <Hero />
        </div>

        {/* Servicios */}
        <RevealSection
          as="section"
          id="services"
          aria-labelledby="services-title"
          className="section stripe--alt section-wallpaper wall--services feather-edges feather-m join-fix"
        >
          <Wrap className="stagger">
            <ServicesSection />
          </Wrap>
        </RevealSection>

        {/* ¿Por qué elegirnos? — contenedor más estrecho para armonía */}
        <RevealSection
          as="section"
          id="why-us"
          aria-labelledby="whyus-title"
          className="section stripe section-wallpaper wall--why feather-edges feather-m join-fix"
        >
          <Wrap className="container-why stagger">
            <WhyUsSection />
          </Wrap>
        </RevealSection>

        {/* Perfil */}
        <RevealSection
          as="section"
          id="profile"
          aria-labelledby="profile-title"
          className="section stripe--alt section-wallpaper wall--profile feather-edges feather-m join-fix"
        >
          <Wrap className="container-wide stagger">
            <NutritionistSection />
          </Wrap>
        </RevealSection>

        {/* Testimonios */}
        <RevealSection
          as="section"
          id="testimonials"
          aria-labelledby="testimonials-title"
          className="section stripe section-wallpaper wall--testimonials feather-edges feather-m join-fix"
        >
          <Wrap className="stagger">
            <TestimonialsSection />
          </Wrap>
        </RevealSection>

        {/* FAQ */}
        <RevealSection
          as="section"
          id="faq"
          aria-labelledby="faq-title"
          className="section stripe--alt section-wallpaper wall--faq feather-edges feather-m join-fix"
        >
          <Wrap className="container-narrow stagger">
            <FAQSection />
          </Wrap>
        </RevealSection>

        {/* ancla para #contact si fuese necesario */}
        <section id="contact" className="sr-only" aria-hidden="true" />
      </main>

      {/* Feather superior del footer para eliminar línea rígida */}
      <div className="footer-join">
        <SiteFooter />
      </div>

      <FabWhatsApp />
    </div>
  );
}
