/**
 * BrandSection.tsx
 * "The Architecture of Independence" — premium editorial section.
 *
 * Scroll animation: text clips in from the left while image scales in from the right.
 * Uses ScrollTrigger scrub for a cinematic, scroll-driven feel.
 * No business logic changed.
 */

import { useRef } from "react";
import { useGSAP } from "../hooks/useGSAP";
import { gsap, dur, ScrollTrigger } from "../utils/gsapConfig";
import { ArrowRight } from "lucide-react";

export default function BrandSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !imageRef.current || !textRef.current) return;

      // ── Eyebrow + divider reveal ────────────────────────────────────────
      gsap.fromTo(
        [eyebrowRef.current, dividerRef.current],
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: dur(0.8),
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        },
      );

      // ── Headline — line by line masked clip ────────────────────────────
      const lines = headlineRef.current?.querySelectorAll(".headline-line");
      if (lines?.length) {
        gsap.fromTo(
          lines,
          { y: 60, opacity: 0, rotationX: 25 },
          {
            y: 0,
            opacity: 1,
            rotationX: 0,
            duration: dur(1.0),
            stagger: 0.12,
            ease: "expo.out",
            transformOrigin: "50% 100%",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 78%",
              toggleActions: "play none none none",
            },
          },
        );
      }

      // ── Body text — word reveal ─────────────────────────────────────────
      gsap.fromTo(
        bodyRef.current,
        { y: 30, opacity: 0, filter: "blur(4px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: dur(0.9),
          ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
            toggleActions: "play none none none",
          },
        },
      );

      // ── CTA reveal ─────────────────────────────────────────────────────
      gsap.fromTo(
        ctaRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: dur(0.7),
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 68%",
            toggleActions: "play none none none",
          },
        },
      );

      // ── Image: scale-wipe from right ───────────────────────────────────
      gsap.fromTo(
        imageRef.current,
        {
          x: 60,
          opacity: 0,
          scale: 0.94,
          filter: "blur(8px)",
        },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: dur(1.2),
          ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 76%",
            toggleActions: "play none none none",
          },
        },
      );

      // ── Subtle parallax on image during scroll ─────────────────────────
      gsap.to(imageRef.current, {
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      return () => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    },
    sectionRef,
    [],
  );

  return (
    <>
      {/* Section divider */}
      <div className="section-divider" aria-hidden="true" />

      <section
        ref={sectionRef}
        id="brand-section"
        className="relative py-28 md:py-40 overflow-hidden"
      >
        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: "rgba(212, 175, 110, 0.025)" }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Left — Text */}
            <div
              ref={textRef}
              className="w-full lg:w-[52%] space-y-10 text-left"
            >
              {/* Eyebrow */}
              <div
                ref={eyebrowRef}
                className="section-eyebrow"
                style={{ opacity: 0 }}
                aria-hidden="true"
              >
                For Creators &amp; Educators
              </div>

              {/* Section top divider line */}
              <div
                ref={dividerRef}
                className="section-divider-strong"
                style={{ opacity: 0, maxWidth: "120px" }}
                aria-hidden="true"
              />

              {/* Headline */}
              <h2
                ref={headlineRef}
                className="font-display text-5xl sm:text-6xl md:text-7xl tracking-editorial leading-[0.95]"
                style={{ color: "var(--text-primary)", perspective: "800px" }}
              >
                <span className="headline-line block" style={{ opacity: 0 }}>
                  Build More Than
                </span>
                <span
                  className="headline-line block text-gold-gradient font-display"
                  style={{ opacity: 0, fontStyle: "italic", fontWeight: 400 }}
                >
                  Subscribers
                </span>
              </h2>

              {/* Body */}
              <div
                ref={bodyRef}
                className="space-y-5 max-w-lg"
                style={{ opacity: 0 }}
              >
                <p
                  className="font-sans text-base sm:text-[18px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  You've already done the difficult work — building an audience
                  that trusts you.
                </p>
                <p
                  className="font-sans text-base sm:text-[18px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Now build a platform worthy of that trust. One that bears your
                  name, your aesthetic, and your vision — independent from every
                  platform that doesn't.
                </p>
              </div>

              {/* CTA */}
              <div ref={ctaRef} className="pt-2" style={{ opacity: 0 }}>
                <button
                  onClick={() => {
                    document
                      .getElementById("partner-cta")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center justify-center gap-3 font-sans font-medium text-sm
                    btn-premium-cta cta-shine btn-glow-container btn-glow-surface
                    px-8 py-4 rounded-sm group"
                  style={{
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Build Your Platform
                  <ArrowRight className="w-4 h-4 transition-transform duration-400 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Right — Artwork */}
            <div
              ref={imageRef}
              className="w-full lg:w-[48%] flex justify-center lg:justify-end"
              style={{ opacity: 0 }}
            >
              <div className="w-full max-w-[580px] relative">
                {/* Ambient glow behind image */}
                <div
                  className="absolute inset-0 rounded-full blur-[80px] pointer-events-none"
                  style={{
                    background: "rgba(212, 175, 110, 0.06)",
                    mixBlendMode: "screen",
                  }}
                  aria-hidden="true"
                />
                <div
                  className="luxury-card w-full"
                  style={{
                    borderRadius: "2px",
                    filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.5))",
                    transform: "scale(1.06)",
                    transformOrigin: "center right",
                  }}
                >
                  <img
                    src="/final%20banner.png"
                    alt="Build More Than Subscribers — XLChess platform artwork"
                    className="w-full h-auto object-contain block relative z-10"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
