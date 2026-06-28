/**
 * BrandSection.tsx
 * Mirrored hero-style section placed directly below the Hero.
 * Image on right, text on left (desktop).
 * GSAP ScrollTrigger animations: image slides from right, text slides from left.
 */

import { useRef } from 'react';
import { useGSAP } from '../hooks/useGSAP';
import { gsap, dur } from '../utils/gsapConfig';
import { ArrowRight } from 'lucide-react';

export default function BrandSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !imageRef.current || !textRef.current) return;

      // Text — fade right
      gsap.fromTo(
        textRef.current,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: dur(1),
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Image — fade left
      gsap.fromTo(
        imageRef.current,
        { x: 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: dur(1),
          delay: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

    },
    sectionRef,
    []
  );

  return (
    <section
      ref={sectionRef}
      id="brand-section"
      className="relative py-20 md:py-32 overflow-hidden bg-brand-bg"
    >
      {/* Soft blue ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: 'rgba(99, 102, 241, 0.04)' }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Banner Area */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Left — Text Content */}
          <div
            ref={textRef}
            className="w-full lg:w-[55%] space-y-8 text-left"
            style={{ opacity: 0 }}
          >

            <div className="space-y-4 max-w-xl">
              <h2 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.05]">
                <span className="block">Build More Than</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-indigo-400 to-violet-400 drop-shadow-[0_0_24px_rgba(99,102,241,0.2)]">
                  Subscribers
                </span>
              </h2>
            </div>

            <div className="space-y-4 max-w-lg">
              <p className="font-sans text-base sm:text-[19px] text-brand-secondary/90 leading-relaxed font-medium">
                You've already done the hard part: building an audience.
              </p>
              <p className="font-sans text-base sm:text-[19px] text-brand-secondary/90 leading-relaxed font-medium">
                Now build a platform around your brand that grows with you.
              </p>
            </div>
            
            <div className="pt-4">
              <button 
                onClick={() => {
                  document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-3 font-sans font-semibold text-[17px] bg-gradient-to-r from-[#6e63f6] via-[#7268f8] to-[#7b6dff] hover:brightness-110 text-white rounded-xl transition-all duration-300 shadow-[0_0_34px_rgba(110,99,246,0.35),0_12px_42px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_0_46px_rgba(110,99,246,0.55),0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.28)] hover:-translate-y-1 btn-glow-container btn-glow-accent cta-shine px-8 py-4 group"
              >
                Build Your Platform
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right — Artwork Image */}
          <div
            ref={imageRef}
            className="w-full lg:w-[45%] flex justify-center lg:justify-end"
            style={{ opacity: 0 }}
          >
            <div className="w-full max-w-[600px] relative scale-[1.1] origin-right">
              <div className="absolute inset-0 bg-brand-accent/20 blur-[80px] rounded-full mix-blend-screen pointer-events-none" />
              <img
                src="/banner_artwork.png"
                alt="Creator chess illustration"
                className="w-full h-auto object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-transform duration-700 hover:scale-[1.02]"
                draggable={false}
              />
            </div>
          </div>

        </div>



      </div>
    </section>
  );
}
