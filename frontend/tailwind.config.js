/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dezerv luxury dark palette
        'dz-black':  '#000000',
        'dz-dark':   '#09090b',
        'dz-card':   '#121216',
        'dz-card2':  '#18181c',
        'dz-border': '#27272a',
        'dz-border2':'#3f3f46',
        'dz-muted':  '#a1a1aa',
        'dz-subtle': '#d4d4d8',
        'dz-cyan':   '#22d3ee',
        'dz-cyan2':  '#06b6d4',
        'dz-green':  '#22c55e',
        'dz-green2': '#4ade80',
        'dz-amber':  '#f97316',
        'dz-bench':  '#52525b',
        'dz-white':  '#ffffff',
        brand: {
          50:  '#ecfeff',
          100: '#cffafe',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          900: '#164e63',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        rose: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'pill': '9999px',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'cyan-glow': '0 0 24px -4px rgba(34,211,238,0.35)',
        'green-glow': '0 0 24px -4px rgba(34,197,94,0.35)',
        'card':       '0 1px 3px rgba(0,0,0,0.8), 0 8px 24px -12px rgba(0,0,0,0.9)',
      },
      animation: {
        'pulse-slow': 'pulseGlow 3s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
