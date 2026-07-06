/**
 * Footer.tsx
 * Luxury minimal footer with gold accent divider.
 * Navigation logic preserved completely.
 */

import { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  useScrollReveal(footerRef as React.RefObject<Element | null>, { y: 30, duration: 0.8 });

  const handlePlayClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const demoSection = document.getElementById('interactive-demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePuzzlesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer
      ref={footerRef}
      className="footer-luxury py-8 md:py-10"
      style={{ opacity: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand Signature */}
          <div className="flex items-center space-x-3 select-none">
            <img
              src="/final%20logo.png"
              alt="XLChess logo"
              className="h-[64px] sm:h-[76px] w-auto object-contain"
              style={{ display: 'block', opacity: 0.9 }}
              draggable={false}
            />
          </div>

          {/* Chess notation ambient decoration */}
          <div
            className="text-notation text-xs"
            style={{ color: 'rgba(212, 175, 110, 0.2)', letterSpacing: '0.2em' }}
            aria-hidden="true"
          >
            1.e4 e5 2.Nf3 Nc6
          </div>

          {/* Copyright */}
          <p
            className="font-sans text-xs text-center"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}
          >
            &copy; 2026 XLChess. All rights reserved.
          </p>

          {/* Navigation */}
          <div
            className="flex items-center space-x-4 font-sans text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <a
              href="#interactive-demo"
              onClick={handlePlayClick}
              className="hover:text-ivory transition-colors duration-300"
              style={{ letterSpacing: '0.06em' }}
            >
              Play
            </a>
            <span style={{ color: 'rgba(212, 175, 110, 0.2)' }}>·</span>
            <a
              href="#hero-section"
              onClick={handlePuzzlesClick}
              className="hover:text-ivory transition-colors duration-300"
              style={{ letterSpacing: '0.06em' }}
            >
              Puzzles
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
