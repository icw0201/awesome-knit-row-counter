// Metro 번들러 설정 파일입니다.
// 이 브랜치에서는 Expo 기반 네이티브 모듈/asset 설정을 우선 적용해야 하므로
// 기본 설정 생성기를 React Native 기본 구현에서 Expo 구현으로 바꿨습니다.
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// mp3가 assetExts에 있는지 확인 후 확장, svg는 sourceExts로 처리
defaultConfig.resolver.assetExts = [
  ...defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
  'mp3',
];
defaultConfig.resolver.sourceExts = [...defaultConfig.resolver.sourceExts, 'svg'];

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    unstable_allowRequireContext: true,
  },
};

module.exports = mergeConfig(defaultConfig, config);