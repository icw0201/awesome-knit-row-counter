// src/components/settings/SettingsSectionHeader.tsx
import React from 'react';
import { View, Text } from 'react-native';

export interface SettingsSectionHeaderProps {
  title: string;
  titleClassName?: string;
}

/**
 * 설정 섹션 제목 — 제목 오른쪽으로 연속되는 구분선 (SettingsCheckBoxes 음성인식 명령어 행과 동일)
 */
const SettingsSectionHeader: React.FC<SettingsSectionHeaderProps> = ({
  title,
  titleClassName = 'text-darkgray',
}) => {
  return (
    <View className="mb-2 flex-row items-center px-2">
      <Text className={`mr-3 text-sm font-semibold ${titleClassName}`}>
        {title}
      </Text>
      <View className="flex-1 border-b border-lightgray" />
    </View>
  );
};

export default SettingsSectionHeader;
