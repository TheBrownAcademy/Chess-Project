/**
 * App.tsx
 * Root application component.
 * GSAP plugins are registered here via gsapConfig (runs once at module level).
 * The smooth-wrapper / smooth-content divs prepare for ScrollSmoother (Club)
 * and currently drive native CSS smooth scroll.
 *
 * Premium additions:
 *   - PremiumLoader: cinematic rook loader that dissolves into the page
 *   - Navbar: luxury glassmorphism gold navigation
 */

// ── GSAP: register plugins immediately (before any component renders) ──────
import './utils/gsapConfig';

import { useState } from 'react';

import Hero from './components/Hero';
import BrandSection from './components/BrandSection';
import ProductDemo from './components/ProductDemo';
import PartnerCTA from './components/PartnerCTA';
import Footer from './components/Footer';
import GlobalBackground from './components/GlobalBackground';
import Navbar from './components/Navbar';
import PremiumLoader from './components/PremiumLoader';
import PuzzlePage from './pages/PuzzlePage';
import ProfilePage from './pages/ProfilePage';
import { useRoute } from './hooks/useRoute';

import { ParticlesProvider } from '@tsparticles/react';
import { loadConfettiCannonPreset } from '@tsparticles/preset-confetti-cannon';

const initParticles = async (engine: any) => {
  await loadConfettiCannonPreset(engine);
};

function App() {
  // ── Loader: show only once per browser session (persists across client-side navigation) ──
  const [loaderDone, setLoaderDone] = useState(() => {
    try {
      return sessionStorage.getItem('xlchess_loader_shown') === 'true';
    } catch {
      return false;
    }
  });

  const handleLoaderComplete = () => {
    try {
      sessionStorage.setItem('xlchess_loader_shown', 'true');
    } catch {
      // Ignore storage errors (private browsing, etc.)
    }
    setLoaderDone(true);
  };

  const path = useRoute();
  const normalizedPath = path.replace(/\/+$/, '') || '/';
  const isPuzzlesPage = normalizedPath === '/puzzles' || window.location.hash.startsWith('#/puzzles');
  const isProfilePage = normalizedPath === '/profile';

  return (
    <ParticlesProvider init={initParticles}>

      {/* ── Premium Loader — shown until page is ready (once per session) ── */}
      {!loaderDone && (
        <PremiumLoader onComplete={handleLoaderComplete} />
      )}

      {/* ── Ambient background chess pieces ─────────────────────────────── */}
      <GlobalBackground />

      {/* smooth-wrapper + smooth-content: ScrollSmoother-ready DOM structure. */}
      <div id="smooth-wrapper">
        <div id="smooth-content">

          {isPuzzlesPage ? (
            <PuzzlePage />
          ) : isProfilePage ? (
            <ProfilePage />
          ) : (
            /* Landing Page Content */
            <div className="min-h-screen text-brand-text flex flex-col">
              {/* Premium Navigation */}
              <Navbar />

              <main className="flex-1">

                {/* Section 1: Hero Visual and Brand Statement */}
                <Hero />

                {/* Section 2: Build More Than Subscribers */}
                <BrandSection />

                {/* Section 3: Interactive Product Demo (Chessboard + Stockfish) */}
                <ProductDemo />

                {/* Section 4: Partner Call to Action */}
                <PartnerCTA />

              </main>

              {/* Footer Summary */}
              <Footer />
            </div>
          )}

        </div>
      </div>
    </ParticlesProvider>
  );
}

export default App;
