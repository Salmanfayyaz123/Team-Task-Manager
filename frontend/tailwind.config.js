/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          500: '#4361ee',
          600: '#3a0ca3',
          700: '#2d0085',
        },
        surface: {
          0: '#ffffff',
          50: '#f8f9fd',
          100: '#f0f2fa',
          200: '#e4e7f2',
          800: '#1a1d2e',
          900: '#0f1117',
        },
      },
    },
  },
  plugins: [],
};
