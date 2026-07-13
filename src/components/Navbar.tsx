/**
 * Navbar.tsx
 * Fixed navigation bar with:
 *   - GSAP fade-down entrance on load
 *   - Scroll-direction hide/show (via useNavbarAnimation)
 *   - Luxury gold underline effect on nav links (.nav-link class)
 *   - CTA button with pearl-gold gradient and shine sweep
 *   - Logo: full GSAP interpolate() + quickTo() cursor-driven animation
 *     (via useLogoAnimation hook — see hooks/useLogoAnimation.ts)
 *   - Luxury glassmorphism styling (.navbar-luxury)
 */

import { useState, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavbarAnimation } from '../hooks/useNavbarAnimation';
import { useLogoAnimation } from '../hooks/useLogoAnimation';
import { useButtonGlow } from '../hooks/useButtonGlow';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Navbar entrance + hide/show on scroll
  useNavbarAnimation(navRef as React.RefObject<HTMLElement | null>);

  // Full premium logo animation (interpolate + quickTo + float + dance)
  const { containerRef, logoRef } = useLogoAnimation();

  // Button interactive hover glow
  const ctaGlowRef = useButtonGlow<HTMLAnchorElement>();

  const navLinks = [
    { name: 'Live Demo',        href: '#interactive-demo' },
    { name: 'Practice Puzzles', href: '/puzzles' },
  ];

  return (
    <nav
      ref={navRef}
      id="main-navbar"
      className="fixed top-0 left-0 right-0 z-50 navbar-luxury"
      style={{ opacity: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/*
            ── Logo ───────────────────────────────────────────────────────────
            containerRef  → mouse-event target (receives mousemove/enter/leave)
            logoRef       → visual transform target (rotateX/Y, scale, float)
          */}
          <div
            ref={containerRef}
            className="flex items-center gap-2 cursor-pointer select-none"
            style={{ perspective: '600px' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            role="link"
            tabIndex={0}
            aria-label="XLChess — scroll to top"
          >
            <img
              ref={logoRef}
              src="/final%20logo.png"
              alt="XLChess logo"
              className="h-[40px] sm:h-[52px] w-auto object-contain"
              width={200}
              height={52}
              style={{
                willChange: 'transform, filter',
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
              }}
              draggable={false}
            />
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="nav-link font-sans font-light text-sm tracking-wide text-brand-secondary hover:text-ivory transition-colors duration-300"
                style={{ letterSpacing: '0.06em' }}
              >
                {link.name}
              </a>
            ))}

            {/* Primary CTA — pearl/gold */}
            <a
              ref={ctaGlowRef}
              href="#contact-us"
              id="navbar-cta-btn"
              className="btn-premium-cta btn-glow-container cta-shine px-5 py-2.5 rounded-sm text-sm"
            >
              Become a Partner
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-secondary hover:text-ivory p-2 transition-colors duration-200"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
              aria-controls="mobile-nav-menu"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-b px-4 py-6 space-y-4"
          style={{
            background: 'rgba(8, 11, 20, 0.97)',
            borderColor: 'rgba(212, 175, 110, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-sans font-light text-base text-brand-secondary hover:text-ivory transition-colors py-1"
                style={{ letterSpacing: '0.04em' }}
              >
                {link.name}
              </a>
            ))}
            <div className="section-divider my-1" />
            <a
              href="#contact-us"
              onClick={() => setIsOpen(false)}
              className="btn-premium-cta cta-shine text-center py-3 px-4 rounded-sm block"
            >
              Become a Partner
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
