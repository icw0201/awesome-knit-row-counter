// src/screens/Settings.tsx
import React from 'react';
import { View, ScrollView } from 'react-native';

import { SettingsCheckBoxes, SettingsLinks, SettingsVersion } from '@components/settings';
import { screenStyles } from '@styles/screenStyles';

/**
 * 설정 화면 컴포넌트
 * 앱의 다양한 설정을 관리하고, 리뷰/문의 링크를 제공합니다.
 */
const Settings = () => {

  return (
    <View className="flex-1">
      {/* 설정 옵션들 */}
      <ScrollView contentContainerStyle={screenStyles.scrollViewContentCentered}>
        <SettingsCheckBoxes />

        <SettingsLinks />

        <SettingsVersion version="1.3.3-internal.1" />
      </ScrollView>

    </View>
  );
};

export default Settings;
