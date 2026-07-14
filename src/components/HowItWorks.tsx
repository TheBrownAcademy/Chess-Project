/**
 * HowItWorks.tsx
 * ScrollTrigger animations:
 *   - Header: fade-up
 *   - Step cards: sequential stagger (left-to-right, 0.15s between)
 *
 * Design: Black & Gold premium
 */

import { useRef } from 'react';
import { Palette, Cpu, Rocket } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function HowItWorks() {
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef  = useRef<HTMLDivElement>(null);

  // Header fade-up
  useScrollReveal(headerRef as React.RefObject<Element | null>, { y: 50, duration: 0.8 });

  // Steps stagger reveal
  useScrollReveal(stepsRef as React.RefObject<Element | null>, {
    selector: ':scope > div',
    y: 55,
    stagger: 0.15,
    duration: 0.75,
    start: 'top 85%',
  });

  const steps = [
    {
      num: '01',
      icon: <Palette className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Choose Your Brand',
      description:
        'Upload your organization logos, configure color palettes matching your academy colors, and connect your custom domain name (e.g. academy.yourname.com).',
    },
    {
      num: '02',
      icon: <Cpu className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Configure Learning Experience',
      description:
        'Upload video lectures, create interactive puzzle challenges, compile coordinate practice worksheets, and set up customizable subscriber tier access.',
    },
    {
      num: '03',
      icon: <Rocket className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Launch To Audience',
      description:
        'Embed the signup links directly into your streaming descriptions, email newsletters, or website. Instantly invite students to join your owned ecosystem.',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: 'rgba(8, 11, 20, 0.7)', backdropFilter: 'blur(2px)' }}
    >
      <div className="section-divider absolute top-0 left-0 right-0" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4"
          style={{ opacity: 0 }}
        >
          <div className="section-eyebrow justify-center">
            Simple Setup
          </div>
          <h2
            className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            How It <span className="text-gold-gradient" style={{ fontStyle: 'italic', fontWeight: 400 }}>Works</span>
          </h2>
          <p className="font-sans text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Going independent does not require code or hosting setups.{' '}
            Our automated pipeline delivers a production-ready academy portal in three simple steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div ref={stepsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">

          {/* Connecting line (Desktop only) */}
          <div
            className="hidden lg:block absolute top-1/2 left-4 right-4 h-px -translate-y-12 z-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(212,175,110,0.15) 20%, rgba(212,175,110,0.3) 50%, rgba(212,175,110,0.15) 80%, transparent)',
            }}
            aria-hidden="true"
          />

          {steps.map((step, index) => (
            <div
              key={index}
              className="luxury-card relative z-10 flex flex-col items-start text-left space-y-4 p-6 group"
              style={{ opacity: 0, borderRadius: '2px' }}
            >
              {/* Chess board micropattern */}
              <div className="card-board-pattern" aria-hidden="true" />

              {/* Top Row with Number and Icon */}
              <div className="flex items-center justify-between w-full relative z-10">
                <div className="feature-icon-box">
                  {step.icon}
                </div>
                <span
                  className="font-display font-light text-5xl"
                  style={{ color: 'rgba(212, 175, 110, 0.08)', letterSpacing: '-0.04em' }}
                >
                  {step.num}
                </span>
              </div>

              {/* Title & Description */}
              <h3
                className="font-display font-semibold text-xl relative z-10"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
              >
                {step.title}
              </h3>
              <p
                className="font-sans text-sm leading-relaxed relative z-10"
                style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>

      </div>

      <div className="section-divider absolute bottom-0 left-0 right-0" aria-hidden="true" />
    </section>
  );
}
