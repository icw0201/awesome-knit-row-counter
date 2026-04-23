import React, { useEffect, useState } from 'react';
import SettingsSingleSelect from './SettingsSingleSelect';
import {
  getSelectedColorThemeSetting,
  setSelectedColorThemeSetting,
  type ColorThemeSetting,
} from '@storage/settings';
import { APP_COLOR_THEME_OPTIONS } from '@styles/appTheme';

const SettingsThemeSelector: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<ColorThemeSetting>('redOrange');

  useEffect(() => {
    setSelectedTheme(getSelectedColorThemeSetting());
  }, []);

  const handleSelectTheme = (value: ColorThemeSetting) => {
    setSelectedTheme(value);
    setSelectedColorThemeSetting(value);
  };

  return (
    <SettingsSingleSelect
      title="테마 색상 설정"
      selectedValue={selectedTheme}
      options={APP_COLOR_THEME_OPTIONS}
      onSelect={handleSelectTheme}
    />
  );
};

export default SettingsThemeSelector;
