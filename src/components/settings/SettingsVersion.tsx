// src/components/settings/SettingsVersion.tsx
import React from 'react';
import { Text, View } from 'react-native';

interface SettingsVersionProps {
  version?: string;
}

/**
 * 설정 화면의 앱 버전 정보 컴포넌트
 */
const SettingsVersion: React.FC<SettingsVersionProps> = ({
  version,
}) => {
  return (
    <View
      className="items-center mt-4"
    >
      <Text className="text-s text-darkgray">Ver {version}</Text>
    </View>
  );
};

export default SettingsVersion;
