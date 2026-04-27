// App.tsx (루트 최상위 파일)
import React from 'react';
import { SafeAreaView } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { useScreenAwakeSync } from './src/hooks/useScreenAwakeSync';
import { useAppThemeSync } from './src/hooks/useAppThemeSync';
import StoreUpdatePrompt from '@features/update/StoreUpdatePrompt';

export default function App() {
  useScreenAwakeSync();
  useAppThemeSync();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StoreUpdatePrompt />
      <AppNavigator />
    </SafeAreaView>
  );
}
