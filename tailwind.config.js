// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#3377d0', 
        'secondary-gold': '#f8cf34',
        'tertiary-white': '#f7ffff',
      },
    },
  },
  plugins: [],
};