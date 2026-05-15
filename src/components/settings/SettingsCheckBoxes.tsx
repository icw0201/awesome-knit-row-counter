// src/components/settings/SettingsCheckBoxes.tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import CheckBox from '@components/common/CheckBox';
import SettingsSectionHeader from './SettingsSectionHeader';
import {
  setSoundSetting,
  setVibrationSetting,
  getSoundSetting,
  getVibrationSetting,
  getScreenAwakeSetting,
  setScreenAwakeSetting,
  getTooltipEnabledSetting,
  setTooltipEnabledSetting,
  getAutoPlayElapsedTimeSetting,
  setAutoPlayElapsedTimeSetting,
} from '@storage/settings';

interface SettingsCheckBoxesProps {}

interface SettingsItem {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

interface SettingsSectionProps {
  title: string;
  items: SettingsItem[];
  titleClassName?: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  items,
  titleClassName = 'text-darkgray',
}) => {
  return (
    <View className="mb-6">
      <SettingsSectionHeader title={title} titleClassName={titleClassName} />
      <View>
        {items.map((item) => (
          <View key={item.label}>
            <CheckBox
              label={item.label}
              checked={item.checked}
              onToggle={item.onToggle}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * 설정 화면의 체크박스들을 묶은 컴포넌트
 */
const SettingsCheckBoxes: React.FC<SettingsCheckBoxesProps> = ({
}) => {
  // 설정 상태 관리
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [screenAwake, setScreenAwake] = useState(true);
  const [tooltipEnabled, setTooltipEnabled] = useState(true);
  const [autoPlayElapsedTime, setAutoPlayElapsedTime] = useState(true);

  useEffect(() => {
    setSound(getSoundSetting());
    setVibration(getVibrationSetting());
    setScreenAwake(getScreenAwakeSetting());
    setTooltipEnabled(getTooltipEnabledSetting());
    setAutoPlayElapsedTime(getAutoPlayElapsedTimeSetting());
  }, []);

  /**
   * 소리 설정 토글 처리
   */
  const handleSoundToggle = () => {
    const newValue = !sound;
    setSound(newValue);
    setSoundSetting(newValue);
  };

  /**
   * 진동 설정 토글 처리
   */
  const handleVibrationToggle = () => {
    const newValue = !vibration;
    setVibration(newValue);
    setVibrationSetting(newValue);
  };

  /**
   * 화면 켜짐 설정 토글 처리
   */
  const handleScreenAwakeToggle = () => {
    const newValue = !screenAwake;
    setScreenAwake(newValue);
    setScreenAwakeSetting(newValue);
  };

  /**
   * 툴팁 표시 설정 토글 처리
   */
  const handleTooltipToggle = () => {
    const newValue = !tooltipEnabled;
    setTooltipEnabled(newValue);
    setTooltipEnabledSetting(newValue);
  };

  /**
   * 타이머 자동 재생 설정 토글 처리
   */
  const handleAutoPlayElapsedTimeToggle = () => {
    const newValue = !autoPlayElapsedTime;
    setAutoPlayElapsedTime(newValue);
    setAutoPlayElapsedTimeSetting(newValue);
  };

  const deviceSettings: SettingsItem[] = [
    {
      label: '스크린 항상 켜두기',
      checked: screenAwake,
      onToggle: handleScreenAwakeToggle,
    },
    {
      label: '소리',
      checked: sound,
      onToggle: handleSoundToggle,
    },
    {
      label: '진동',
      checked: vibration,
      onToggle: handleVibrationToggle,
    },
  ];

  const counterSettings: SettingsItem[] = [
    {
      label: '툴팁 표시하기',
      checked: tooltipEnabled,
      onToggle: handleTooltipToggle,
    },
    {
      label: '타이머 자동 재생',
      checked: autoPlayElapsedTime,
      onToggle: handleAutoPlayElapsedTimeToggle,
    },
  ];

  // 설정 화면 본문: 체크박스 섹션들
  return (
    <>
      <View className="mb-6">
        <SettingsSection title="기기 설정" items={deviceSettings} />
        <SettingsSection title="카운터 설정" items={counterSettings} />
      </View>
    </>
  );
};

export default SettingsCheckBoxes;
