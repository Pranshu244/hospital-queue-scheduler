/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#f0f7fa',
          100: '#e1f0f5',
          500: '#0284c7', // sky blue
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0f172a', // deep navy
        },
        teal: {
          50: '#f0fdfa',
          600: '#0d9488',
          700: '#0f766e',
        }
      },
      keyframes: {
        highlightFlash: {
          '0%': { backgroundColor: '#fef08a' }, // yellow-200
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'row-highlight': 'highlightFlash 2.5s ease-out',
      },
    },
  },
  plugins: [],
};
