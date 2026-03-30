import { useCallback, useRef, useState } from 'react';
import { AppState, Linking, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import {
  getVoiceCommandsEnabledSetting,
  getVoiceRecognitionPermissionStatusSetting,
  setVoiceCommandsEnabledSetting,
  setVoiceRecognitionPermissionStatusSetting,
} from '@storage/settings';

/**
 * 음성 인식 토글과 시스템 권한 상태를 함께 관리한다.
 *
 * 역할:
 * - 저장된 "음성 기능 사용 여부"와 실제 OS 권한 상태를 동기화
 * - 화면 포커스/앱 복귀 시 권한 상태 재확인
 * - 토글 ON 시 필요하면 시스템 권한 요청
 * - 영구 거절 상태에서는 설정 이동 모달 노출
 */
export function useVoicePermissionGate() {
  // 권한 요청/동기화가 중첩 실행되면 모달과 AppState 이벤트가 꼬일 수 있어 재진입을 막는다.
  const isSyncingPermissionRef = useRef(false);
  // 현재 화면이 포커스 상태일 때만 실제 음성 인식을 active로 본다.
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  // 사용자가 켜 둔 기능 설정값(저장소와 동기화되는 UI state)
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(
    getVoiceCommandsEnabledSetting()
  );
  // 시스템 권한이 실제로 허용되었는지 여부
  const [voicePermissionGranted, setVoicePermissionGranted] = useState(false);
  // 권한이 영구 거절되었거나 설정 이동이 필요한 경우 보여줄 모달
  const [voicePermissionModalVisible, setVoicePermissionModalVisible] =
    useState(false);
  // 권한 확인/설정 이동 과정에서 사용자에게 보여줄 에러 문구
  const [voicePermissionError, setVoicePermissionError] = useState('');

  // 권한 허용 상태를 저장소/UI에 함께 반영한다.
  const applyGrantedVoicePermission = useCallback((enabled: boolean) => {
    setVoiceRecognitionPermissionStatusSetting('granted');
    setVoiceCommandsEnabledSetting(enabled);
    setVoiceCommandsEnabled(enabled);
    setVoicePermissionGranted(true);
    setVoicePermissionModalVisible(false);
    setVoicePermissionError('');
  }, []);

  // 권한 거절 상태를 저장소/UI에 함께 반영한다.
  // showModal=true면 사용자를 설정 이동 안내 모달로 유도한다.
  const applyDeniedVoicePermission = useCallback((showModal: boolean) => {
    setVoiceRecognitionPermissionStatusSetting('denied');
    setVoiceCommandsEnabledSetting(false);
    setVoiceCommandsEnabled(false);
    setVoicePermissionGranted(false);
    setVoicePermissionModalVisible(showModal);
    setVoicePermissionError('');
  }, []);

  // 토글 ON 직전 시스템 권한을 확인하고, 아직 없으면 OS 권한 요청을 띄운다.
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
   * 저장된 권한 상태와 현재 OS 권한 상태를 비교해
   * 기능 ON/OFF, granted/denied, 모달 노출 상태를 다시 맞춘다.
   */
  const syncVoicePermission = useCallback(async () => {
    // 권한 팝업이 열리고 닫히는 동안 AppState 이벤트가 다시 들어올 수 있어
    // 동일한 권한 요청 흐름이 중복 실행되지 않도록 막는다.
    if (isSyncingPermissionRef.current) {
      return;
    }

    isSyncingPermissionRef.current = true;
    const storedStatus = getVoiceRecognitionPermissionStatusSetting();

    try {
      const currentPermission =
        await ExpoSpeechRecognitionModule.getPermissionsAsync();

      // 이미 허용된 경우: 저장소에 남아 있던 enabled 여부를 기준으로 복원한다.
      // 단, 최초 허용 직후처럼 저장 상태가 없으면 기본값을 true로 둔다.
      if (currentPermission.granted) {
        const shouldEnable = storedStatus === 'granted'
          ? getVoiceCommandsEnabledSetting()
          : true;
        applyGrantedVoicePermission(shouldEnable);
        return;
      }

      // 이미 처리된 거절/권한 철회 상태에서는 화면 재진입만으로
      // 시스템 권한 요청 팝업을 다시 띄우지 않는다.
      if (storedStatus === 'granted' || storedStatus === 'denied') {
        applyDeniedVoicePermission(false);
        return;
      }

      // 더 이상 canAskAgain이 불가능하면 설정 앱 이동만 남는다.
      if (currentPermission.canAskAgain === false) {
        applyDeniedVoicePermission(true);
        return;
      }

      const requestedPermission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (requestedPermission.granted) {
        applyGrantedVoicePermission(true);
        return;
      }

      applyDeniedVoicePermission(true);
    } catch {
      setVoiceCommandsEnabled(false);
      setVoicePermissionGranted(false);
      setVoicePermissionModalVisible(true);
      setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
    } finally {
      isSyncingPermissionRef.current = false;
    }
  }, [applyDeniedVoicePermission, applyGrantedVoicePermission]);

  /**
   * 화면 포커스 시:
   * - 현재 화면이 활성화됐음을 기록
   * - 권한 상태를 즉시 동기화
   * - 사용자가 설정 앱에서 돌아온 경우를 위해 AppState(active)에서도 다시 동기화
   */
  useFocusEffect(
    useCallback(() => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          syncVoicePermission();
        }
      };

      setIsScreenFocused(true);
      syncVoicePermission();

      const appStateSubscription = AppState.addEventListener(
        'change',
        handleAppStateChange
      );

      return () => {
        appStateSubscription.remove();
        setIsScreenFocused(false);
      };
    }, [syncVoicePermission])
  );

  // 사용자를 앱 설정 화면으로 보낸다.
  const openVoicePermissionSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      setVoicePermissionError('설정 화면을 열 수 없습니다');
    });
  }, []);

  // 설정 이동 안내 모달만 닫고, 권한/기능 상태 자체는 유지한다.
  const closeVoicePermissionModal = useCallback(() => {
    setVoicePermissionModalVisible(false);
  }, []);

  /**
   * 헤더의 음성 토글 버튼 처리.
   *
   * - 이미 켜져 있으면 즉시 OFF
   * - 저장된 상태가 denied면 OS 팝업 대신 설정 이동 모달 노출
   * - 그 외에는 시스템 권한을 요청하고 결과에 따라 granted/denied 적용
   */
  const toggleVoiceCommands = useCallback(async () => {
    if (voiceCommandsEnabled) {
      setVoiceCommandsEnabledSetting(false);
      setVoiceCommandsEnabled(false);
      setVoicePermissionError('');
      return;
    }

    if (getVoiceRecognitionPermissionStatusSetting() === 'denied') {
      setVoicePermissionModalVisible(true);
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
      setVoiceCommandsEnabledSetting(false);
      setVoiceCommandsEnabled(false);
      setVoicePermissionGranted(false);
      setVoicePermissionModalVisible(true);
      setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
    }
  }, [
    applyDeniedVoicePermission,
    applyGrantedVoicePermission,
    requestVoicePermission,
    voiceCommandsEnabled,
  ]);

  return {
    // 사용자가 켰고, 실제 OS 권한도 있을 때만 "enabled"로 본다.
    isVoiceCommandsEnabled: voiceCommandsEnabled && voicePermissionGranted,
    // 실제 음성 인식 실행은 화면 포커스까지 만족할 때만 active다.
    isVoiceCommandsActive:
      isScreenFocused && voiceCommandsEnabled && voicePermissionGranted,
    voicePermissionModalVisible,
    voicePermissionError,
    closeVoicePermissionModal,
    openVoicePermissionSettings,
    toggleVoiceCommands,
  };
}
