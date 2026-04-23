const path = require('path');
const { RED_ORANGE_PALETTE, EMPHASIS_RED } = require(path.join(__dirname, 'src/constants/colors'));

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./App.{js,jsx,ts,tsx}",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'red-orange': RED_ORANGE_PALETTE,
          'emphasis-red': EMPHASIS_RED,
          black: '#111111',
          darkgray: '#767676',
          mediumgray: '#B8B8B8',
          lightgray: '#DBDBDB',
        },
      },
    },
    plugins: [],
  }
