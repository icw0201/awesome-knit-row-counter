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

/** sky-blue 팔레트 */
const SKY_BLUE_PALETTE = {
  '50': '#f0f9ff',
  '100': '#e0f2fe',
  '200': '#bae6fd',
  '300': '#7dd3fc',
  '400': '#38bdf8',
  '500': '#0ea5e9',
  '600': '#0284c7',
  '700': '#0369a1',
  '800': '#075985',
  '900': '#0c4a6e',
  '950': '#082f49',
};

/** leaf-green 팔레트 */
const LEAF_GREEN_PALETTE = {
  '50': '#ecfdf5',
  '100': '#d1fae5',
  '200': '#a7f3d0',
  '300': '#6ee7b7',
  '400': '#34d399',
  '500': '#10b981',
  '600': '#059669',
  '700': '#047857',
  '800': '#065f46',
  '900': '#064e3b',
  '950': '#022c22',
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
  SKY_BLUE_PALETTE,
  LEAF_GREEN_PALETTE,
  EMPHASIS_RED,
  RULE_SWATCH_COLORS,
};
