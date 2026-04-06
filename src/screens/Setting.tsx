// src/screens/Settings.tsx
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsCheckBoxes, SettingsLinks, SettingsVersion } from '@components/settings';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';

/**
 * 설정 화면 컴포넌트
 * 앱의 다양한 설정을 관리하고, 리뷰/문의 링크를 제공합니다.
 */
const Settings = () => {

  return (
    <SafeAreaView style={screenStyles.flex1} edges={safeAreaEdges}>
      {/* 설정 옵션들 */}
      <ScrollView contentContainerStyle={screenStyles.scrollViewContentCentered}>
        <SettingsCheckBoxes />

        <SettingsLinks />

        <SettingsVersion version="1.4.1" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
