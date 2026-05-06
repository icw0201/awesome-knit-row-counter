const path = require('path');
const {
  RED_ORANGE_PALETTE,
  ANY_BLUE_PALETTE,
  HONEY_BANANA_PALETTE,
  OLIVE_PALETTE,
  GRAY_PALETTE,
  LAVENDER_PALETTE,
  EMPHASIS_RED,
  PREMIUM_GOLD,
} = require(path.join(__dirname, 'src/constants/colors'));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    'bg-white',
    'bg-lightgray',
    'bg-transparent',
    'text-white',
    'text-black',
    'text-darkgray',
    'text-mediumgray',
    'text-emphasis-red',
    'text-premium-gold',
    'bg-premium-gold',
    'border-premium-gold',
    'border-white',
    'border-lightgray',
    {
      pattern: /(bg|text|border)-(red-orange|any-blue|honey-banana|lavender|olive|gray)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        'red-orange': RED_ORANGE_PALETTE,
        'any-blue': ANY_BLUE_PALETTE,
        'honey-banana': HONEY_BANANA_PALETTE,
        lavender: LAVENDER_PALETTE,
        olive: OLIVE_PALETTE,
        gray: GRAY_PALETTE,
        'emphasis-red': EMPHASIS_RED,
        'premium-gold': PREMIUM_GOLD,
        black: '#111111',
        darkgray: '#767676',
        mediumgray: '#B8B8B8',
        lightgray: '#DBDBDB',
      },
    },
  },
  plugins: [],
};
