/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: 'var(--c-app)',
        surface: 'var(--c-surface)',
        ink: 'var(--c-ink)',
        muted: 'var(--c-muted)',
        line: 'var(--c-line)',
        hover: 'var(--c-hover)',
        field: 'var(--c-field)',
        accent: 'var(--c-accent)',
        lumina: { blue: '#8ab4f8', purple: '#c58af9' },
      },
      fontFamily: {
        sans: [
          '"Google Sans"',
          '"Google Sans Text"',
          '"Product Sans"',
          '"Albert Sans"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"Google Sans Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        pill: '0 1px 3px rgba(60,64,67,.16), 0 4px 14px rgba(60,64,67,.10)',
        sheet: '0 8px 30px rgba(0,0,0,.18)',
      },
      backgroundImage: {
        'lumina-gradient': 'linear-gradient(90deg,#8ab4f8,#c58af9)',
        'lumina-gradient-diag': 'linear-gradient(135deg,#8ab4f8,#c58af9)',
      },
    },
  },
  plugins: [],
};
