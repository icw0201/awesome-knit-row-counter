// src/components/settings/SettingsCheckBoxes.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, AppState, Linking, type AppStateStatus } from 'react-native';
import { CommonActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

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
  getVoiceCommandsEnabledSetting,
  setVoiceCommandsEnabledSetting,
  getVoiceRecognitionPermissionStatusSetting,
  setVoiceRecognitionPermissionStatusSetting,
} from '@storage/settings';

interface SettingsCheckBoxesProps {}

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
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
  const [voicePermissionDenied, setVoicePermissionDenied] = useState(false);
  const [voicePermissionModalVisible, setVoicePermissionModalVisible] =
    useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 앱 시작 시 저장된 설정값을 한 번에 주입한다.
  const loadStoredSettings = useCallback(() => {
    setSound(getSoundSetting());
    setVibration(getVibrationSetting());
    setScreenAwake(getScreenAwakeSetting());
    setTooltipEnabled(getTooltipEnabledSetting());
    setAutoPlayElapsedTime(getAutoPlayElapsedTimeSetting());
    setVoiceCommandsEnabled(getVoiceCommandsEnabledSetting());
    setVoicePermissionDenied(
      getVoiceRecognitionPermissionStatusSetting() === 'denied'
    );
  }, []);

  useEffect(() => {
    loadStoredSettings();
  }, [loadStoredSettings]);

  // 음성 기능 체크 상태와 저장값을 항상 같은 값으로 맞춘다.
  const setVoiceCommandsPreference = useCallback((enabled: boolean) => {
    setVoiceCommandsEnabled(enabled);
    setVoiceCommandsEnabledSetting(enabled);
  }, []);

  // 권한이 허용되면 저장된 설정값 또는 요청 직후 상태를 그대로 복원한다.
  const applyGrantedVoicePermission = useCallback(
    (enabled: boolean) => {
      setVoiceRecognitionPermissionStatusSetting('granted');
      setVoicePermissionDenied(false);
      setVoiceCommandsPreference(enabled);
    },
    [setVoiceCommandsPreference]
  );

  // 권한이 거절되면 기능을 끄고, 필요할 때만 설정 이동 모달을 연다.
  const applyDeniedVoicePermission = useCallback(
    (showModal = false) => {
      setVoiceRecognitionPermissionStatusSetting('denied');
      setVoicePermissionDenied(true);
      setVoiceCommandsPreference(false);
      setVoicePermissionModalVisible(showModal);
    },
    [setVoiceCommandsPreference]
  );

  // 현재 권한 상태를 기준으로 체크박스 노출 상태를 다시 맞춘다.
  const syncVoicePermissionState = useCallback(async () => {
    try {
      const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();

      if (permission.granted) {
        applyGrantedVoicePermission(getVoiceCommandsEnabledSetting());
        return;
      }

      const isDenied = getVoiceRecognitionPermissionStatusSetting() === 'denied';
      setVoicePermissionDenied(isDenied);
      setVoiceCommandsPreference(false);
    } catch {
      setVoicePermissionDenied(
        getVoiceRecognitionPermissionStatusSetting() === 'denied'
      );
    }
  }, [applyGrantedVoicePermission, setVoiceCommandsPreference]);

  // 체크를 켤 때만 시스템 권한 요청을 시도한다.
  const requestVoicePermission = useCallback(async (): Promise<boolean> => {
    const currentPermission =
      await ExpoSpeechRecognitionModule.getPermissionsAsync();

    if (currentPermission.granted) {
      return true;
    }

    const requestedPermission =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    return requestedPermission.granted;
  }, []);

  /**
   * 에러 모달 표시
   */
  const showErrorModal = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const syncVoicePermissionSafely = () => {
        syncVoicePermissionState().catch(() => {
          showErrorModal('음성 인식 권한을 확인할 수 없습니다.');
        });
      };

      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          syncVoicePermissionSafely();
        }
      };

      syncVoicePermissionSafely();
      const appStateSubscription = AppState.addEventListener(
        'change',
        handleAppStateChange
      );

      return () => {
        appStateSubscription.remove();
      };
    }, [showErrorModal, syncVoicePermissionState])
  );

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
   * 음성 인식 단수 증감 설정 토글 처리
   */
  const handleVoiceCommandsToggle = async () => {
    if (voicePermissionDenied) {
      setVoicePermissionModalVisible(true);
      return;
    }

    if (voiceCommandsEnabled) {
      setVoiceCommandsPreference(false);
      return;
    }

    try {
      const granted = await requestVoicePermission();

      if (granted) {
        applyGrantedVoicePermission(true);
        return;
      }

      applyDeniedVoicePermission(true);
    } catch {
      setVoiceCommandsPreference(false);
      showErrorModal('음성 인식 권한을 확인할 수 없습니다.');
    }
  };

  const handleOpenVoicePermissionSettings = () => {
    Linking.openSettings().catch(() => {
      showErrorModal('설정 화면을 열 수 없습니다.');
    });
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
      setResetConfirm(false);
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
    setResetConfirm(false);
  };

  return (
    <>
      <View className="mb-6 space-y-4">
        <CheckBox
          label="소리"
          checked={sound}
          onToggle={handleSoundToggle}
        />
        <CheckBox
          label="진동"
          checked={vibration}
          onToggle={handleVibrationToggle}
        />
        <CheckBox
          label="스크린 항상 켜두기"
          checked={screenAwake}
          onToggle={handleScreenAwakeToggle}
        />
        <CheckBox
          label="툴팁 표시하기"
          checked={tooltipEnabled}
          onToggle={handleTooltipToggle}
        />
        <CheckBox
          label="타이머 자동 재생"
          checked={autoPlayElapsedTime}
          onToggle={handleAutoPlayElapsedTimeToggle}
        />
        <CheckBox
          label="음성 인식 단수 증감"
          checked={voiceCommandsEnabled}
          onToggle={handleVoiceCommandsToggle}
        />
        <CheckBox
          label="초기화하기"
          checked={resetConfirm}
          onToggle={handleResetToggle}
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

      <ConfirmModal
        visible={voicePermissionModalVisible}
        onClose={() => setVoicePermissionModalVisible(false)}
        title="음성 인식 권한"
        description={
          '해당 기능을 사용하시려면 앱 권한을 "앱 사용 중에만 허용"으로 설정해주세요'
        }
        onConfirm={handleOpenVoicePermissionSettings}
        confirmText="설정 열기"
        cancelText="닫기"
      />
    </>
  );
};

export default SettingsCheckBoxes;
