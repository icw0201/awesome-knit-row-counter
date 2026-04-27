import { appTheme } from '@styles/appTheme';

export type ColorStyleKey = 'default' | 'lightest' | 'light' | 'medium' | 'vivid';

export type ColorStyle = {
  containerClassName: string;
  textClassName: string;
  subtextClassName: string;
  iconColor: string;
};

const getColorStyles = (): Record<ColorStyleKey, ColorStyle> => ({
  default: {//흰색 배경에 회색 테두리
    containerClassName: `${appTheme.tw.bg.white} border ${appTheme.tw.border.lightgray}`,
    textClassName: appTheme.tw.text.black,
    subtextClassName: appTheme.tw.text.darkgray,
    iconColor: appTheme.colors.black,
  },
  lightest: {//100에 테두리 없음
    containerClassName: appTheme.tw.bg.primary['100'],
    textClassName: appTheme.tw.text.primary['500'],
    subtextClassName: appTheme.tw.text.primary['400'],
    iconColor: appTheme.colors.black,
  },
  light: {//테두리 없이 200
    containerClassName: appTheme.tw.bg.primary['200'],
    textClassName: appTheme.tw.text.primary['950'],
    subtextClassName: appTheme.tw.text.primary['700'],
    iconColor: appTheme.colors.primary['950'],
  },
  medium: {//테두리 없이 300
    containerClassName: appTheme.tw.bg.primary['300'],
    textClassName: appTheme.tw.text.primary['950'],
    subtextClassName: appTheme.tw.text.primary['700'],
    iconColor: appTheme.colors.primary['950'],
  },
  vivid: {//테두리 없이 400
    containerClassName: appTheme.tw.bg.primary['400'],
    textClassName: appTheme.tw.text.primary['950'],
    subtextClassName: appTheme.tw.text.primary['700'],
    iconColor: appTheme.colors.primary['950'],
  },
});

export const colorStyles: Record<ColorStyleKey, ColorStyle> = new Proxy(
  {} as Record<ColorStyleKey, ColorStyle>,
  {
    get(_target, property) {
      return getColorStyles()[property as ColorStyleKey];
    },
  }
);
