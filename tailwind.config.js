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
          bg: '#04060d',         // Deepest navy-black
          surface: '#0b0e1a',    // Graphite navy card surface
          accent: '#4f46e5',     // Subtle indigo accent
          text: '#f8fafc',       // Soft ivory text
          secondary: '#8e9bb0',  // Muted platinum text
          border: 'rgba(255, 255, 255, 0.06)', // Ultra-thin border
        }
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

