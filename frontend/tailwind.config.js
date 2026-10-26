/** @type {import('tailwindcss').Config} */
// Colours are CSS variables (see src/index.css).
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  // Light only: `class` keeps dark: variants from switching on with the OS setting.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        sunken: token('sunken'),
        line: token('line'),
        ink: {
          DEFAULT: token('ink'),
          2: token('ink-2'),
          3: token('ink-3'),
        },
        accent: {
          DEFAULT: token('accent'),
          soft: token('accent-soft'),
          ink: token('accent-ink'),
          on: token('on-accent'),
        },
        danger: {
          DEFAULT: token('danger'),
          soft: token('danger-soft'),
        },
        warn: token('warn'),
        hero: token('hero'),
      },
      borderRadius: {
        control: '10px',
        panel: '16px',
      },
    },
  },
  plugins: [],
};
