import {
  ANY_BLUE_PALETTE,
  EMPHASIS_RED,
  GRAY_PALETTE,
  HONEY_BANANA_PALETTE,
  LAVENDER_PALETTE,
  OLIVE_PALETTE,
  RED_ORANGE_PALETTE,
} from '@constants/colors';
import {
  getSelectedColorThemeSetting,
  type ColorThemeSetting,
} from '@storage/settings';

type ThemePaletteShade =
  | '50'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | '950';

export type ThemePalette = Record<ThemePaletteShade, string>;

type ThemeClassPalette = Record<ThemePaletteShade, string>;

export interface AppColorThemeOption {
  value: ColorThemeSetting;
  label: string;
  primary200: string;
  primary400: string;
}

export interface AppTheme {
  id: ColorThemeSetting;
  tw: {
    bg: {
      white: string;
      lightgray: string;
      transparent: string;
      primary: ThemeClassPalette;
    };
    text: {
      white: string;
      black: string;
      darkgray: string;
      mediumgray: string;
      emphasisRed: string;
      primary: ThemeClassPalette;
    };
    border: {
      white: string;
      lightgray: string;
      primary: ThemeClassPalette;
    };
  };
  colors: {
    white: string;
    black: string;
    darkgray: string;
    mediumgray: string;
    emphasisRed: string;
    lightgray: string;
    transparent: string;
    shadow: string;
    primary: ThemePalette;
    neutral: {
      '100': string;
    };
  };
}

const createClassPalette = (
  utilityPrefix: 'bg' | 'text' | 'border',
  paletteName: 'red-orange' | 'any-blue' | 'honey-banana' | 'lavender' | 'olive' | 'gray'
): ThemeClassPalette => ({
  '50': `${utilityPrefix}-${paletteName}-50`,
  '100': `${utilityPrefix}-${paletteName}-100`,
  '200': `${utilityPrefix}-${paletteName}-200`,
  '300': `${utilityPrefix}-${paletteName}-300`,
  '400': `${utilityPrefix}-${paletteName}-400`,
  '500': `${utilityPrefix}-${paletteName}-500`,
  '600': `${utilityPrefix}-${paletteName}-600`,
  '700': `${utilityPrefix}-${paletteName}-700`,
  '800': `${utilityPrefix}-${paletteName}-800`,
  '900': `${utilityPrefix}-${paletteName}-900`,
  '950': `${utilityPrefix}-${paletteName}-950`,
});

const createTheme = (
  id: ColorThemeSetting,
  paletteName: 'red-orange' | 'any-blue' | 'honey-banana' | 'lavender' | 'olive' | 'gray',
  primaryPalette: ThemePalette
): AppTheme => ({
  id,
  tw: {
    bg: {
      white: 'bg-white',
      lightgray: 'bg-lightgray',
      transparent: 'bg-transparent',
      primary: createClassPalette('bg', paletteName),
    },
    text: {
      white: 'text-white',
      black: 'text-black',
      darkgray: 'text-darkgray',
      mediumgray: 'text-mediumgray',
      emphasisRed: 'text-emphasis-red',
      primary: createClassPalette('text', paletteName),
    },
    border: {
      white: 'border-white',
      lightgray: 'border-lightgray',
      primary: createClassPalette('border', paletteName),
    },
  },
  colors: {
    white: '#ffffff',
    black: '#111111',
    darkgray: '#767676',
    mediumgray: '#B8B8B8',
    emphasisRed: EMPHASIS_RED,
    lightgray: '#DBDBDB',
    transparent: 'transparent',
    shadow: '#000000',
    primary: primaryPalette,
    neutral: {
      '100': '#F3F4F6',
    },
  },
});

const themePalettes: Record<ColorThemeSetting, ThemePalette> = {
  awesomeRed: RED_ORANGE_PALETTE as ThemePalette,
  anyBlue: ANY_BLUE_PALETTE as ThemePalette,
  honeyBanana: HONEY_BANANA_PALETTE as ThemePalette,
  lavender: LAVENDER_PALETTE as ThemePalette,
  olive: OLIVE_PALETTE as ThemePalette,
  gray: GRAY_PALETTE as ThemePalette,
};

const appThemes: Record<ColorThemeSetting, AppTheme> = {
  awesomeRed: createTheme('awesomeRed', 'red-orange', themePalettes.awesomeRed),
  anyBlue: createTheme('anyBlue', 'any-blue', themePalettes.anyBlue),
  honeyBanana: createTheme('honeyBanana', 'honey-banana', themePalettes.honeyBanana),
  lavender: createTheme('lavender', 'lavender', themePalettes.lavender),
  olive: createTheme('olive', 'olive', themePalettes.olive),
  gray: createTheme('gray', 'gray', themePalettes.gray),
};

export const APP_COLOR_THEME_OPTIONS: AppColorThemeOption[] = [
  {
    value: 'awesomeRed',
    label: '어쩜레드',
    primary200: themePalettes.awesomeRed['200'],
    primary400: themePalettes.awesomeRed['400'],
  },
  {
    value: 'anyBlue',
    label: '애니블루',
    primary200: themePalettes.anyBlue['200'],
    primary400: themePalettes.anyBlue['400'],
  },
  {
    value: 'lavender',
    label: '라벤더',
    primary200: themePalettes.lavender['200'],
    primary400: themePalettes.lavender['400'],
  },
  {
    value: 'honeyBanana',
    label: '바나나',
    primary200: themePalettes.honeyBanana['200'],
    primary400: themePalettes.honeyBanana['400'],
  },
  {
    value: 'olive',
    label: '올리브',
    primary200: themePalettes.olive['200'],
    primary400: themePalettes.olive['400'],
  },
  {
    value: 'gray',
    label: '그레이',
    primary200: themePalettes.gray['200'],
    primary400: themePalettes.gray['400'],
  },
];

export const getAppTheme = (
  selectedTheme: ColorThemeSetting = getSelectedColorThemeSetting()
): AppTheme => {
  return appThemes[selectedTheme] ?? appThemes.awesomeRed;
};

// 이후 selectedTheme 저장/구독을 붙일 때 이 단일 export를 교체하는 방식으로 확장한다.
export const appTheme: AppTheme = new Proxy({} as AppTheme, {
  get(_target, property) {
    return getAppTheme()[property as keyof AppTheme];
  },
});
