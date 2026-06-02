import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Star } from 'lucide-react-native';

import type { RootStackParamList } from '@navigation/AppNavigator';
import { useIapContext } from '@provider/IapProvider';
import { appTheme } from '@styles/appTheme';
import IconBox from './IconBox';
import SettingsSectionHeader from './SettingsSectionHeader';

interface SettingsItemImportProps {}

const PREMIUM_OVERLAY_STYLE = StyleSheet.create({
  overlay: {
    mixBlendMode: 'multiply',
  },
}).overlay;

const SettingsItemImport: React.FC<SettingsItemImportProps> = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { premiumUnlocked } = useIapContext();

  const handleItemImportPress = () => {};

  return (
    <View className="mb-8">
      <SettingsSectionHeader
        title="도안 불러오기"
        tooltipText="어쩜 전용 파일을 제공하는 도안을 구매하셨다면, 도안 파일을 불러와 미리 설정된 카운터를 사용하세요!"
      />
      <View className="relative">
        <IconBox
          title="도안 불러오기"
          iconName="upload"
          disabled={!premiumUnlocked}
          onPress={handleItemImportPress}
        />
        {!premiumUnlocked ? (
          <>
            <View
              className="pointer-events-none absolute -inset-2 z-[5] rounded-2xl bg-mediumgray overflow-hidden"
              style={PREMIUM_OVERLAY_STYLE}
            />
            <TouchableOpacity
              activeOpacity={1}
              className="absolute -inset-2 z-[10] rounded-2xl"
              onPress={() => navigation.navigate('PremiumPurchase')}
              accessibilityRole="button"
              accessibilityLabel="도안 불러오기, 프리미엄 전용"
              accessibilityHint="탭하면 프리미엄 구매 화면으로 이동합니다."
            />
            <View className="pointer-events-none absolute inset-y-0 right-4 z-[20] w-6 items-center justify-center">
              <Star
                size={22}
                color={appTheme.colors.premiumGold}
                fill={appTheme.colors.premiumGold}
              />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
};

export default SettingsItemImport;
