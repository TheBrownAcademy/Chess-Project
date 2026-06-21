/**
 * App.tsx
 * Root application component.
 * GSAP plugins are registered here via gsapConfig (runs once at module level).
 * The smooth-wrapper / smooth-content divs prepare for ScrollSmoother (Club)
 * and currently drive native CSS smooth scroll.
 */

// ── GSAP: register plugins immediately (before any component renders) ──────
import './utils/gsapConfig';

import Hero from './components/Hero';
import BrandSection from './components/BrandSection';
import ProductDemo from './components/ProductDemo';
import PartnerCTA from './components/PartnerCTA';
import Footer from './components/Footer';

import { ParticlesProvider } from '@tsparticles/react';
import { loadConfettiCannonPreset } from '@tsparticles/preset-confetti-cannon';

const initParticles = async (engine: any) => {
  await loadConfettiCannonPreset(engine);
};

function App() {
  return (
    <ParticlesProvider init={initParticles}>
      {/* smooth-wrapper + smooth-content: ScrollSmoother-ready DOM structure.
         ScrollTrigger uses #smooth-content as the scroller when Club is enabled. */}
      <div id="smooth-wrapper">
        <div id="smooth-content">

        {/* Landing Page Content */}
        <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col selection:bg-brand-accent selection:text-white">
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

      </div>
    </div>
    </ParticlesProvider>
  );
}

export default App;
