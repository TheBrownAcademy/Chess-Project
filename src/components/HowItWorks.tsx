/**
 * HowItWorks.tsx — "The Three Moves"
 *
 * Premium upgrade: scroll-driven vertical timeline.
 * Each step reveals progressively as the user scrolls.
 * Features a vertical connector line that draws from step to step.
 *
 * ScrollTrigger animations:
 *   - Header: masked clip + editorial stagger
 *   - Each step: sequential stagger with left-to-right wipe reveal
 *   - Vertical timeline line: scaleY draw animation
 *
 * Copy upgrade: sharper, more confident editorial tone
 */

import { useRef } from 'react';
import { Palette, Cpu, Rocket } from 'lucide-react';
import { useGSAP } from '../hooks/useGSAP';
import { gsap, dur, ScrollTrigger } from '../utils/gsapConfig';

export default function HowItWorks() {
  const sectionRef  = useRef<HTMLElement>(null);
  const headerRef   = useRef<HTMLDivElement>(null);
  const stepsRef    = useRef<HTMLDivElement>(null);
  const lineRef     = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Header reveal
      gsap.fromTo(
        headerRef.current,
        { y: 50, opacity: 0, filter: 'blur(6px)' },
        {
          y: 0, opacity: 1, filter: 'blur(0px)',
          duration: dur(1.0),
          ease: 'expo.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 84%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Steps: stagger entrance with perspective
      const steps = stepsRef.current?.querySelectorAll('.how-step');
      if (steps?.length) {
        gsap.fromTo(
          steps,
          {
            opacity: 0,
            x: -40,
            filter: 'blur(6px)',
          },
          {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: dur(0.9),
            stagger: 0.18,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      // Timeline line draws in
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: dur(1.4),
            ease: 'expo.out',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 78%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      return () => {
        ScrollTrigger.getAll().forEach(t => t.kill());
      };
    },
    sectionRef,
    []
  );

  const steps = [
    {
      num: '01',
      icon: <Palette className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Define Your Brand',
      description:
        'Upload your logos, configure your color palette to match your academy\'s identity, and connect your custom domain (e.g., academy.yourname.com). Your brand. Your rules.',
    },
    {
      num: '02',
      icon: <Cpu className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Structure the Experience',
      description:
        'Upload video lectures, create interactive puzzle sets, build coordinate training worksheets, and configure subscriber access tiers. Design learning the way you believe it should work.',
    },
    {
      num: '03',
      icon: <Rocket className="w-4 h-4" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Launch to Your Audience',
      description:
        'Embed your sign-up links directly into stream descriptions, email newsletters, or your existing website. Your students arrive in your ecosystem — not a competitor\'s.',
    },
  ];

  return (
    <>
      {/* Section divider */}
      <div className="section-divider" aria-hidden="true" />

      <section
        ref={sectionRef}
        id="how-it-works"
        className="relative py-28 md:py-40 overflow-hidden"
      >
        {/* Ambient */}
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'rgba(212, 175, 110, 0.02)' }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Header */}
          <div
            ref={headerRef}
            className="mb-20 md:mb-28 space-y-6 max-w-2xl"
            style={{ opacity: 0 }}
          >
            <div className="section-eyebrow" aria-hidden="true">
              Getting Started
            </div>

            <h2
              className="font-display text-5xl sm:text-6xl md:text-7xl tracking-editorial leading-[0.95]"
              style={{ color: 'var(--text-primary)' }}
            >
              Three Moves
              <span
                className="block text-gold-gradient font-display"
                style={{ fontStyle: 'italic', fontWeight: 400 }}
              >
                to Independence
              </span>
            </h2>

            <p
              className="font-sans text-base sm:text-[17px] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              No code. No hosting setup. No negotiating with platforms.
              Our automated pipeline delivers a production-ready academy
              in three precise moves.
            </p>
          </div>

          {/* Steps — vertical timeline layout */}
          <div
            ref={stepsRef}
            className="relative max-w-3xl"
          >
            {/* Vertical connector line */}
            <div
              ref={lineRef}
              className="hidden md:block absolute"
              style={{
                left: '20px',
                top: '44px',
                bottom: '80px',
                width: '1px',
                background: 'linear-gradient(180deg, var(--gold-bright) 0%, rgba(212, 175, 110, 0.2) 80%, transparent 100%)',
                transformOrigin: 'top center',
                transform: 'scaleY(0)',
              }}
              aria-hidden="true"
            />

            <div className="space-y-12 md:space-y-16">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="how-step flex items-start gap-8 md:gap-12 relative z-10"
                  style={{ opacity: 0 }}
                >
                  {/* Timeline dot */}
                  <div className="hidden md:flex flex-col items-center pt-1 flex-shrink-0">
                    <div
                      className="timeline-dot"
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'var(--gold-bright)',
                        border: '1px solid rgba(212, 175, 110, 0.4)',
                        boxShadow: '0 0 12px rgba(212, 175, 110, 0.3)',
                        flexShrink: 0,
                        marginTop: '4px',
                      }}
                    />
                  </div>

                  {/* Step content */}
                  <div className="flex-1">
                    <div className="luxury-card p-8 relative" style={{ borderRadius: '2px' }}>
                      {/* Board pattern */}
                      <div className="card-board-pattern" aria-hidden="true" />

                      {/* Step number — large editorial */}
                      <span
                        className="step-number font-display"
                        aria-hidden="true"
                        style={{
                          fontSize: 'clamp(80px, 10vw, 140px)',
                          right: '-0.05em',
                          top: '-0.1em',
                        }}
                      >
                        {step.num}
                      </span>

                      <div className="flex items-start gap-4 relative z-10">
                        {/* Icon box */}
                        <div className="feature-icon-box flex-shrink-0" style={{ marginTop: '2px' }}>
                          {step.icon}
                        </div>

                        <div className="space-y-3">
                          <h3
                            className="font-display text-2xl md:text-3xl font-semibold"
                            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                          >
                            {step.title}
                          </h3>
                          <p
                            className="font-sans text-sm sm:text-base leading-relaxed"
                            style={{ color: 'var(--text-secondary)', lineHeight: '1.75' }}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
