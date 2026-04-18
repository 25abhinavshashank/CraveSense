/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#6c63ff',
        danger: '#ff4757',
        success: '#2ed573',
        warning: '#ffa502',
        canvas: '#0a0a0f',
        panel: '#12121a',
        muted: '#8888aa'
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 20px 60px rgba(0, 0, 0, 0.35)'
      }
    }
  },
  plugins: []
};
