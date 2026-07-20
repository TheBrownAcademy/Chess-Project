import { useState } from "react";
import { Menu } from "lucide-react";
import { useLogoAnimation } from "../hooks/useLogoAnimation";
import { useButtonGlow } from "../hooks/useButtonGlow";
import { soundManager } from "../utils/SoundManager";
import SoundToggle from "./SoundToggle";
import { useSession } from "../hooks/useSession";
import { AuthModal } from "./AuthModal";
import { AvatarDropdown } from "./AvatarDropdown";
import { useNavigate, useLocation } from "react-router";

export default function Navbar({
  onToggleSidebar,
  showMenuButton = true,
}: {
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");
  const { status } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const ctaGlowRef = useButtonGlow<HTMLButtonElement>();
  const { containerRef, logoRef } = useLogoAnimation();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    soundManager.playButtonClick();

    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const openModal = (mode: "login" | "register") => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-[#080B14]/85 backdrop-blur-md border-b border-brand-border flex items-center justify-between px-4 md:px-6">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-4">
          {showMenuButton && onToggleSidebar && (
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onToggleSidebar();
              }}
              className="p-2 text-brand-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            ref={containerRef}
            className="flex items-center gap-2 cursor-pointer select-none"
            style={{ perspective: "600px" }}
            onClick={handleLogoClick}
            role="link"
            tabIndex={0}
            aria-label="XLChess Home"
          >
            <img
              ref={logoRef}
              src="/final%20logo.png"
              alt="XLChess logo"
              className="h-10 w-auto object-contain"
              draggable={false}
              style={{
                willChange: "transform, filter",
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
              }}
            />
          </div>
        </div>

        {/* Right: Sound Toggle & Auth Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          <SoundToggle />

          {status === "loading" ? (
            <div className="w-6 h-6 rounded-full border-2 border-brand-accent/30 border-t-brand-accent animate-spin" />
          ) : status === "authenticated" ? (
            <AvatarDropdown />
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => openModal("login")}
                className="nav-link font-sans font-light text-xs sm:text-sm tracking-wide text-brand-secondary hover:text-ivory transition-colors duration-300 cursor-pointer"
                style={{ letterSpacing: "0.06em" }}
              >
                Login
              </button>
              <span className="text-brand-border/40 text-sm select-none hidden sm:inline">
                |
              </span>
              <button
                ref={ctaGlowRef}
                onClick={() => openModal("register")}
                className="btn-premium-cta btn-glow-container cta-shine px-4 py-2 rounded-sm text-[10px] sm:text-xs cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Reusable Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />
    </>
  );
}
