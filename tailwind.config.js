/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#8A2BE2', // Purple color for main elements
        'primary-light': '#9d50bb',
        secondary: '#f8a100', // Orange color for progress elements
        'secondary-light': '#ffb732',
        'protein-bg': '#ffe6d5',
        'protein-text': '#d46b08',
        'fats-bg': '#ffb699',
        'fats-text': '#b94700',
        'carbs-bg': '#ffd699',
        'carbs-text': '#b97a00',
      },
    },
  },
  plugins: [],
};