/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#080B14',           // Obsidian — deepest background
          surface: '#0C1020',      // Mid-depth surface
          accent: '#6366F1',       // Indigo (secondary accent, kept for chess pieces)
          text: '#F5F0E8',         // Warm ivory
          secondary: '#8E8B82',    // Warm muted
          border: 'rgba(212, 175, 110, 0.1)',  // Gold hairline
        },
        gold: {
          DEFAULT: '#D4AF6E',
          bright: '#E8C88A',
          mid: '#B8934A',
          dim: '#8B6F3A',
          whisper: 'rgba(212, 175, 110, 0.08)',
        },
        obsidian: {
          DEFAULT: '#080B14',
          mid: '#0C1020',
          light: '#111827',
        },
        ivory: {
          DEFAULT: '#F5F0E8',
          muted: '#8E8B82',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'Courier New', 'monospace'],
      },
      letterSpacing: {
        'luxury':    '0.08em',
        'editorial': '-0.02em',
        'notation':  '0.15em',
      },
      transitionTimingFunction: {
        'luxury':    'cubic-bezier(0.16, 1, 0.3, 1)',
        'cinematic': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'precise':   'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'gold': '0 0 40px rgba(212, 175, 110, 0.12), 0 4px 24px rgba(0,0,0,0.6)',
        'gold-sm': '0 0 20px rgba(212, 175, 110, 0.15)',
        'deep': '0 32px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)',
        'card': '0 2px 1px rgba(255,255,255,0.03) inset, 0 24px 60px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
}
