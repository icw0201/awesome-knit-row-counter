import {
  EMPHASIS_RED,
  LEAF_GREEN_PALETTE,
  RED_ORANGE_PALETTE,
  SKY_BLUE_PALETTE,
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
  representativeColor: string;
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
    gray: {
      '100': string;
    };
  };
}

const createClassPalette = (
  utilityPrefix: 'bg' | 'text' | 'border',
  paletteName: 'red-orange' | 'sky-blue' | 'leaf-green'
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
  paletteName: 'red-orange' | 'sky-blue' | 'leaf-green',
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
    gray: {
      '100': '#F3F4F6',
    },
  },
});

const themePalettes: Record<ColorThemeSetting, ThemePalette> = {
  redOrange: RED_ORANGE_PALETTE as ThemePalette,
  skyBlue: SKY_BLUE_PALETTE as ThemePalette,
  leafGreen: LEAF_GREEN_PALETTE as ThemePalette,
};

const appThemes: Record<ColorThemeSetting, AppTheme> = {
  redOrange: createTheme('redOrange', 'red-orange', themePalettes.redOrange),
  skyBlue: createTheme('skyBlue', 'sky-blue', themePalettes.skyBlue),
  leafGreen: createTheme('leafGreen', 'leaf-green', themePalettes.leafGreen),
};

export const APP_COLOR_THEME_OPTIONS: AppColorThemeOption[] = [
  {
    value: 'redOrange',
    label: '레드 오렌지',
    representativeColor: themePalettes.redOrange['400'],
  },
  {
    value: 'skyBlue',
    label: '스카이 블루',
    representativeColor: themePalettes.skyBlue['400'],
  },
  {
    value: 'leafGreen',
    label: '리프 그린',
    representativeColor: themePalettes.leafGreen['400'],
  },
];

export const getAppTheme = (
  selectedTheme: ColorThemeSetting = getSelectedColorThemeSetting()
): AppTheme => {
  return appThemes[selectedTheme] ?? appThemes.redOrange;
};

// 이후 selectedTheme 저장/구독을 붙일 때 이 단일 export를 교체하는 방식으로 확장한다.
export const appTheme: AppTheme = new Proxy({} as AppTheme, {
  get(_target, property) {
    return getAppTheme()[property as keyof AppTheme];
  },
});
