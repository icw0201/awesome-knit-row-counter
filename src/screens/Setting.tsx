// src/screens/Setting.tsx
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SettingsAppInfo,
  SettingsBackup,
  SettingsCheckBoxes,
  SettingsColorThemeSelector,
  SettingsDataManagement,
  SettingsItemImport,
  SettingsVersion,
  SettingsVoiceCommands,
} from '@components/settings';
import { useAppThemeSync } from '@hooks/useAppThemeSync';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';

/**
 * 설정 화면 컴포넌트
 * 앱의 다양한 설정을 관리하고, 리뷰/문의 링크를 제공합니다.
 */
const Settings = () => {
  useAppThemeSync();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={screenStyles.flex1} edges={safeAreaEdges}>
      <KeyboardAvoidingView
        style={screenStyles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        {/* 설정 옵션들 */}
        <ScrollView
          contentContainerStyle={screenStyles.scrollViewContentCentered}
          keyboardShouldPersistTaps="handled"
        >
          <SettingsCheckBoxes />
          <SettingsColorThemeSelector />
          <SettingsVoiceCommands />

          <SettingsBackup />
          <SettingsItemImport />

          <SettingsDataManagement />

          <SettingsAppInfo />

          <SettingsVersion
            version="1.6.1"
            onLongPress={() => navigation.navigate('PremiumPurchase')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Settings;
