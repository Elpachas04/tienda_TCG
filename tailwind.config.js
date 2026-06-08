/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'lv-black':   '#121212',
        'lv-void':    '#0B0B0F',
        'lv-deep':    '#0e0e0e',
        'lv-surface': '#1a1a1a',
        'lv-border':  '#2a2a2a',
        'lv-gold':    '#C9A84C',
        'lv-cream':   '#F5F0E8',
        'lv-muted':   '#888888',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body:    ['"Barlow"', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
      zIndex: {
        '60': '60',
      },
    },
  },
  safelist: [
    'z-60',
    'border-white/20', 'border-white/25', 'border-dashed',
    'animate-dropdown-in', 'animate-fade-up', 'animate-toast-in', 'animate-badge-pop',
    'rotate-180',
    'translate-x-full', 'translate-x-0', 'pointer-events-none', 'pointer-events-auto',
  ],
  plugins: [],
}

