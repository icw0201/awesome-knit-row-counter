import { RED_ORANGE_PALETTE } from '@constants/colors';

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

type ThemePalette = Record<ThemePaletteShade, string>;

export interface AppTheme {
  id: 'default';
  tw: {
    bg: {
      white: string;
      lightgray: string;
      transparent: string;
      primary: ThemePalette;
    };
    text: {
      white: string;
      black: string;
      darkgray: string;
      mediumgray: string;
      primary: ThemePalette;
    };
    border: {
      white: string;
      lightgray: string;
      primary: ThemePalette;
    };
  };
  colors: {
    white: string;
    black: string;
    darkgray: string;
    mediumgray: string;
    lightgray: string;
    transparent: string;
    shadow: string;
    primary: ThemePalette;
    gray: {
      '100': string;
    };
  };
}

const primaryPalette = RED_ORANGE_PALETTE as ThemePalette;

export const defaultTheme: AppTheme = {
  id: 'default',
  tw: {
    bg: {
      white: 'bg-white',
      lightgray: 'bg-lightgray',
      transparent: 'bg-transparent',
      primary: {
        '50': 'bg-red-orange-50',
        '100': 'bg-red-orange-100',
        '200': 'bg-red-orange-200',
        '300': 'bg-red-orange-300',
        '400': 'bg-red-orange-400',
        '500': 'bg-red-orange-500',
        '600': 'bg-red-orange-600',
        '700': 'bg-red-orange-700',
        '800': 'bg-red-orange-800',
        '900': 'bg-red-orange-900',
        '950': 'bg-red-orange-950',
      },
    },
    text: {
      white: 'text-white',
      black: 'text-black',
      darkgray: 'text-darkgray',
      mediumgray: 'text-mediumgray',
      primary: {
        '50': 'text-red-orange-50',
        '100': 'text-red-orange-100',
        '200': 'text-red-orange-200',
        '300': 'text-red-orange-300',
        '400': 'text-red-orange-400',
        '500': 'text-red-orange-500',
        '600': 'text-red-orange-600',
        '700': 'text-red-orange-700',
        '800': 'text-red-orange-800',
        '900': 'text-red-orange-900',
        '950': 'text-red-orange-950',
      },
    },
    border: {
      white: 'border-white',
      lightgray: 'border-lightgray',
      primary: {
        '50': 'border-red-orange-50',
        '100': 'border-red-orange-100',
        '200': 'border-red-orange-200',
        '300': 'border-red-orange-300',
        '400': 'border-red-orange-400',
        '500': 'border-red-orange-500',
        '600': 'border-red-orange-600',
        '700': 'border-red-orange-700',
        '800': 'border-red-orange-800',
        '900': 'border-red-orange-900',
        '950': 'border-red-orange-950',
      },
    },
  },
  colors: {
    white: '#ffffff',
    black: '#111111',
    darkgray: '#767676',
    mediumgray: '#B8B8B8',
    lightgray: '#DBDBDB',
    transparent: 'transparent',
    shadow: '#000000',
    primary: primaryPalette,
    gray: {
      '100': '#F3F4F6',
    },
  },
};

// 이후 selectedTheme 저장/구독을 붙일 때 이 단일 export를 교체하는 방식으로 확장한다.
export const appTheme = defaultTheme;
