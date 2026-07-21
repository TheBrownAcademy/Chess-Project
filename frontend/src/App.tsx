/**
 * App.tsx
 * Root application component.
 * GSAP plugins are registered here via gsapConfig (runs once at module level).
 * The smooth-wrapper / smooth-content divs prepare for ScrollSmoother (Club)
 * and currently drive native CSS smooth scroll.
 *
 * Premium additions:
 *   - PremiumLoader: cinematic rook loader that dissolves into the page
 */

// ── GSAP: register plugins immediately (before any component renders) ──────
import './utils/gsapConfig';

import { useState } from 'react';
import GlobalBackground from './components/GlobalBackground';
import PremiumLoader from './components/PremiumLoader';
import AppRouter from './router/AppRouter';

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
          <AppRouter />
        </div>
      </div>
    </ParticlesProvider>
  );
}

export default App;
