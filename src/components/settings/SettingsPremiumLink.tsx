// src/components/settings/SettingsPremiumLink.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@navigation/AppNavigator';
import IconBox from './IconBox';

/**
 * 설정에서 프리미엄 구매 화면으로 이동하는 진입점
 */
const SettingsPremiumLink: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View className="mb-6">
      <Text className="mb-3 px-1 text-sm font-semibold text-darkgray">
        유료 기능
      </Text>
      <IconBox
        title="프리미엄 버전"
        iconName="star"
        onPress={() => navigation.navigate('PremiumPurchase')}
      />
    </View>
  );
};

export default SettingsPremiumLink;
