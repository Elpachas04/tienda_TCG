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
        'lv-raised':  '#201e1a',
        'lv-border':  '#2a2a2a',
        'lv-gold':    '#C9A84C',
        'lv-foil':    '#F3DC95',
        'lv-brass':   '#6B5A26',
        'lv-cream':   '#F5F0E8',
        'lv-muted':   '#8F8A80',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', '"Hanken Grotesk Variable"', 'system-ui', 'sans-serif'],
        body:    ['"Hanken Grotesk Variable"', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '14px',
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
