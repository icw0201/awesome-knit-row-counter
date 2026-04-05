// src/components/settings/SettingsCheckBoxes.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';

import CheckBox from '@components/common/CheckBox';
import { ConfirmModal } from '@components/common/modals';
import { clearAllProjectData } from '@storage/storage';
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
      <View className="mb-2 flex-row items-center px-4">
        <Text className={`mr-3 text-sm font-semibold ${titleClassName}`}>
          {title}
        </Text>
        <View className="flex-1 border-b border-lightgray" />
      </View>
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
const SettingsCheckBoxes: React.FC<SettingsCheckBoxesProps> = () => {
  // 네비게이션 객체
  const navigation = useNavigation();

  // 설정 상태 관리
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [screenAwake, setScreenAwake] = useState(true);
  const [tooltipEnabled, setTooltipEnabled] = useState(true);
  const [autoPlayElapsedTime, setAutoPlayElapsedTime] = useState(true);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setSound(getSoundSetting());
    setVibration(getVibrationSetting());
    setScreenAwake(getScreenAwakeSetting());
    setTooltipEnabled(getTooltipEnabledSetting());
    setAutoPlayElapsedTime(getAutoPlayElapsedTimeSetting());
  }, []);

  /**
   * 에러 모달 표시
   */
  const showErrorModal = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
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

  /**
   * 초기화 확인 모달 열기
   */
  const handleResetToggle = () => {
    setResetModalVisible(true);
  };

  /**
   * 초기화 실행 및 앱 재시작
   */
  const handleResetConfirm = () => {
    try {
      // 모든 프로젝트 데이터 삭제
      clearAllProjectData();

      // 상태 초기화
      setResetModalVisible(false);

      // 앱을 Main 화면으로 재시작
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error) {
      showErrorModal('초기화 중 오류가 발생했습니다.');
    }
  };

  /**
   * 초기화 모달 닫기 및 상태 초기화
   */
  const handleResetModalClose = () => {
    setResetModalVisible(false);
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

  const dangerSettings: SettingsItem[] = [
    {
      label: '초기화하기',
      checked: false,
      onToggle: handleResetToggle,
    },
  ];

  return (
    <>
      <View className="mb-6">
        <SettingsSection title="기기 설정" items={deviceSettings} />
        <SettingsSection title="카운터 설정" items={counterSettings} />
        <SettingsSection
          title="데이터 관리"
          items={dangerSettings}
          titleClassName="text-red-orange-500"
        />
      </View>

      {/* 초기화 확인 모달 */}
      <ConfirmModal
        visible={resetModalVisible}
        onClose={handleResetModalClose}
        title="초기화"
        description="정말 프로젝트 정보를 모두 삭제하시겠습니까?"
        onConfirm={handleResetConfirm}
        confirmText="삭제"
        cancelText="취소"
      />

      {/* 에러 알림 모달 */}
      <ConfirmModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="오류"
        description={errorMessage}
        onConfirm={() => setErrorModalVisible(false)}
        confirmText="확인"
        cancelText=""
      />
    </>
  );
};

export default SettingsCheckBoxes;
