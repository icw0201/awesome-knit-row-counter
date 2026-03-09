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

export function useVoicePermissionGate() {
  const isSyncingPermissionRef = useRef(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(
    getVoiceCommandsEnabledSetting()
  );
  const [voicePermissionGranted, setVoicePermissionGranted] = useState(false);
  const [voicePermissionModalVisible, setVoicePermissionModalVisible] =
    useState(false);
  const [voicePermissionError, setVoicePermissionError] = useState('');

  const applyGrantedVoicePermission = useCallback((enabled: boolean) => {
    setVoiceRecognitionPermissionStatusSetting('granted');
    setVoiceCommandsEnabledSetting(enabled);
    setVoiceCommandsEnabled(enabled);
    setVoicePermissionGranted(true);
    setVoicePermissionModalVisible(false);
    setVoicePermissionError('');
  }, []);

  const applyDeniedVoicePermission = useCallback((showModal: boolean) => {
    setVoiceRecognitionPermissionStatusSetting('denied');
    setVoiceCommandsEnabledSetting(false);
    setVoiceCommandsEnabled(false);
    setVoicePermissionGranted(false);
    setVoicePermissionModalVisible(showModal);
    setVoicePermissionError('');
  }, []);

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

      if (currentPermission.granted) {
        const shouldEnable = storedStatus === 'granted'
          ? getVoiceCommandsEnabledSetting()
          : true;
        applyGrantedVoicePermission(shouldEnable);
        return;
      }

      // 이미 처리된 거절/권한 철회 상태에서는 재진입 시 시스템 권한 요청을 다시 띄우지 않는다.
      if (storedStatus === 'granted' || storedStatus === 'denied') {
        applyDeniedVoicePermission(false);
        return;
      }

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

  const openVoicePermissionSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      setVoicePermissionError('설정 화면을 열 수 없습니다');
    });
  }, []);

  const closeVoicePermissionModal = useCallback(() => {
    setVoicePermissionModalVisible(false);
  }, []);

  return {
    isVoiceCommandsActive:
      isScreenFocused && voiceCommandsEnabled && voicePermissionGranted,
    voicePermissionModalVisible,
    voicePermissionError,
    closeVoicePermissionModal,
    openVoicePermissionSettings,
  };
}
