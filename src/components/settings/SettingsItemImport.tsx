import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        title="프로젝트 불러오기"
        tooltipText={
          [
            '어쩜 전용 파일을 제공하는 도안을 구매하셨다면, 미리 세팅된 프로젝트 파일을 불러와 사용하세요!',
            '',
            '불러오기 전용 json 파일을 제작하고 싶은 도아너라면, 문의하기를 통해 연락 주세요. 협업해주시는 도아너님께 프리미엄 앱 코드를 발송해드립니다.',
          ].join('\n')
        }
      />
      <Text className={`px-2 pb-2 text-xs ${appTheme.tw.text.darkgray}`}>
        목표단수, 알림설정이 미리 세팅된 프로젝트 파일을{'\n'}
        불러올 수 있습니다.
      </Text>
      <View className="relative">
        <IconBox
          title="프로젝트 불러오기"
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
