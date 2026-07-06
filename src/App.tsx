/**
 * App.tsx
 * Root application component.
 *
 * GSAP plugins are registered here via gsapConfig (runs once at module level).
 * The smooth-wrapper / smooth-content divs prepare for ScrollSmoother (Club)
 * and currently drive native CSS smooth scroll.
 *
 * Premium additions:
 *   - PremiumLoader: cinematic rook loader that dissolves into the page
 *   - ChessCursorEnvironment: elegant chess-notation particle cursor
 */

// ── GSAP: register plugins immediately (before any component renders) ──────
import './utils/gsapConfig';

import { useState } from 'react';

import Hero from './components/Hero';
import BrandSection from './components/BrandSection';
import Features from './components/Features';
import Integrations from './components/Integrations';
import HowItWorks from './components/HowItWorks';
import ProductDemo from './components/ProductDemo';
import PartnerCTA from './components/PartnerCTA';
import Footer from './components/Footer';
import GlobalBackground from './components/GlobalBackground';
import PremiumLoader from './components/PremiumLoader';
import ChessCursorEnvironment from './components/ChessCursorEnvironment';

import { ParticlesProvider } from '@tsparticles/react';
import { loadConfettiCannonPreset } from '@tsparticles/preset-confetti-cannon';

const initParticles = async (engine: any) => {
  await loadConfettiCannonPreset(engine);
};

function App() {
  const [loaderDone, setLoaderDone] = useState(false);

  return (
    <ParticlesProvider init={initParticles}>

      {/* ── Premium Loader — shown until page is ready ──────────────────── */}
      {!loaderDone && (
        <PremiumLoader onComplete={() => setLoaderDone(true)} />
      )}

      {/* ── Chess Cursor Environment — global canvas overlay ────────────── */}
      <ChessCursorEnvironment />

      {/* ── Ambient background chess pieces ─────────────────────────────── */}
      <GlobalBackground />

      {/* smooth-wrapper + smooth-content: ScrollSmoother-ready DOM structure.
         ScrollTrigger uses #smooth-content as the scroller when Club is enabled. */}
      <div id="smooth-wrapper">
        <div id="smooth-content">

          {/* Landing Page Content */}
          <div className="min-h-screen text-brand-text flex flex-col selection:bg-gold selection:text-obsidian">
            <main className="flex-1">

              {/* Section 1: Hero Visual and Brand Statement */}
              <Hero />

              {/* Section 2: Build More Than Subscribers */}
              <BrandSection />

              {/* Section 3: Why Independence Matters */}
              <Features />

              {/* Integrations: Connected Ecosystem */}
              <Integrations />

              {/* Section 4: How It Works — Three Moves */}
              <HowItWorks />

              {/* Section 5: Interactive Product Demo (Chessboard + Stockfish) */}
              <ProductDemo />

              {/* Section 6: Partner Call to Action */}
              <PartnerCTA />

            </main>

            {/* Footer Summary */}
            <Footer />
          </div>

        </div>
      </div>
    </ParticlesProvider>
  );
}

export default App;
