/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      colors: {
        'neon-cyan': '#00F5FF',
        'neon-pink': '#FF007A',
        'neon-yellow': '#FFD600',
        'neon-green': '#00FF85',
        'bg-dark': '#02040A',
        'bg-dark-2': '#050816',
        'text-primary': '#F5F5F5',
        'text-muted': '#9FA6B2',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #02040A 0%, #050816 100%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00F5FF, 0 0 20px #00F5FF, 0 0 30px #00F5FF',
        'neon-pink': '0 0 10px #FF007A, 0 0 20px #FF007A, 0 0 30px #FF007A',
        'neon-yellow': '0 0 10px #FFD600, 0 0 20px #FFD600, 0 0 30px #FFD600',
        'neon-green': '0 0 10px #00FF85, 0 0 20px #00FF85, 0 0 30px #00FF85',
        'neon-gold': '0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700',
        'neon-red': '0 0 10px #FF0000, 0 0 20px #FF0000, 0 0 30px #FF0000',
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'rainbow-flash': 'rainbow-flash 0.5s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        flip: {
          '0%, 100%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(180deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
        'rainbow-flash': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor' },
        },
      },
    },
  },
  plugins: [],
}
