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
  safelist: [
    'badge-gold', 'badge-teal', 'badge-purple', 'badge-coral',
    'bg-tcg-gold/10', 'bg-tcg-gold/5',
    'border-tcg-gold/30', 'border-tcg-gold/40', 'border-tcg-gold/50',
    'text-tcg-gold/70', 'text-tcg-muted/40', 'text-tcg-muted/50', 'text-tcg-muted/60',
    'border-white/20', 'border-white/25', 'border-dashed',
    'hover:border-tcg-gold/50', 'hover:border-tcg-gold/40',
    'animate-dropdown-in', 'animate-fade-up', 'animate-toast-in', 'animate-badge-pop',
    'rotate-180',
  ],
  plugins: [],
}

