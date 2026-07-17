import { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useNavigate, useLocation } from 'react-router';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  useScrollReveal(footerRef as React.RefObject<Element | null>, { y: 40, duration: 0.7 });
  const navigate = useNavigate();
  const location = useLocation();

  const handlePlayClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const demoSection = document.getElementById('interactive-demo');
      if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate('/?scroll=interactive-demo');
    }
  };

  const handlePuzzlesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/puzzles');
  };

  return (
    <footer
      ref={footerRef}
      className="footer-luxury"
      style={{ opacity: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-7">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand Signature — static logo */}
          <div className="flex items-center space-x-3 select-none">
            <img
              src="/final%20logo.png"
              alt="XLChess logo"
              className="h-[72px] sm:h-[86px] w-auto object-contain"
              style={{ display: 'block' }}
              draggable={false}
            />
          </div>

          {/* Copyright — centered */}
          <p
            className="font-sans text-xs text-center"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}
          >
            © 2026 XLChess. All rights reserved.
          </p>

          {/* Navigation */}
          <div
            className="flex items-center space-x-2 font-sans text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            <a
              href="#interactive-demo"
              onClick={handlePlayClick}
              className="nav-link transition-colors duration-300"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Play
            </a>
            <span style={{ color: 'var(--marble-line)', margin: '0 6px' }}>|</span>
            <a
              href="/puzzles"
              onClick={handlePuzzlesClick}
              className="nav-link transition-colors duration-300"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Puzzles
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
