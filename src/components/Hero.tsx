/**
 * Hero.tsx
 * Landing hero section with premium GSAP animations and chess puzzle.
 *
 * Animations:
 *   ① Logo — fade-down entrance
 *   ② Headline lines — staggered fade-up (y:40→0, opacity:0→1, 0.8s each, 0.15s stagger)
 *   ③ Subtitle + CTA buttons — fade-up after headline (back.out spring)
 *   ④ Chessboard container — slide from right (x:80→0) + fade, 1.2s, slight rotation correction
 *   ⑤ Chessboard float — mobile only: infinite y:-8px yoyo (handled by usePerspectiveTilt)
 *   ⑥ Background orbs — CSS keyframe float (no GSAP, pure composited GPU layer)
 *   ⑦ Perspective tilt — desktop: cursor-driven 3D tilt via usePerspectiveTilt hook
 *   ⑧ Ambient board glow + floating particles (new)
 *   ⑨ Mouse parallax on particles (new)
 */

import { useRef } from 'react';

import { useGSAP } from '../hooks/useGSAP';
import { usePerspectiveTilt } from '../hooks/usePerspectiveTilt';

import { useMagneticButton } from '../hooks/useMagneticButton';
import { useButtonGlow } from '../hooks/useButtonGlow';
import { gsap, dur, ease } from '../utils/gsapConfig';
import HeroPuzzle from './HeroPuzzle';

