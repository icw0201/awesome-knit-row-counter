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