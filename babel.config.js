module.exports = {
  // Babel 설정의 기준 파일입니다.
  // 이 브랜치에서는 Expo 플러그인(app.json)과 네이티브 모듈 구성을 함께 쓰기 위해
  // 기본 preset을 React Native 기본값에서 Expo preset으로 전환했습니다.
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
