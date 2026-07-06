# Styling and Animations Strategies Reference

This document provides a comprehensive guide to the styling, layout, and animation strategies employed across the Chess Project. It details how the application achieves high-fidelity, high-performance interactions (aiming for 60fps) by combining modern CSS features, Tailwind CSS utility configurations, custom React hooks, GSAP (GreenSock Animation Platform), and HTML5 `<canvas>` overlays.

---

## Table of Contents
1. [Styling Architecture & Design Tokens](#1-styling-architecture--design-tokens)
2. [Layout & Scrollbar Solutions](#2-layout--scrollbar-solutions)
3. [Micro-Interactions & Hover Effects](#3-micro-interactions--hover-effects)
4. [GreenSock (GSAP) Animation System](#4-greensock-gsap-animation-system)
5. [In-Game & Board Animations (Canvas-Based)](#5-in-game--board-animations-canvas-based)
6. [Celebration & Celebration Feedback](#6-celebration--celebration-feedback)
7. [Ambient Background Systems](#7-ambient-background-systems)
8. [Responsive Adjustments & Breakpoints](#8-responsive-adjustments--breakpoints)
9. [Accessibility & Reduced Motion](#9-accessibility--reduced-motion)

---

## 1. Styling Architecture & Design Tokens

### Tailwind CSS Custom Config
The project uses Tailwind CSS for rapid layout utilities, extended by a custom brand color palette and typography system in [tailwind.config.js](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/tailwind.config.js):
- **Core Font**: Inter (`'Inter'`, `system-ui`, `sans-serif`) registered via Google Fonts API in [index.css](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/index.css).
- **Brand Color Palette**:
  - `brand.bg`: `#061631` (Deep dark slate for main layout backdrop)
  - `brand.surface`: `#0F1D4D` (Semi-transparent panels and card surfaces)
  - `brand.accent`: `#6366F1` (Indigo accent for calls to action and active outlines)
  - `brand.text`: `#F8FAFC` (High-contrast slate-50 for body text)
  - `brand.secondary`: `#94A3B8` (Slate-400 for subtext and secondary labels)
  - `brand.border`: `rgba(255, 255, 255, 0.08)` (Subtle white overlay for dividing panels)

---

## 2. Layout & Scrollbar Solutions

### Single Scrollbar Contract
To prevent spec-forced double scrollbars (a common CSS layout issue when animating elements cause horizontal overflow), the project maintains a strict scrollbar contract on the HTML/Body nodes in [index.css](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/index.css#L7-L40):
- **HTML Container**: Assigned `overflow-x: hidden` and `overflow-y: auto`. This designates the HTML document as the *single page-level scroll container*.
- **Body Container**: Configured with `min-height: 100vh`, `background-color: transparent`, and absolutely **no** overflow properties. This avoids a second scroll rendering context.

### Custom Scrollbars
Scrollbars are customized for browsers using Webkit (Chrome, Safari, Edge) and Firefox engines to match the dark theme:
- **Global Scrollbar**: Thin styling (`8px` thumb) utilizing a vertical linear-gradient (`#6366F1` to `#818CF8` to `#6366F1`) with a surrounding dark gap border to elevate the thumb.
- **Move History Scrollbar**: High-contrast, borders-free thumb (`7px` wide) inside `.move-history-scroll` to guarantee maximum visibility during active navigation.
- **Scrollbar Hiding**: The utility class `.no-scrollbar` hides the scrollbar fully across all engines while retaining overflow scroll functionality.

---

## 3. Micro-Interactions & Hover Effects

### Interactive Button & Board Glows
Used in buttons (`Become a Partner`, `Play Again`) and the main chessboard to render cursor-following lighting.
- **Implementation (Desktop)**:
  - Tracks cursor coordinates relative to the container box size.
  - Updates CSS Custom Variables `--glow-x` and `--glow-y` on mouse movement.
  - Animates `--glow-opacity` to `1` on mouse enter and smoothly fade it back to `0` on mouse leave.
  - For buttons, uses GSAP's `quickTo()` with a percentage template: `valueTemplate: (v) => `${v}%`` ([useButtonGlow.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/hooks/useButtonGlow.ts)).
  - For the board, uses `requestAnimationFrame` and a linear interpolation (lerp factor: `0.18`) calculation to avoid valueTemplate warnings and guarantee 60fps tracking ([useBoardCursorGlow.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/hooks/useBoardCursorGlow.ts)).
- **Implementation (Mobile/Touch Fallback)**:
  - Deactivates pointer-tracking events.
  - Loops a gentle scaling pulse (`scale: 1.02` yoyo) and an ambient brightness wave (`--glow-opacity: 0.35` yoyo) via GSAP.

### Magnetic Pull & Wiggle
Pulls target elements (like button icons or text) elastically toward the user's cursor inside a container.
- **Coordinates Projection**: Normalized mouse offsets `[0, 1]` are projected to maximum translation ranges `[-maxX, maxX]` and `[-maxY, maxY]` depending on boundary dimensions ([useMagneticButton.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/hooks/useMagneticButton.ts)).
- **Center Correction**: Accounts for offset paddings (e.g. piece transparency padding) to keep elements centered during interaction.
- **Spring Back**: Uses GSAP's `elastic.out(1, 0.3)` or `elastic.out(1, 0.4)` to spring elements back to origin `(0, 0)` with a bouncy wobble upon mouse departure.
- **Wiggle Utility**: [useMagneticWiggle.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/hooks/useMagneticWiggle.ts) overlays a constant rotation wiggle (`rotation: 3`, `scale: 1.05`, yoyo) alongside the active cursor magnetic pull.

### 3D Perspective Tilt
Adds an interactive 3D perspective rotation to landing cards (e.g. the board container cards) using [usePerspectiveTilt.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/hooks/usePerspectiveTilt.ts):
- **Desktop Behavior**:
  - Maps cursor offsets inside the element to rotation angles (`rotateX` and `rotateY` up to a specified `maxRotate`).
  - Animates scale up to `scalePeak` and increases drop shadow blur.
  - Shifts drop shadow direction opposite to the tilt direction (using offset multipliers) to heighten the optical illusion of elevation.
  - Updates values with `gsap.quickTo()` to circumvent layout thrashing.
- **Mobile Fallback**: Overrides 3D tracking with a lightweight vertical translation float (`translateY: -floatDistance` yoyo) to preserve battery health.

### CTA Shine Sweep
Elements with the class `.cta-shine` display a diagonal reflection sweep on hover:
- Utilizes a CSS `::before` pseudo-element with a linear gradient angled at `skewX(-25deg)`.
- Keyframe `@keyframes shine-sweep` animates the reflection left-to-right (`left: -150%` to `150%`) in `0.75s` when hovered.

### Underline Grow Effect
The class `.nav-link` creates expanding link underlines:
- Configures a CSS `::after` border line at `width: 0`.
- Transitions to `width: 100%` inside `0.25s` on mouse hover, retracting gracefully when cursor leaves.

---

## 4. GreenSock (GSAP) Animation System

The project relies on GSAP for timeline choreography, layout transitions, and interactive physics.

### Context-Safe Hook (`useGSAP`)
React components register GSAP animations via a custom, client-safe hook [useGSAP.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/hooks/useGSAP.ts):
- Instantiates a scoped `gsap.context()` bounded to a DOM `scopeRef`.
- Guarantees automatic rollback: when a component unmounts, `ctx.revert()` is triggered, killing active tweens, ScrollTriggers, and event listeners. This completely eliminates memory leaks.
- Handles server-side rendering (SSR) safely by falling back from `useLayoutEffect` to `useEffect` when `window` is undefined.

### Centralized Config & Presets
[gsapConfig.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/utils/gsapConfig.ts) acts as a single point of setup:
- Registers ScrollTrigger globally.
- Standardizes Easing Functions:
  - `ease.out`: `'power2.out'` (standard snappy deceleration)
  - `ease.inOut`: `'power2.inOut'` (smooth ease transitions)
  - `ease.spring`: `'back.out(1.4)'` (spring-like overshoot bounce)
  - `ease.smooth`: `'sine.inOut'` (sinusoidal cycles for floats/pulses)
- Controls Duration Scales: exposes the helper `dur(seconds)` which returns `0` if accessibility flags request reduced motion, instantly snapping layouts.

### Page Entrance Sequences
- **Navbar Entrance**: Slides down from `y: -30` and fades to `1` on page load.
- **Navbar Hide/Show**: Hides navbar on scroll-down (`y: -100`, opacity `0`) and displays it on scroll-up (`y: 0`, opacity `1`) after crossing an `80px` height offset ([useNavbarAnimation.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/hooks/useNavbarAnimation.ts)).
- **Hero Staggered Reveal**:
  - Word-level splitting: a custom split text script breaks headline elements into `span` items while keeping parent `aria-label` intact for accessibility.
  - Word spans fade up staggered (`y: 24 -> 0`, opacity `0 -> 1`, stagger `0.08s`).
  - Subtitle spans animate with a gaussian blur clean-up (`filter: blur(4px) -> blur(0px)`).
  - Chessboard column enters from the right with a minor tilt correction (`x: 80 -> 0`, `rotation: -3 -> 0`).

---

## 5. In-Game & Board Animations (Canvas-Based)

To provide an elite gameplay feel, chess piece actions rely on a dedicated anim layer.

### Chess Animation Layer
[ChessAnimationLayer.tsx](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/components/ChessAnimationLayer.tsx) handles motion rendering on top of the chessboard grid.
- **Double-Buffered Canvas**: Overlays an HTML5 `<canvas>` on the grid, scaled dynamically to match the device pixel ratio (`window.devicePixelRatio`) to avoid blurry rendering on Retina displays.
- **Travel Path Easing**: Moves pieces along path vectors over a duration of `350ms` using a quadratic ease-in-out curve.
- **Vector Smear Trails**:
  - Dynamically renders a linear gradient smear trail matching the movement path.
  - Trail thickness adapts to piece profiles: `Queen` and `King` generate thick strokes (`ratio: 0.65`), `Knight`/`Rook` standard strokes (`0.4`), while `Pawn` creates thin trails (`0.3`).
  - Projection equations calculate thickness expansions along diagonal vectors (`Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle))`).
  - Trails dissolve over a `350ms` decay window using linear transparency gradient adjustments.
- **Piece Elevation (Z-Lift)**:
  - While traveling, the moving piece is rendered as a "ghost" element that scales up to `1.1` in the first 15% of travel, maintaining height, and landing back to `1.0` in the last 15%.
  - A dynamic drop-shadow filter (`drop-shadow`) is calculated relative to the scale, shifting blur radius, offsets, and transparency to simulate physical altitude.
- **Capture Dissolves**:
  - Captured pieces trigger an impact dissolve: they fade out from `1` to `0` while scaling up from 100% to 110% over 100ms.

---

## 6. Celebration & Celebration Feedback

### Confetti Cannons
Solved puzzles trigger confetti celebration bursts.
- **Confetti Isolation**: [useConfetti.ts](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/hooks/useConfetti.ts) generates a temporary canvas confined entirely to the Hero region, preventing particle overflows on other viewport elements.
- **Flicker Frame Loop**: Launches confetti particles from coordinate poles `(x: 0)` and `(x: 1)` representing bottom-left and bottom-right edges. The cannon updates through an internal `requestAnimationFrame` cycle.
- **Automatic Garbage Collection**: Cleans up DOM elements by removing the celebration canvas once particles drift out of screen bounds.

### Checkmate Impact Experience
Delivering checkmate initiates a sequenced timeline:
- **Board Flash**: Flashes board elements to maximum brightness (`brightness(3)` to `brightness(1)`) in `0.08s` using a GSAP timeline.
- **King Square Pulse**: Injects the keyframe class `.king-pulse` to flash the checkmated king's square with a deep red shadow.
- **CHECKMATE Banner**: Shows a backdrop-blur overlay panel that pops in elastically (`scale: 0.6 -> 1` with a `back.out(1.7)` curve).
- **Badge Pins**: Places badge pins on the board:
  - Defeat pin (Red circle with King symbol) drops on the losing King's square.
  - Victory pin (Gold crown badge) pins to the winning King's square.
  - Both badges scale up from `scale(0)` to `scale(1)` with spring dynamics.
- **Card Expansion Glow**: Expands a glowing shadow pulse around the card deck (`0 0 80px 24px rgba(99,102,241,0.6)`), fading into a resting glow.

### Move Quality Badges
[MoveAnnotation.tsx](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/components/MoveAnnotation.tsx) displays evaluation badges (e.g. `!!` Brilliant, `??` Blunder):
- Displays absolutely-positioned icons over destination squares using grid percentage offsets (`left: fileIndex * 12.5%`, `top: (7 - rankIndex) * 12.5%`).
- Injects a CSS `@keyframes move-annotation-anim` to animate the badge entrance (pops from scale `0.65` to `1.08`, pauses, and slides up with scale `0.92` while fading).

---

## 7. Ambient Background Systems

### Drifting Background Pieces
[GlobalBackground.tsx](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/components/GlobalBackground.tsx) manages an elegant particle system behind layout elements:
- Spawns 15 randomized chess pieces distributed evenly across screen coordinates.
- Each piece is rendered as a clean vector path SVG, filled with a highly transparent color (`rgba(255,255,255,0.04)`) and highlighted with a thin stroke.
- Keyframe `@keyframes global-fall` floats particles vertically from `-25vh` to `125vh` while introducing rotating drift speeds via CSS variables.
- Uses negative animation delays (`animation-delay: -x`) so pieces are already scattered and floating when the user enters the site (preventing sudden load jumps).

### Ambient Space Orbs
- CSS classes `.hero-orb-a` and `.hero-orb-b` translate blurry radial gradient bubbles inside background layers.
- Continuously yoyos on CSS transforms (`translate` and `scale`) at slow speeds (e.g. `10s` and `13s`) to minimize cpu loads.

---

## 8. Responsive Adjustments & Breakpoints

Animations adapt dynamically based on screen widths:
- **Piece Scaling**: Background SVGs downscale from `115px` to `70px` on screens narrower than `700px` to maintain page readability.
- **Move Quality Badges**: Badge icons resize automatically using flexible absolute position grids, fitting mobile chessboards.
- **Tilt Suppression**: Touch screens disable cursor-based 3D rotations, falling back to simple 2D vertical translations.

---

## 9. Accessibility & Reduced Motion

The application features full support for accessibility settings:
- **CSS Transitions & Keyframes Override**:
  A media query in [index.css](file:///c:/Users/Harsh/Documents/GitHub/Chess-Project/src/index.css#L243-L261) intercepts system-level reduced-motion flags:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- **JS Hook Guards**:
  Imperative triggers (confetti, logo wiggles, scroll reveals, tilt effects) evaluate the helper function `prefersReducedMotion()`. If true, they exit immediately or snap to final states without animation delay.
