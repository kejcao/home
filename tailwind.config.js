/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['**/*.html', '**/*.md'],
  theme: {
    extend: {},
    fontFamily: {
      'serif': ["'Iowan Old Style'", "'Palatino Linotype'", "'URW Palladio L'", "P052", "serif"],
      'mono': ["ui-monospace", "'Cascadia Code'", "'Source Code Pro'", "Menlo", "Consolas", "'DejaVu Sans Mono'", "monospace"],
    }
  },
  plugins: [],
}

