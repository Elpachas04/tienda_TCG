// Archivo aparte (no inline) para que lo permita la CSP de netlify.toml (script-src 'self')
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('motion');
