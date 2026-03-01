import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VortexFi Brand Colors
        primary: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c2d6ff',
          300: '#94b8ff',
          400: '#608fff',
          500: '#3b63ff',
          600: '#2541f5',
          700: '#1d32e1',
          800: '#1e2ab6',
          900: '#1e298f',
          950: '#161957',
        },
        accent: {
          50: '#f4f0ff',
          100: '#ebe3ff',
          200: '#d9ccff',
          300: '#bea5ff',
          400: '#9f6fff',
          500: '#8b3dff',
          600: '#7c1af7',
          700: '#6c0fe3',
          800: '#5a0fbf',
          900: '#4a109c',
          950: '#2d0869',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          400: '#facc15',
          500: '#eab308',
        },
        dark: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b9c1',
          400: '#91929f',
          500: '#737484',
          600: '#5d5e6c',
          700: '#4c4d58',
          800: '#41424b',
          900: '#393941',
          950: '#18181b',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 61, 255, 0.3), transparent)',
        'card-glow': 'radial-gradient(ellipse at center, rgba(139, 61, 255, 0.15), transparent 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'gradient': 'gradient 8s linear infinite',
        'beam': 'beam 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(139, 61, 255, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(139, 61, 255, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        beam: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      boxShadow: {
        'glow': '0 0 40px rgba(139, 61, 255, 0.3)',
        'glow-lg': '0 0 60px rgba(139, 61, 255, 0.4)',
        'inner-glow': 'inset 0 0 30px rgba(139, 61, 255, 0.2)',
      },
    },
  },
  plugins: [],
}

export default config
