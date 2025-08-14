/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      fontSize: {
        // 响应式字体大小
        'xs-responsive': ['0.75rem', { lineHeight: '1rem' }],
        'sm-responsive': ['0.875rem', { lineHeight: '1.25rem' }],
        'base-responsive': ['1rem', { lineHeight: '1.5rem' }],
        'lg-responsive': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl-responsive': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl-responsive': ['1.5rem', { lineHeight: '2rem' }],
        '3xl-responsive': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl-responsive': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '15': '3.75rem',
        '18': '4.5rem',
        // 响应式间距
        'xs-gap': '0.25rem',
        'sm-gap': '0.5rem',
        'md-gap': '1rem',
        'lg-gap': '1.5rem',
        'xl-gap': '2rem',
        // 安全区域
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // 自定义断点
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1023px' },
        'desktop': { 'min': '1024px' },
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'mouse': { 'raw': '(hover: hover) and (pointer: fine)' },
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}
