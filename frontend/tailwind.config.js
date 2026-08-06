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
        'dz-card':   '#121215',
        'dz-card2':  '#17171c',
        'dz-border': '#27272a',
        'dz-border2':'#3f3f46',
        'dz-muted':  '#71717a',
        'dz-subtle': '#a1a1aa',
        'dz-green':  '#769356',
        'dz-green2': '#82a057',
        'dz-lime':   '#22c55e',
        'dz-amber':  '#e28761',
        'dz-amber2': '#f97316',
        'dz-bench':  '#52525b',
        'dz-white':  '#ffffff',
        // Keep brand for minimal backward compat (maps to dz-amber)
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#e28761',
          700: '#c2410c',
          900: '#7c2d12',
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'pill': '9999px',
      },
      boxShadow: {
        'amber-glow': '0 0 24px -4px rgba(226,135,97,0.35)',
        'green-glow':  '0 0 24px -4px rgba(118,147,86,0.35)',
        'card':        '0 1px 3px rgba(0,0,0,0.6), 0 8px 24px -12px rgba(0,0,0,0.8)',
      },
      animation: {
        'pulse-slow': 'pulseGlow 3s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
