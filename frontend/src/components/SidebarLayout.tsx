import { useState } from "react";
import { Menu, X, Home, Puzzle, CreditCard, User } from "lucide-react";
import { useLogoAnimation } from "../hooks/useLogoAnimation";
import { useButtonGlow } from "../hooks/useButtonGlow";
import { soundManager } from "../utils/SoundManager";
import SoundToggle from "./SoundToggle";
import { useSession } from "../hooks/useSession";
import { AuthModal } from "./AuthModal";
import { AvatarDropdown } from "./AvatarDropdown";
import { navigate, useRoute } from "../hooks/useRoute";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");
  const { status } = useSession();
  const path = useRoute();

  const ctaGlowRef = useButtonGlow<HTMLButtonElement>();
  const { containerRef, logoRef } = useLogoAnimation();

  // Normalize path to detect active state
  const normalizedPath = path.replace(/\/+$/, "") || "/";

  const menuItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Puzzles", href: "/puzzles", icon: Puzzle },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const handleLinkClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    soundManager.playButtonClick();
    setIsMobileOpen(false);

    if (href === "/" && normalizedPath === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  const openModal = (mode: "login" | "register") => {
    setModalMode(mode);
    setIsModalOpen(true);
    setIsMobileOpen(false);
  };

  const handleToggle = () => {
    soundManager.playButtonClick();
    if (window.innerWidth < 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  };
  

  return (
    <div className="min-h-screen text-brand-text bg-brand-bg flex flex-col relative select-none">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-[#080B14]/85 backdrop-blur-md border-b border-brand-border flex items-center justify-between px-4 md:px-6">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            className="p-2 text-brand-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            ref={containerRef}
            className="flex items-center gap-2 cursor-pointer select-none"
            style={{ perspective: "600px" }}
            onClick={(e) => handleLinkClick("/", e)}
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

      {/* ── MAIN CONTENT CONTAINER ─────────────────────────────────────────── */}
      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar (Fixed) */}
        <aside
          className={`fixed top-16 left-0 bottom-0 z-30 bg-[#080B14]/90 backdrop-blur-md border-r border-brand-border flex flex-col py-4 transition-all duration-300 hidden md:flex ${
            isExpanded ? "w-64" : "w-20"
          }`}
        >
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = normalizedPath === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleLinkClick(item.href, e)}
                  className={`b1 group relative flex transition-all duration-200 cursor-pointer ${
                    isExpanded
                      ? `items-center gap-4 px-4 py-3 mx-3 rounded-xl ${
                          isActive
                            ? "text-brand-accent bg-brand-accent/10 font-medium shadow-[inset_1px_0_0_rgba(212,175,110,0.1)]"
                            : "text-brand-secondary hover:text-white hover:bg-white/5"
                        }`
                      : `flex-col items-center justify-center py-2.5 mx-2 rounded-lg text-center ${
                          isActive
                            ? "text-brand-accent bg-brand-accent/10 border-brand-accent font-medium"
                            : "text-brand-secondary hover:text-white hover:bg-white/5"
                        }`
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-brand-accent" : "text-brand-secondary group-hover:text-white"}`}
                  />
                  <span
                    className={`font-sans tracking-wide transition-all ${
                      isExpanded ? "text-sm" : "text-[10px] mt-1"
                    }`}
                  >
                    {item.name}
                  </span>
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar (Slide-out Overlay Drawer) */}
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
            isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Drawer itself */}
        <aside
          className={`fixed top-0 left-0 bottom-0 w-64 z-50 bg-[#080B14] border-r border-brand-border flex flex-col py-4 transition-transform duration-300 ease-in-out md:hidden ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 pb-4 border-b border-brand-border/40">
            <span className="font-display font-medium text-lg text-brand-accent tracking-wide">
              Navigation
            </span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 text-brand-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 mt-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = normalizedPath === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleLinkClick(item.href, e)}
                  className={`group flex items-center gap-4 px-4 py-3 mx-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-brand-accent bg-brand-accent/10 font-medium"
                      : "text-brand-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-brand-accent" : "text-brand-secondary group-hover:text-white"}`}
                  />
                  <span className="font-sans text-sm tracking-wide">
                    {item.name}
                  </span>
                </a>
              );
            })}
          </nav>
        </aside>

        {/* ── MAIN CONTENT WORKSPACE ─────────────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isExpanded ? "md:pl-64" : "md:pl-20"
          }`}
        >
          {children}
        </div>
      </div>

      {/* Reusable Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />
    </div>
  );
}
