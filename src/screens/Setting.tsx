// src/screens/Settings.tsx
import React from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SettingsAppInfo,
  SettingsBackup,
  SettingsCheckBoxes,
  SettingsDataManagement,
  SettingsVersion,
} from '@components/settings';
import { useAppThemeSync } from '@hooks/useAppThemeSync';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';

/**
 * 설정 화면 컴포넌트
 * 앱의 다양한 설정을 관리하고, 리뷰/문의 링크를 제공합니다.
 */
const Settings = () => {
  useAppThemeSync();

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

          <SettingsBackup />

          <SettingsDataManagement />

          <SettingsAppInfo />

          <SettingsVersion version="1.5.0-internal.2" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Settings;
