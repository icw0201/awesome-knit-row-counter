module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'nativewind/babel',
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@screens': './src/screens',
          '@assets': './src/assets',
          '@components': './src/components',
          '@constants': './src/constants',
          '@features': './src/features',
          '@hooks': './src/hooks',
          '@storage': './src/storage',
          '@navigation': './src/navigation',
          '@styles': './src/styles',
          '@utils': './src/utils',
        },
      },
    ],
    'react-native-worklets/plugin', // reanimated 4.x: worklets 플러그인 사용, 반드시 마지막에 위치
  ],
};
