// src/components/settings/SettingsVersion.tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@navigation/AppNavigator';

interface SettingsVersionProps {
  version?: string;
}

/**
 * 설정 화면의 앱 버전 정보 컴포넌트
 */
const SettingsVersion: React.FC<SettingsVersionProps> = ({
  version,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      className="items-center mt-4"
      onPress={() => navigation.navigate('PremiumPurchase')}
    >
      <Text className="text-s text-darkgray">Ver {version}</Text>
    </Pressable>
  );
};

export default SettingsVersion;
