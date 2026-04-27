const path = require('path');
const {
  RED_ORANGE_PALETTE,
  SAPPHIRE_PALETTE,
  ISLAND_SPICE_PALETTE,
  OLIVE_PALETTE,
  GRAY_PALETTE,
  ELECTRIC_VIOLET_PALETTE,
  EMPHASIS_RED,
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
    'border-white',
    'border-lightgray',
    {
      pattern: /(bg|text|border)-(red-orange|sapphire|island-spice|electric-violet|olive|gray)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        'red-orange': RED_ORANGE_PALETTE,
        sapphire: SAPPHIRE_PALETTE,
        'island-spice': ISLAND_SPICE_PALETTE,
        'electric-violet': ELECTRIC_VIOLET_PALETTE,
        olive: OLIVE_PALETTE,
        gray: GRAY_PALETTE,
        'emphasis-red': EMPHASIS_RED,
        black: '#111111',
        darkgray: '#767676',
        mediumgray: '#B8B8B8',
        lightgray: '#DBDBDB',
      },
    },
  },
  plugins: [],
};
