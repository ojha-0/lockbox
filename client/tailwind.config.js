/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f5f5',
          100: '#e9e9e9',
          200: '#d4d4d4',
          300: '#b0b0b0',
          400: '#808080',
          500: '#555555',
          600: '#1a1a1a',
          700: '#111111',
          800: '#0a0a0a',
          900: '#000000',
        },
        navy: {
          50:  '#e8edf5',
          100: '#c5d0e0',
          200: '#9fb0c8',
          300: '#6e8aab',
          400: '#4a6a90',
          500: '#2a4d75',
          600: '#1a3558',
          700: '#112440',
          800: '#0e1e35',
          900: '#0a1628',
          950: '#070f1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
