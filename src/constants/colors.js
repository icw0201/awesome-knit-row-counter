/**
 * red-orange 팔레트
 * tailwind.config.js에서 사용하는 테마 색상
 */

const RED_ORANGE_PALETTE = {
  '50': '#fff1f1',
  '100': '#ffe1e0',
  '200': '#ffc7c6',
  '300': '#ffa09e',
  '400': '#ff6b67',
  '500': '#fc3e39',
  '600': '#ea1d18',
  '700': '#c51510',
  '800': '#a31511',
  '900': '#861916',
  '950': '#490806',
};

/** sapphire 팔레트 */
const SAPPHIRE_PALETTE = {
  '50': '#f3f6fb',
  '100': '#e3eaf6',
  '200': '#cedaef',
  '300': '#acc2e4',
  '400': '#85a2d5',
  '500': '#6885c9',
  '600': '#546cbc',
  '700': '#4859a7',
  '800': '#414c8c',
  '900': '#384270',
  '950': '#262b45',
};

/** aquamarine 팔레트 */
const AQUAMARINE_PALETTE = {
  '50': '#e8fff5',
  '100': '#c8ffe4',
  '200': '#97ffd1',
  '300': '#54ffbf',
  '400': '#2ef6b1',
  '500': '#00dd98',
  '600': '#00b580',
  '700': '#00916b',
  '800': '#007254',
  '900': '#005d46',
  '950': '#003529',
};

/** viridian-green 팔레트 */
const VIRIDIAN_GREEN_PALETTE = {
  '50': '#f5f8f7',
  '100': '#dee9e4',
  '200': '#bdd2c9',
  '300': '#94b4a8',
  '400': '#6d9487',
  '500': '#5d887a',
  '600': '#416057',
  '700': '#364f48',
  '800': '#2f403b',
  '900': '#2a3733',
  '950': '#141f1c',
};

/** gray 팔레트 */
const GRAY_PALETTE = {
  '50': '#f9fafb',
  '100': '#f3f4f6',
  '200': '#e5e7eb',
  '300': '#d1d5dc',
  '400': '#99a1af',
  '500': '#6a7282',
  '600': '#4a5565',
  '700': '#364153',
  '800': '#1e2939',
  '900': '#101828',
  '950': '#030712',
};

/** electric-violet 팔레트 */
const ELECTRIC_VIOLET_PALETTE = {
  '50': '#faf5ff',
  '100': '#f2e9fe',
  '200': '#e8d6fe',
  '300': '#d6b6fc',
  '400': '#bd87f9',
  '500': '#a459f3',
  '600': '#8c34e5',
  '700': '#7926ca',
  '800': '#6724a5',
  '900': '#551f84',
  '950': '#380962',
};

/** 테마와 무관하게 경고/강조 의미를 유지하는 고정 red */
const EMPHASIS_RED = '#dc2626';

/** 규칙 카드와 ColorPicker 스와치 전용 색상 */
const RULE_SWATCH_COLORS = [
  '#EF5777',
  '#574559',
  '#04BFAD',
  '#F2A922',
  '#D9B391',
  '#A9CBD9',
  '#D4E157',
  '#DAC6E8',
  '#FFA685',
  '#BF2424',
];

module.exports = {
  RED_ORANGE_PALETTE,
  SAPPHIRE_PALETTE,
  AQUAMARINE_PALETTE,
  VIRIDIAN_GREEN_PALETTE,
  GRAY_PALETTE,
  ELECTRIC_VIOLET_PALETTE,
  EMPHASIS_RED,
  RULE_SWATCH_COLORS,
};
