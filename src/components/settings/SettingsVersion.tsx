// src/components/settings/SettingsVersion.tsx
import React from 'react';
import { Text, View } from 'react-native';

interface SettingsVersionProps {
  version?: string;
  onLongPress?: () => void;
}

/**
 * 설정 화면의 앱 버전 정보 컴포넌트
 */
const SettingsVersion: React.FC<SettingsVersionProps> = ({
  version,
  onLongPress,
}) => {
  return (
    <View
      className="items-center mt-4"
    >
      <Text
        className="text-s text-darkgray"
        onLongPress={onLongPress}
      >
        Ver {version}
      </Text>
    </View>
  );
};

export default SettingsVersion;
