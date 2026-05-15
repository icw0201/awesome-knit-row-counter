import React, { useEffect, useState } from 'react';
import SettingsSingleSelect from './SettingsSingleSelect';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getSelectedColorThemeSetting, setSelectedColorThemeSetting, type ColorThemeSetting } from '@storage/settings';
import { APP_COLOR_THEME_OPTIONS } from '@styles/appTheme';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useIapContext } from '@provider/IapProvider';

/** 어쩜레드·애니블루만 무료 사용자에게 허용 (APP_COLOR_THEME_OPTIONS 상단 2개와 동일) */
const FREE_COLOR_THEME_VALUES = new Set<ColorThemeSetting>(['awesomeRed', 'anyBlue']);
/**
 * 설정 화면 — 앱 색상 테마(프라이머리 팔레트) 선택 전용
 */
const SettingsColorThemeSelector: React.FC = () => {
  const { premiumUnlocked } = useIapContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedTheme, setSelectedTheme] = useState<ColorThemeSetting>(() => getSelectedColorThemeSetting());

  useEffect(() => {
    const stored = getSelectedColorThemeSetting();
    if (!premiumUnlocked && !FREE_COLOR_THEME_VALUES.has(stored)) {
      setSelectedTheme('awesomeRed');
      setSelectedColorThemeSetting('awesomeRed');
      return;
    }
    setSelectedTheme(stored);
  }, [premiumUnlocked]);

  const handleSelectTheme = (value: ColorThemeSetting) => {
    setSelectedTheme(value);
    setSelectedColorThemeSetting(value);
  };

  const isOptionLocked = (value: ColorThemeSetting) => !premiumUnlocked && !FREE_COLOR_THEME_VALUES.has(value);

  return (
    <SettingsSingleSelect
      title="테마 색상 설정"
      selectedValue={selectedTheme}
      options={APP_COLOR_THEME_OPTIONS}
      onSelect={handleSelectTheme}
      isOptionLocked={isOptionLocked}
      onLockedOptionPress={() => navigation.navigate('PremiumPurchase')}
    />
  );
};

export default SettingsColorThemeSelector;
