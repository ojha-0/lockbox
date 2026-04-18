/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // LockBox brand — Ink scale (primary surface = vault navy)
        ink: {
          50:  '#FAFAFA',  // Paper
          100: '#DAE4F1',  // Ink 200 — secondary text on dark
          200: '#DAE4F1',
          300: '#8996A9',  // captions / meta
          400: '#456882',  // tertiary, links on light
          500: '#234C6A',
          600: '#1B3C53',  // Deep Teal — secondary dark
          700: '#112A40',
          800: '#0A1628',  // Vault Navy — primary surface
          900: '#000C1F',  // deepest
        },
        // Backwards-compat: keep `navy` and `primary` aliases mapped to ink
        navy: {
          50:  '#FAFAFA',
          100: '#DAE4F1',
          200: '#DAE4F1',
          300: '#8996A9',
          400: '#456882',
          500: '#234C6A',
          600: '#1B3C53',
          700: '#112A40',
          800: '#0A1628',
          900: '#0A1628',
          950: '#000C1F',
        },
        primary: {
          50:  '#FAFAFA',
          100: '#DAE4F1',
          200: '#DAE4F1',
          300: '#8996A9',
          400: '#456882',
          500: '#234C6A',
          600: '#1B3C53',
          700: '#112A40',
          800: '#0A1628',
          900: '#000C1F',
        },
        // Status / signal colors (brand spec)
        signal: {
          ok:      '#1C9139',
          pending: '#FFF36E',
          err:     '#FF383C',
        },
        paper: '#FAFAFA',
      },
      fontFamily: {
        // Display / headings — Neue Montreal (Manrope is the loaded fallback)
        display: ['"Neue Montreal"', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Body / UI
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Labels / specs / IDs
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        display:  '-0.02em',
        spec:     '0.12em',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
