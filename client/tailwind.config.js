/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef0fb',
          100: '#d4d8f5',
          200: '#aab1ec',
          300: '#8089e2',
          400: '#6b74db',
          500: '#5C6BC0',
          600: '#4a57ad',
          700: '#3b4699',
          800: '#2d3685',
          900: '#1e2571',
        },
        accent: {
          50: '#e0f5f3',
          100: '#b3e6e2',
          200: '#80d5cf',
          300: '#4dc4bc',
          400: '#26A69A',
          500: '#00897B',
          600: '#00796B',
          700: '#00695C',
          800: '#005A4E',
          900: '#004B42',
        },
        dark: {
          900: '#0f1117',
          800: '#161b27',
          700: '#1e2535',
          600: '#252e40',
          500: '#2d3748',
        },
      },
      fontFamily: {
        heading: ['"Nunito"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        card: '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideInRight: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
