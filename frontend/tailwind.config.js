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
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Primary Neon Colors
        'neon': {
          'cyan': '#00F5FF',
          'pink': '#FF007A',
          'yellow': '#FFD600',
          'green': '#00FF85',
          'gold': '#FFD700',
          'red': '#FF3B3B',
          'purple': '#B026FF',
          'orange': '#FF6B35',
        },
        // Background Colors
        'bg': {
          'dark': '#02040A',
          'dark-2': '#050816',
          'dark-3': '#0A0F1E',
          'dark-4': '#0F1626',
          'card': 'rgba(5, 8, 22, 0.8)',
          'card-hover': 'rgba(5, 8, 22, 0.95)',
        },
        // Text Colors
        'text': {
          'primary': '#F5F5F5',
          'secondary': '#E0E0E0',
          'muted': '#9FA6B2',
          'disabled': '#6B7280',
        },
        // Semantic Colors
        'success': '#00FF85',
        'warning': '#FFD600',
        'error': '#FF3B3B',
        'info': '#00F5FF',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #02040A 0%, #050816 100%)',
        'gradient-dark-radial': 'radial-gradient(circle at center, #050816 0%, #02040A 100%)',
        'gradient-neon-cyan': 'linear-gradient(135deg, rgba(0, 245, 255, 0.1) 0%, rgba(0, 245, 255, 0.05) 100%)',
        'gradient-neon-pink': 'linear-gradient(135deg, rgba(255, 0, 122, 0.1) 0%, rgba(255, 0, 122, 0.05) 100%)',
        'gradient-neon-yellow': 'linear-gradient(135deg, rgba(255, 214, 0, 0.1) 0%, rgba(255, 214, 0, 0.05) 100%)',
        'gradient-rainbow': 'linear-gradient(135deg, #FF007A 0%, #00F5FF 25%, #FFD600 50%, #00FF85 75%, #FF007A 100%)',
        'gradient-crown': 'linear-gradient(135deg, #FFD600 0%, #FFA500 100%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 245, 255, 0.5), 0 0 20px rgba(0, 245, 255, 0.3), 0 0 30px rgba(0, 245, 255, 0.2)',
        'neon-pink': '0 0 10px rgba(255, 0, 122, 0.5), 0 0 20px rgba(255, 0, 122, 0.3), 0 0 30px rgba(255, 0, 122, 0.2)',
        'neon-yellow': '0 0 10px rgba(255, 214, 0, 0.5), 0 0 20px rgba(255, 214, 0, 0.3), 0 0 30px rgba(255, 214, 0, 0.2)',
        'neon-green': '0 0 10px rgba(0, 255, 133, 0.5), 0 0 20px rgba(0, 255, 133, 0.3), 0 0 30px rgba(0, 255, 133, 0.2)',
        'neon-gold': '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.2)',
        'neon-red': '0 0 10px rgba(255, 59, 59, 0.5), 0 0 20px rgba(255, 59, 59, 0.3), 0 0 30px rgba(255, 59, 59, 0.2)',
        'glow-cyan': '0 0 20px rgba(0, 245, 255, 0.4), 0 0 40px rgba(0, 245, 255, 0.2)',
        'glow-pink': '0 0 20px rgba(255, 0, 122, 0.4), 0 0 40px rgba(255, 0, 122, 0.2)',
        'glow-yellow': '0 0 20px rgba(255, 214, 0, 0.4), 0 0 40px rgba(255, 214, 0, 0.2)',
        'glow-green': '0 0 20px rgba(0, 255, 133, 0.4), 0 0 40px rgba(0, 255, 133, 0.2)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 245, 255, 0.1)',
        'card-hover': '0 8px 16px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 245, 255, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(0, 245, 255, 0.1)',
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'rainbow-flash': 'rainbow-flash 0.5s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'fadeInUp': 'fadeInUp 0.5s ease-out',
        'fadeInDown': 'fadeInDown 0.5s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'slideDown': 'slideDown 0.4s ease-out',
        'slideLeft': 'slideLeft 0.4s ease-out',
        'slideRight': 'slideRight 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'crown-float': 'crownFloat 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
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
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        },
        crownFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-4px) rotate(-2deg)' },
          '75%': { transform: 'translateY(-4px) rotate(2deg)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
