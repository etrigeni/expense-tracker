/** @type {import('tailwindcss').Config} */
const nudeScale = {
  50: '#f8f2f0',
  100: '#f2e6e3',
  200: '#e8d5d0',
  300: '#dcc0b8',
  400: '#cfa79d',
  500: '#be8f84',
  600: '#ab776d',
  700: '#916057',
  800: '#744b45',
  900: '#5a3a36',
};

const aquaScale = {
  50: '#eef8f6',
  100: '#d7efe9',
  200: '#b8e1d9',
  300: '#93cec4',
  400: '#6fb9af',
  500: '#4da49a',
  600: '#3a8b81',
  700: '#2f7068',
  800: '#265a54',
  900: '#1f4641',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: aquaScale,
        teal: aquaScale,
        cyan: aquaScale,
        blue: aquaScale,
        emerald: aquaScale,
        purple: nudeScale,
        pink: nudeScale,
        orange: nudeScale,
        yellow: nudeScale,
        gray: nudeScale,
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(120deg, #93cec4, #4da49a)',
        'gradient-accent': 'linear-gradient(120deg, #f2e6e3, #dcc0b8)',
      },
    },
  },
  plugins: [],
}
