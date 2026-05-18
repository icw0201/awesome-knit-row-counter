// App.tsx (루트 최상위 파일)
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useScreenAwakeSync } from './src/hooks/useScreenAwakeSync';
import { useAppThemeSync } from './src/hooks/useAppThemeSync';
import StoreUpdatePrompt from '@features/update/StoreUpdatePrompt';
import { IapProvider } from '@provider/IapProvider';

export default function App() {
  useScreenAwakeSync();
  useAppThemeSync();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <IapProvider>
          <StoreUpdatePrompt />
          <AppNavigator />
        </IapProvider>
      </View>
    </SafeAreaProvider>
  );
}
