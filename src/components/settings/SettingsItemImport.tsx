import React from 'react';
import { View } from 'react-native';

import IconBox from './IconBox';
import SettingsSectionHeader from './SettingsSectionHeader';

interface SettingsItemImportProps {}

const SettingsItemImport: React.FC<SettingsItemImportProps> = () => {
  const handleItemImportPress = () => {};

  return (
    <View className="mb-8">
      <SettingsSectionHeader
        title="도안 불러오기"
        tooltipText="어쩜 전용 파일을 제공하는 도안을 구매하셨다면, 도안 파일을 불러와 미리 설정된 카운터를 사용하세요!"
      />
      <IconBox
        title="도안 불러오기"
        iconName="upload"
        onPress={handleItemImportPress}
      />
    </View>
  );
};

export default SettingsItemImport;
