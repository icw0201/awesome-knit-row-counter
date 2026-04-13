import { useCallback, useRef, useState } from 'react';
import { AppState, Linking, Platform, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import {
  getVoiceCommandsEnabledSetting,
  getVoiceRecognitionPermissionStatusSetting,
  setVoiceCommandsEnabledSetting,
  setVoiceRecognitionPermissionStatusSetting,
} from '@storage/settings';

const ANDROID_ON_DEVICE_SERVICE = 'com.google.android.as';
const REQUIRED_ON_DEVICE_LOCALE = 'ko-KR';

function normalizeLocaleTag(locale: string): string {
  return locale.trim().replace(/_/g, '-').toLowerCase();
}

function getLocaleLanguage(locale: string): string {
  return normalizeLocaleTag(locale).split('-')[0] ?? '';
}

function hasMatchingOnDeviceLocale(
  installedLocales: string[],
  requiredLocale: string
): boolean {
  const normalizedRequiredLocale = normalizeLocaleTag(requiredLocale);
  const requiredLanguage = getLocaleLanguage(requiredLocale);

  return installedLocales.some((locale) => {
    const normalizedLocale = normalizeLocaleTag(locale);

    if (normalizedLocale === normalizedRequiredLocale) {
      return true;
    }

    // 일부 Android 인식 서비스는 region 없이 "ko"만 돌려주거나 "_" 구분자를 사용한다.
    return getLocaleLanguage(normalizedLocale) === requiredLanguage;
  });
}

function shouldTrustSupportedLocalesWhenInstalledLocalesEmpty(
  installedLocales: string[],
  supportedLocales: string[],
  requiredLocale: string
): boolean {
  if (installedLocales.length > 0) {
    return false;
  }

  return hasMatchingOnDeviceLocale(supportedLocales, requiredLocale);
}

/**
 * 음성 인식 토글과 시스템 권한 상태를 함께 관리한다.
 *
 * 역할:
 * - 저장된 "음성 기능 사용 여부"와 실제 OS 권한 상태를 동기화
 * - 화면 포커스/앱 복귀 시 권한 상태 재확인
 * - 토글 ON 시 필요하면 시스템 권한 요청
 * - 영구 거절/모델 미설치 상태에서는 안내 모달 노출
 */
export function useVoicePermissionGate() {
  // 권한 요청/동기화가 중첩 실행되면 모달과 AppState 이벤트가 꼬일 수 있어 재진입을 막는다.
  const isSyncingPermissionRef = useRef(false);
  // 시스템 마이크 권한 팝업 직전 안내 모달이 떠 있는 동안 syncVoicePermission 재진입을 막는다.
  const isVoiceMicPrimerOpenRef = useRef(false);
  const micPrimerContinueRef = useRef<null | (() => Promise<void>)>(null);
  // 현재 화면이 포커스 상태일 때만 실제 음성 인식을 active로 본다.
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  // 사용자가 켜 둔 기능 설정값(저장소와 동기화되는 UI state)
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(
    getVoiceCommandsEnabledSetting()
  );
  // 시스템 권한이 실제로 허용되었는지 여부
  const [voicePermissionGranted, setVoicePermissionGranted] = useState(false);
  // 권한 설정 안내 / 모델 미설치 안내에 공용으로 사용하는 모달
  const [voicePermissionModalVisible, setVoicePermissionModalVisible] =
    useState(false);
  // 같은 ConfirmModal을 재사용하기 위해 제목/본문/버튼 문구를 상태로 들고 있다.
  // 현재 상황이 "권한 필요"인지 "온디바이스 모델 없음"인지에 따라 값이 바뀐다.
  const [voicePermissionModalTitle, setVoicePermissionModalTitle] = useState('음성 인식 권한');
  const [voicePermissionModalDescription, setVoicePermissionModalDescription] = useState(
    '음성인식 기능을 위해 설정에서 음성 인식 권한을 허용해 주세요.'
  );
  const [voicePermissionModalConfirmText, setVoicePermissionModalConfirmText] = useState('설정 열기');
  const [voicePermissionModalCancelText, setVoicePermissionModalCancelText] = useState('닫기');
  // 확인 버튼이 "설정 열기" 역할인지, 단순 닫기 역할인지 분기한다.
  const [shouldOpenSettingsOnModalConfirm, setShouldOpenSettingsOnModalConfirm] = useState(true);
  // 권한 확인/설정 이동 과정에서 사용자에게 보여줄 에러 문구
  const [voicePermissionError, setVoicePermissionError] = useState('');
  // OS 마이크 권한 요청 직전 선택적 접근 안내 모달
  const [voiceMicPrimerModalVisible, setVoiceMicPrimerModalVisible] =
    useState(false);

  const showMicPrimerThen = useCallback((continueAsync: () => Promise<void>) => {
    micPrimerContinueRef.current = continueAsync;
    isVoiceMicPrimerOpenRef.current = true;
    setVoiceMicPrimerModalVisible(true);
  }, []);

  const closeVoiceMicPrimerModal = useCallback(() => {
    micPrimerContinueRef.current = null;
    isVoiceMicPrimerOpenRef.current = false;
    setVoiceMicPrimerModalVisible(false);
  }, []);

  const handleVoiceMicPrimerModalConfirm = useCallback(() => {
    const fn = micPrimerContinueRef.current;
    micPrimerContinueRef.current = null;
    isVoiceMicPrimerOpenRef.current = false;
    setVoiceMicPrimerModalVisible(false);
    if (fn) {
      Promise.resolve(fn()).catch(() => {
        /* toggle/sync 연속 처리 내부에서 대부분의 오류를 처리한다 */
      });
    }
  }, []);

  // 시스템 권한이 막혀 있을 때 보여줄 설정 이동 안내 모달 상태를 구성한다.
  const showVoicePermissionSettingsModal = useCallback(() => {
    setVoicePermissionModalTitle('음성 인식 권한');
    setVoicePermissionModalDescription('음성인식 기능을 위해 설정에서 음성 인식 권한을 허용해 주세요.');
    setVoicePermissionModalConfirmText('설정 열기');
    setVoicePermissionModalCancelText('닫기');
    setShouldOpenSettingsOnModalConfirm(true);
    setVoicePermissionModalVisible(true);
  }, []);

  // 권한은 있어도 ko-KR 온디바이스 모델이 없어서 기능 자체를 켤 수 없을 때 사용한다.
  const showVoiceUnavailableModal = useCallback(() => {
    setVoicePermissionModalTitle('음성 인식 사용 불가');
    setVoicePermissionModalDescription('음성 인식을 사용할 수 없습니다. 한국어 온디바이스 음성 인식 모델이 설치되어 있지 않거나, 이 앱이 사용하는 온디바이스 방식을 지원하지 않는 Android 버전·기기일 수 있습니다. Android 13 이상에서만 지원됩니다.');
    setVoicePermissionModalConfirmText('확인');
    setVoicePermissionModalCancelText('');
    setShouldOpenSettingsOnModalConfirm(false);
    setVoicePermissionModalVisible(true);
  }, []);

  // 모달을 닫을 때는 현재 표시 상태만 내리고, 권한/기능 상태는 건드리지 않는다.
  const closeVoicePermissionModal = useCallback(() => {
    setVoicePermissionModalVisible(false);
  }, []);

  // 같은 ConfirmModal을 공용 사용하므로 확인 버튼 동작도 모달 타입에 따라 나눈다.
  // 권한 모달이면 설정 앱으로 보내고, 사용 불가 모달이면 단순 확인 후 닫는다.
  const handleVoicePermissionModalConfirm = useCallback(() => {
    if (shouldOpenSettingsOnModalConfirm) {
      setVoicePermissionModalVisible(false);
      Linking.openSettings().catch(() => {
        setVoicePermissionError('설정 화면을 열 수 없습니다');
      });
      return;
    }

    setVoicePermissionModalVisible(false);
  }, [shouldOpenSettingsOnModalConfirm]);

  /**
   * Android에서 Google on-device recognition 서비스에
   * 요청한 locale 모델이 실제로 설치되어 있는지 확인한다.
   *
   * - iOS/기타 플랫폼은 현재 이 제약을 강제하지 않으므로 true
   * - on-device recognition 자체를 지원하지 않으면 false
   * - locale 목록 조회가 실패해도 "사용 불가"로 안전하게 처리하기 위해 false
   */
  const checkOnDeviceKoModelAvailability = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      if (!ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) {
        return false;
      }

      const supportedLocales =
        await ExpoSpeechRecognitionModule.getSupportedLocales({
          androidRecognitionServicePackage: ANDROID_ON_DEVICE_SERVICE,
        });

      const installedLocales = supportedLocales.installedLocales ?? [];
      const matchedInstalledLocale = hasMatchingOnDeviceLocale(
        installedLocales,
        REQUIRED_ON_DEVICE_LOCALE
      );
      const usedSupportedLocalesFallback =
        shouldTrustSupportedLocalesWhenInstalledLocalesEmpty(
          installedLocales,
          supportedLocales.locales ?? [],
          REQUIRED_ON_DEVICE_LOCALE
        );
      return matchedInstalledLocale || usedSupportedLocalesFallback;
    } catch {
      return false;
    }
  }, []);

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
    if (showModal) {
      showVoicePermissionSettingsModal();
    } else {
      setVoicePermissionModalVisible(false);
    }
    setVoicePermissionError('');
  }, [showVoicePermissionSettingsModal]);

  const applyUnavailableVoiceRecognition = useCallback((showModal: boolean) => {
    // OS 권한은 이미 허용된 상태이므로 granted를 유지해야,
    // 나중에 모델이 설치되어도 사용자가 끈 설정(false)이 임의로 true로 복원되지 않는다.
    setVoiceRecognitionPermissionStatusSetting('granted');
    setVoiceCommandsEnabledSetting(false);
    setVoiceCommandsEnabled(false);
    setVoicePermissionGranted(false);
    if (showModal) {
      showVoiceUnavailableModal();
    } else {
      setVoicePermissionModalVisible(false);
    }
    setVoicePermissionError('');
  }, [showVoiceUnavailableModal]);

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
    if (isVoiceMicPrimerOpenRef.current) {
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
        const isModelAvailable = await checkOnDeviceKoModelAvailability();

        if (!isModelAvailable) {
          applyUnavailableVoiceRecognition(getVoiceCommandsEnabledSetting());
          return;
        }

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

      showMicPrimerThen(async () => {
        isSyncingPermissionRef.current = true;
        try {
          const requestedPermission =
            await ExpoSpeechRecognitionModule.requestPermissionsAsync();

          if (requestedPermission.granted) {
            const isModelAvailable = await checkOnDeviceKoModelAvailability();

            if (!isModelAvailable) {
              applyUnavailableVoiceRecognition(true);
              return;
            }

            applyGrantedVoicePermission(true);
            return;
          }

          applyDeniedVoicePermission(true);
        } catch {
          setVoiceCommandsEnabled(false);
          setVoicePermissionGranted(false);
          showVoicePermissionSettingsModal();
          setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
        } finally {
          isSyncingPermissionRef.current = false;
        }
      });
      return;
    } catch {
      setVoiceCommandsEnabled(false);
      setVoicePermissionGranted(false);
      showVoicePermissionSettingsModal();
      setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
    } finally {
      isSyncingPermissionRef.current = false;
    }
  }, [
    applyDeniedVoicePermission,
    applyGrantedVoicePermission,
    applyUnavailableVoiceRecognition,
    checkOnDeviceKoModelAvailability,
    showMicPrimerThen,
    showVoicePermissionSettingsModal,
  ]);

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

  /**
   * 헤더의 음성 토글 버튼 처리.
   *
   * - 이미 켜져 있으면 즉시 OFF
   * - 실제 OS 권한이 이미 있으면 곧바로 모델 존재 여부까지 확인
   * - OS 차원에서 더 이상 권한 요청이 불가능하면 설정 이동 모달 노출
   * - 그 외에는 시스템 권한을 요청하고 결과에 따라 granted/denied 적용
   */
  const toggleVoiceCommands = useCallback(async () => {
    if (voiceCommandsEnabled) {
      setVoiceCommandsEnabledSetting(false);
      setVoiceCommandsEnabled(false);
      setVoicePermissionError('');
      return;
    }

    try {
      const currentPermission =
        await ExpoSpeechRecognitionModule.getPermissionsAsync();

      if (currentPermission.granted) {
        const isModelAvailable = await checkOnDeviceKoModelAvailability();

        if (!isModelAvailable) {
          applyUnavailableVoiceRecognition(true);
          return;
        }

        applyGrantedVoicePermission(true);
        return;
      }

      if (currentPermission.canAskAgain === false) {
        applyDeniedVoicePermission(true);
        return;
      }

      showMicPrimerThen(async () => {
        try {
          const granted = await requestVoicePermission();

          if (granted) {
            const isModelAvailable = await checkOnDeviceKoModelAvailability();

            if (!isModelAvailable) {
              applyUnavailableVoiceRecognition(true);
              return;
            }

            applyGrantedVoicePermission(true);
            return;
          }

          applyDeniedVoicePermission(true);
        } catch {
          setVoiceCommandsEnabledSetting(false);
          setVoiceCommandsEnabled(false);
          setVoicePermissionGranted(false);
          showVoicePermissionSettingsModal();
          setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
        }
      });
      return;
    } catch {
      setVoiceCommandsEnabledSetting(false);
      setVoiceCommandsEnabled(false);
      setVoicePermissionGranted(false);
      showVoicePermissionSettingsModal();
      setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
    }
  }, [
    applyDeniedVoicePermission,
    applyGrantedVoicePermission,
    applyUnavailableVoiceRecognition,
    checkOnDeviceKoModelAvailability,
    requestVoicePermission,
    showMicPrimerThen,
    showVoicePermissionSettingsModal,
    voiceCommandsEnabled,
  ]);

  return {
    // 사용자가 켰고, 실제 OS 권한도 있을 때만 "enabled"로 본다.
    isVoiceCommandsEnabled: voiceCommandsEnabled && voicePermissionGranted,
    // 실제 음성 인식 실행은 화면 포커스까지 만족할 때만 active다.
    isVoiceCommandsActive:
      isScreenFocused && voiceCommandsEnabled && voicePermissionGranted,
    voicePermissionModalVisible,
    voicePermissionModalTitle,
    voicePermissionModalDescription,
    voicePermissionModalConfirmText,
    voicePermissionModalCancelText,
    voicePermissionError,
    voiceMicPrimerModalVisible,
    closeVoicePermissionModal,
    handleVoicePermissionModalConfirm,
    closeVoiceMicPrimerModal,
    handleVoiceMicPrimerModalConfirm,
    toggleVoiceCommands,
  };
}
