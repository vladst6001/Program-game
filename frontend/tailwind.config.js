/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#39ff14',
          blue: '#00f0ff',
          purple: '#bf00ff',
          pink: '#ff00ff',
        },
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a25',
          600: '#252532',
          500: '#353548',
        },
      },
      boxShadow: {
        'neon-green': '0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 20px #39ff14',
        'neon-blue': '0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff',
        'neon-sm-green': '0 0 5px #39ff14',
        'neon-sm-blue': '0 0 5px #00f0ff',
      },
    },
  },
  plugins: [],
};
