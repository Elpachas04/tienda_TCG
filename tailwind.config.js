/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'tcg-bg':      '#121212',
        'tcg-surface': '#1a1a1a',
        'tcg-border':  '#2a2a2a',
        'tcg-gold':    '#C9A84C',
        'tcg-text':    '#f0f0f0',
        'tcg-muted':   '#888888',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body:    ['"Barlow"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  safelist: ['badge-gold', 'badge-teal', 'badge-purple', 'badge-coral'],
  plugins: [],
}

