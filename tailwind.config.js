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
          bg:        '#080B14',   // obsidian
          surface:   '#0C1020',   // obsidian-mid
          accent:    '#D4AF6E',   // gold-bright
          text:      '#F5F0E8',   // ivory
          secondary: '#8E8B82',   // warm muted
          border:    'rgba(212, 175, 110, 0.12)',
        },
        gold: {
          DEFAULT: '#D4AF6E',
          bright:  '#D4AF6E',
          mid:     '#B8934A',
          dim:     '#8B6F3A',
        },
        obsidian: {
          DEFAULT: '#080B14',
          mid:     '#0C1020',
          light:   '#111827',
        },
        ivory: '#F5F0E8',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
