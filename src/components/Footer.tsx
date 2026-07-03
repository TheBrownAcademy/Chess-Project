import { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  useScrollReveal(footerRef as React.RefObject<Element | null>, { y: 40, duration: 0.7 });

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
      className="py-4 md:py-6"
      style={{ opacity: 0, backgroundColor: '#0F1D4D' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand Signature — static logo, no animation, no hover */}
          <div className="flex items-center gap-3 select-none">
            <img
              src="/logo without text.png"
              alt="XLChess horse icon"
              className="h-[48px] sm:h-[56px] w-auto object-contain"
              style={{ display: 'block' }}
              draggable={false}
            />
            <div className="flex flex-col justify-center text-left">
              <span className="font-sans font-bold text-xl sm:text-[22px] leading-none text-white tracking-wide">XLCHESS</span>
              <span className="font-sans text-xs sm:text-[13px] text-brand-secondary mt-1 leading-none">Excel at Chess</span>
            </div>
          </div>

          {/* Copyright — centered */}
          <p className="font-sans text-xs text-brand-secondary text-center">
            &copy; 2026 XLChess.
          </p>

          {/* Navigation */}
          <div className="flex items-center space-x-2 font-sans text-xs text-brand-secondary">
            <a
              href="#interactive-demo"
              onClick={handlePlayClick}
              className="hover:text-white transition-colors"
            >
              Play
            </a>
            <span>|</span>
            <a
              href="#hero-section"
              onClick={handlePuzzlesClick}
              className="hover:text-white transition-colors"
            >
              Puzzles
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
