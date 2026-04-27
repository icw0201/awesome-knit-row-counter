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

/** island-spice 팔레트 */
const ISLAND_SPICE_PALETTE = {
  '50': '#fefaec',
  '100': '#fbf0ca',
  '200': '#f7e090',
  '300': '#f3cb56',
  '400': '#f0b62f',
  '500': '#e99617',
  '600': '#ce7211',
  '700': '#ab5112',
  '800': '#8b3f15',
  '900': '#733414',
  '950': '#421a06',
};

/** olive 팔레트 */
const OLIVE_PALETTE = {
  '50': '#f5f8ed',
  '100': '#e9f0d7',
  '200': '#d5e3b3',
  '300': '#bad086',
  '400': '#98b755',
  '500': '#81a042',
  '600': '#647f31',
  '700': '#4d6229',
  '800': '#3f4f25',
  '900': '#374423',
  '950': '#1b240f',
};

/** gray 팔레트 */
const GRAY_PALETTE = {
  '50': '#f3f5f7',
  '100': '#eceef1',
  '200': '#dcdee3',
  '300': '#c3c8d0',
  '400': '#8d95a4',
  '500': '#5f6778',
  '600': '#424d5c',
  '700': '#303a4b',
  '800': '#192332',
  '900': '#0d1423',
  '950': '#02050e',
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
  ISLAND_SPICE_PALETTE,
  OLIVE_PALETTE,
  GRAY_PALETTE,
  ELECTRIC_VIOLET_PALETTE,
  EMPHASIS_RED,
  RULE_SWATCH_COLORS,
};