export default function Hero() {
  // ── Animation refs ────────────────────────────────────────────────────────
  const heroRef = useRef<HTMLElement>(null);
  const heroLogoContainerRef = useRef<HTMLDivElement>(null);
  const heroLogoRef = useRef<HTMLImageElement>(null);
  const playIconRef = useRef<HTMLImageElement>(null);
  const playTextRef = useRef<HTMLSpanElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const subPara1Ref = useRef<HTMLParagraphElement>(null);
  const subPara2Ref = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const boardColRef = useRef<HTMLDivElement>(null);

  // ── Perspective tilt hook (manages its own ref) ────────────────────────────
  const tiltRef = usePerspectiveTilt<HTMLDivElement>({
    maxRotate: 6,
    scalePeak: 1.03,
    quickToDuration: 0.35,
    quickToEase: 'power2.out',
    floatDistance: 8,
    floatDuration: 3,
  });

  const primaryGlowRef = useButtonGlow<HTMLAnchorElement>();

  const ctaAnchorRef = useRef<HTMLAnchorElement>(null);

  // Merge glow ref onto the anchor element
  const mergedPlayRef = (el: HTMLAnchorElement | null) => {
    (primaryGlowRef as React.MutableRefObject<HTMLAnchorElement | null>).current = el;
    (ctaAnchorRef as React.MutableRefObject<HTMLAnchorElement | null>).current = el;
  };

  useMagneticButton({ targetRef: playIconRef, containerRef: ctaAnchorRef, magneticStrength: 1.0 });

  // ── GSAP entrance animations ───────────────────────────────────────────────
  useGSAP(
    () => {
      if (!heroRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: ease.out } });

      // ① Logo — fade-down
      tl.fromTo(
        heroLogoRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        0
      );

      // Make containers visible immediately (spans will be opacity 0 initially)
      if (line1Ref.current) line1Ref.current.style.opacity = '1';
      // Do NOT set line2Ref opacity to 1 here because we will animate the container itself
      if (subtitleRef.current) subtitleRef.current.style.opacity = '1';

      // ── Custom SplitText Utility ─────────────────────────────────────────
      const splitText = (element: HTMLElement | null, type: 'char' | 'word') => {
        if (!element) return { spans: [] };
        
        // Use textContent for reliability during React mount
        const text = element.textContent?.trim() || '';
        
        // Preserve accessibility by setting aria-label on the parent container
        // and hiding the split spans from screen readers.
        element.setAttribute('aria-label', text);
        element.innerHTML = '';
        
        const chunks = type === 'char' ? text.split('') : text.split(' ');
        const spans: HTMLSpanElement[] = [];
        
        chunks.forEach((chunk, index) => {
          if (type === 'char' && chunk === ' ') {
             element.appendChild(document.createTextNode(' '));
             return;
          }
          const span = document.createElement('span');
          span.style.display = 'inline-block';
          span.style.opacity = '0';
          span.style.willChange = 'transform, opacity';
          span.setAttribute('aria-hidden', 'true');
          span.textContent = chunk;
          element.appendChild(span);
          spans.push(span);

          // Correctly insert spaces as separate text nodes for 'word' splitting
          if (type === 'word' && index < chunks.length - 1) {
            element.appendChild(document.createTextNode(' '));
          }
        });
        
        return { spans };
      };

      const splitL1 = splitText(line1Ref.current, 'word');
      // Do NOT split line2Ref to preserve its bg-clip-text gradient rendering
      const splitS1 = splitText(subPara1Ref.current, 'word');
      const splitS2 = splitText(subPara2Ref.current, 'word');

      // ② Headline lines — staggered fade-up by word (avoiding filter to protect Safari gradient)
      tl.fromTo(
        [...splitL1.spans, line2Ref.current],
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' },
        0.1
      );

      // ③ Subtitle → fade up by word
      tl.fromTo(
        [...splitS1.spans, ...splitS2.spans],
        { opacity: 0, y: 20, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.02, ease: 'expo.out' },
        '-=0.4'
      );

      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: dur(0.5), ease: ease.spring },
        '-=0.3'
      );

      // ④ Chessboard column — slide from right + rotation correction
      tl.fromTo(
        boardColRef.current,
        { opacity: 0, x: 80, rotation: -3 },
        { opacity: 1, x: 0, rotation: 0, duration: dur(1.2), ease: 'power2.out' },
        0.2  // starts 0.2s after timeline start (parallel with headline)
      );

      // ── Background orbs drift ──────────────────────────────────────────
      const orbA = heroRef.current.querySelector('.hero-orb-a');
      const orbB = heroRef.current.querySelector('.hero-orb-b');
      if (orbA) {
        gsap.to(orbA, {
          x: '+=60',
          y: '-=40',
          scale: 1.15,
          duration: 16,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
      if (orbB) {
        gsap.to(orbB, {
          x: '-=40',
          y: '+=60',
          scale: 0.9,
          duration: 20,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

      // ── Third ambient orb (new — soft gold behind board) ──────────────
      const orbC = heroRef.current.querySelector('.hero-orb-c');
      if (orbC) {
        gsap.to(orbC, {
          x: '+=30',
          y: '-=20',
          scale: 1.1,
          duration: 12,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

      // ── Glow pulses (preserved) ──────────────────────────────────────────
      if (playIconRef.current) {
        gsap.to(playIconRef.current, {
          filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.55))',
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      // ── Play text: split-char hover animation ───────────────────────────
      const ctaEl = ctaAnchorRef.current;
      const textEl = playTextRef.current;
      if (ctaEl && textEl) {
        const chars = textEl.querySelectorAll('.play-char');

        const onMouseEnter = () => {
          gsap.to(chars, {
            y: -18,
            opacity: 0,
            duration: 0.22,
            stagger: 0.028,
            ease: 'power2.in',
            overwrite: true,
          });
        };

        const onMouseLeave = () => {
          gsap.fromTo(
            chars,
            { y: 16, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.38,
              stagger: 0.045,
              ease: 'back.out(1.6)',
              overwrite: true,
            }
          );
        };

        ctaEl.addEventListener('mouseenter', onMouseEnter);
        ctaEl.addEventListener('mouseleave', onMouseLeave);

        return () => {
          ctaEl.removeEventListener('mouseenter', onMouseEnter);
          ctaEl.removeEventListener('mouseleave', onMouseLeave);
        };
      }
    },
    heroRef,
    []
  );

  return (
    <header
      ref={heroRef}
      className="relative pt-16 pb-16 md:pt-24 md:pb-28 overflow-hidden"
      id="hero-section"
    >
      {/* ── Background glow orbs (CSS animated — GPU composited) ─────────── */}
      <div
        className="hero-orb-a absolute top-1/4 left-1/2 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="hero-orb-b absolute top-10 right-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none"
        aria-hidden="true"
      />
      {/* ── New: soft amber/gold ambient glow behind board area ────────────── */}
      <div
        className="hero-orb-c absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/4 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-end items-center">

          {/* ── Text Column ────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left">

            {/* Logo above heading */}
            <div
              ref={heroLogoContainerRef}
              className="flex items-center select-none"
            >
              <img
                ref={heroLogoRef}
                src="/final%20logo.png"
                alt="XLChess logo"
                className="object-contain"
                style={{
                  height: '160px',
                  width: 'auto',
                  maxWidth: 'none',
                  willChange: 'transform, filter',
                  transformOrigin: 'center left',
                }}
                draggable={false}
              />
            </div>

            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] md:leading-[1.05]">
              {/* Each span is a separate animation target */}
              <span ref={line1Ref} className="block" style={{ opacity: 0 }}>
                Build the Future of
              </span>
              <span
                ref={line2Ref}
                className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-indigo-400 to-violet-400"
                style={{ opacity: 0 }}
              >
                Online Chess
              </span>
            </h1>

            <div
              ref={subtitleRef}
              className="font-sans max-w-xl leading-relaxed space-y-3"
              style={{ opacity: 0 }}
            >
              <p ref={subPara1Ref} className="text-xl sm:text-2xl font-medium text-white/90">
                Making the Best Move on the Way to the Top.
              </p>
              <p ref={subPara2Ref} className="text-base sm:text-lg text-brand-secondary">
                A complete chess platform to play, learn, compete, and grow—built to become the world's #1 destination for chess.
              </p>
            </div>

            {/* CTA — Play Demo only */}
            <div
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              style={{ opacity: 0 }}
            >
              <a
                ref={mergedPlayRef}
                href="#interactive-demo"
                id="hero-cta-primary"
                className="
                  inline-flex items-center justify-center
                  font-sans font-semibold text-[17px]
                  bg-brand-accent hover:bg-brand-accent/95 text-white
                  rounded-lg
                  transition-colors duration-200
                  shadow-xl shadow-brand-accent/20
                  btn-glow-container btn-glow-accent cta-shine
                  group
                "
                style={{
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  width: '140px',
                  height: '64px',
                  padding: '0 10px',
                }}
              >
                <img
                  ref={playIconRef}
                  src="/play icon.png"
                  alt="Play"
                  style={{
                    width: '62px',
                    height: '62px',
                    objectFit: 'contain',
                    willChange: 'transform, filter',
                    transformOrigin: 'center center',
                    flexShrink: 0,
                  }}
                  draggable={false}
                />
                <span
                  ref={playTextRef}
                  className="ml-2 font-sans font-semibold text-[17px] flex overflow-hidden"
                  style={{ lineHeight: 1 }}
                >
                  {'Play'.split('').map((char, i) => (
                    <span
                      key={i}
                      className="play-char inline-block"
                      style={{ display: 'inline-block' }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </a>
            </div>
          </div>

          {/* ── Chessboard / Puzzle Column ──────────────────────────────────── */}
          {/*
            perspective is set on the PARENT so 3D child transforms render correctly.
            transformStyle: preserve-3d propagates depth through nested elements.
          */}
          <div
            ref={boardColRef}
            className="lg:col-span-6 flex justify-center"
            style={{
              opacity: 0,
              perspective: '1000px',
            }}
          >
            {/*
              tiltRef is attached here — usePerspectiveTilt owns:
                Desktop: rotateX/Y + scale + dynamic shadow via mousemove
                Mobile:  translateY yoyo float
              CSS transition removed from this wrapper (GSAP handles everything).
            */}
            <div
              ref={tiltRef}
              className="w-full max-w-[440px] md:max-w-[480px]"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform, filter',
              }}
            >
              {/*
                Board card — wraps HeroPuzzle, which owns:
                - puzzle board + state machine
                - move counter
                - notation panel
                - Solve + Reset buttons
                - confetti trigger
                - board glow animation
              */}
              <div
                className="bg-brand-surface border border-brand-border rounded-none shadow-2xl overflow-hidden hero-board-card"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Board Area */}
                <div className="p-4 bg-brand-surface">
                  <HeroPuzzle />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
