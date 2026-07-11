import { useState, useRef } from 'react';
import { useNavbarAnimation } from '../hooks/useNavbarAnimation';
import { useLogoAnimation } from '../hooks/useLogoAnimation';
import { useSession } from '../hooks/useSession';
import { AuthModal } from './AuthModal';
import { AvatarDropdown } from './AvatarDropdown';

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  
  // Authentication states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");
  const { status } = useSession();

  const openModal = (mode: "login" | "register") => {
    setModeAndOpen(mode);
  };

  const setModeAndOpen = (mode: "login" | "register") => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // Navbar entrance + hide/show on scroll
  useNavbarAnimation(navRef as React.RefObject<HTMLElement | null>);

  // Full premium logo animation (interpolate + quickTo + float + dance)
  const { containerRef, logoRef } = useLogoAnimation();

  return (
    <nav
      ref={navRef}
      id="main-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/85 backdrop-blur-md border-b border-brand-border"
      style={{ opacity: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo on the left */}
          <div
            ref={containerRef}
            className="flex items-center gap-2 cursor-pointer select-none"
            style={{ perspective: '600px' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            role="link"
            aria-label="XLChess — scroll to top"
          >
            <img
              ref={logoRef}
              src="/final%20logo.png"
              alt="XLChess logo"
              className="h-[68px] sm:h-[80px] w-auto object-contain"
              style={{
                willChange: 'transform, filter',
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
              }}
              draggable={false}
            />
          </div>

          {/* Auth Integration on the right */}
          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-6 h-6 rounded-full border-2 border-brand-accent/30 border-t-brand-accent animate-spin" />
            ) : status === "authenticated" ? (
              <AvatarDropdown />
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => openModal("login")}
                  className="font-sans text-lg md:text-xl font-semibold text-brand-secondary hover:text-white transition-colors cursor-pointer"
                >
                  Login
                </button>
                <span className="text-brand-border/40 text-lg md:text-xl select-none">|</span>
                <button
                  onClick={() => openModal("register")}
                  className="font-sans text-lg md:text-xl font-semibold bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent hover:text-white px-5 py-2.5 rounded-lg border border-brand-accent/30 transition-all duration-200 cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Reusable Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />
    </nav>
  );
}
