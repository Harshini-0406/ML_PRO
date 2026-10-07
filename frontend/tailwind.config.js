/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#07111f',
        panel: '#0f172a',
        panelSoft: '#111827',
        brand: '#7c3aed',
        cyan: '#22d3ee',
        emerald: '#34d399',
        amber: '#fbbf24',
        rose: '#fb7185',
        text: '#e2e8f0',
        muted: '#94a3b8',
      },
      boxShadow: {
        glow: '0 0 30px rgba(124, 58, 237, 0.25)',
        panel: '0 18px 50px rgba(15, 23, 42, 0.35)',
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.16) 0, rgba(15, 23, 42, 0) 55%)',
      },
    },
  },
  plugins: [],
}

