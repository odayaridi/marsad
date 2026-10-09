/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef3fa', 100: '#d8e3f2', 200: '#b0c6e4', 300: '#7f9fcc', 400: '#4d74ae', 500: '#2a5591', 600: '#1c4278', 700: '#143362', 800: '#0e2a52', 900: '#0b2244', 950: '#071631' },
        brand: { 50: '#ecf4fc', 100: '#d3e5f7', 200: '#a7cbef', 300: '#74abe3', 400: '#428bd3', 500: '#1f6fbe', 600: '#175aa0', 700: '#134a83', 800: '#113d6b', 900: '#0f3359' },
        teal: { 50: '#eafaf7', 100: '#c9f1ea', 200: '#97e3d6', 300: '#5ecfbd', 400: '#2fb7a4', 500: '#179c8b', 600: '#107d71', 700: '#10645c', 800: '#11504a', 900: '#11433e' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        pop: '0 12px 32px -8px rgba(11,34,68,.22), 0 4px 10px -4px rgba(11,34,68,.10)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        fadeIn: 'fadeIn .18s ease-out',
        slideUp: 'slideUp .22s ease-out',
        slideIn: 'slideIn .25s ease-out',
        shimmer: 'shimmer 1.3s linear infinite',
      },
    },
  },
  plugins: [],
};
