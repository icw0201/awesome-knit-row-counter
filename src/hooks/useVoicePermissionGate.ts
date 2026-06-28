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

const MIN_ANDROID_ON_DEVICE_SPEECH_API_LEVEL = 33;
const ANDROID_ON_DEVICE_SERVICE = 'com.google.android.as';
const REQUIRED_ON_DEVICE_LOCALE = 'ko-KR';
const VOICE_PERMISSION_LOG_PREFIX = '[voice-permission-gate]';
const VOICE_PERMISSION_TIMEOUT_MS = 5000;
const VOICE_LOCALES_TIMEOUT_MS = 5000;

type VoiceDiagnosticCode =
  | 'VOICE_PERMISSION_TIMEOUT'
  | 'VOICE_PERMISSION_REQUEST_TIMEOUT'
  | 'VOICE_PERMISSION_CHECK_FAILED'
  | 'VOICE_PERMISSION_REQUEST_FAILED'
  | 'VOICE_ANDROID_API_UNSUPPORTED'
  | 'VOICE_ON_DEVICE_UNSUPPORTED'
  | 'VOICE_LOCALES_TIMEOUT'
  | 'VOICE_LOCALES_CHECK_FAILED'
  | 'VOICE_KO_LOCALE_UNAVAILABLE';

interface VoicePrerequisiteResult {
  canStart: boolean;
  diagnosticCode?: VoiceDiagnosticCode;
}

class VoiceDiagnosticError extends Error {
  diagnosticCode: VoiceDiagnosticCode;

  constructor(diagnosticCode: VoiceDiagnosticCode, message: string) {
    super(message);
    this.name = 'VoiceDiagnosticError';
    this.diagnosticCode = diagnosticCode;
  }
}

function logVoicePermissionGate(message: string, payload?: unknown) {
  if (!__DEV__) {
    return;
  }

  if (payload === undefined) {
    console.log(VOICE_PERMISSION_LOG_PREFIX, message);
    return;
  }

  console.log(VOICE_PERMISSION_LOG_PREFIX, message, payload);
}

function isVoiceDiagnosticError(error: unknown): error is VoiceDiagnosticError {
  return error instanceof VoiceDiagnosticError;
}

function appendDiagnosticCode(
  description: string,
  diagnosticCode?: VoiceDiagnosticCode
): string {
  if (!diagnosticCode) {
    return description;
  }

  return `${description}\n\n진단 코드: ${diagnosticCode}`;
}

function withVoiceTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  diagnosticCode: VoiceDiagnosticCode
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new VoiceDiagnosticError(
          diagnosticCode,
          `Voice recognition native call timed out: ${diagnosticCode}`
        )
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function normalizeLocaleTag(locale: string): string {
  return locale.trim().replace(/_/g, '-').toLowerCase();
}

function getLocaleLanguage(locale: string): string {
  return normalizeLocaleTag(locale).split('-')[0] ?? '';
}

function hasMatchingOnDeviceLocale(
  locales: string[],
  requiredLocale: string
): boolean {
  const normalizedRequiredLocale = normalizeLocaleTag(requiredLocale);
  const requiredLanguage = getLocaleLanguage(requiredLocale);

  return locales.some((locale) => {
    const normalizedLocale = normalizeLocaleTag(locale);

    if (normalizedLocale === normalizedRequiredLocale) {
      return true;
    }

    // 일부 Android 인식 서비스는 region 없이 "ko"만 돌려주거나 "_" 구분자를 사용한다.
    return getLocaleLanguage(normalizedLocale) === requiredLanguage;
  });
}

function getAndroidApiLevel(): number {
  const version = Platform.Version;

  if (typeof version === 'number') {
    return version;
  }

  return Number.parseInt(version, 10);
}

/**
 * 음성 인식 토글과 시스템 권한 상태를 함께 관리한다.
 *
 * 역할:
 * - 저장된 "음성 기능 사용 여부"와 실제 OS 권한 상태를 동기화
 * - 화면 포커스/앱 복귀 시 권한 상태 재확인
 * - 토글 ON 시 필요하면 시스템 권한 요청
 * - 영구 거절/온디바이스 미지원 상태에서는 안내 모달 노출
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
  // 권한 설정 안내 / 온디바이스 미지원 안내에 공용으로 사용하는 모달
  const [voicePermissionModalVisible, setVoicePermissionModalVisible] =
    useState(false);
  // 같은 ConfirmModal을 재사용하기 위해 제목/본문/버튼 문구를 상태로 들고 있다.
  // 현재 상황이 "권한 필요"인지 "온디바이스 미지원"인지에 따라 값이 바뀐다.
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
  const showVoicePermissionSettingsModal = useCallback((diagnosticCode?: VoiceDiagnosticCode) => {
    setVoicePermissionModalTitle('음성 인식 권한');
    setVoicePermissionModalDescription(
      appendDiagnosticCode(
        '음성인식 기능을 위해 설정에서 음성 인식 권한을 허용해 주세요.',
        diagnosticCode
      )
    );
    setVoicePermissionModalConfirmText('설정 열기');
    setVoicePermissionModalCancelText('닫기');
    setShouldOpenSettingsOnModalConfirm(true);
    setVoicePermissionModalVisible(true);
  }, []);

  // 권한은 있어도 한국어 온디바이스 인식을 지원하지 않아 기능 자체를 켤 수 없을 때 사용한다.
  const showVoiceUnavailableModal = useCallback((diagnosticCode?: VoiceDiagnosticCode) => {
    setVoicePermissionModalTitle('음성 인식 사용 불가');
    setVoicePermissionModalDescription(
      appendDiagnosticCode(
        '음성 인식을 사용할 수 없습니다. 한국어 온디바이스 음성 인식을 지원하지 않는 Android 버전·기기이거나, 필수 음성 인식 서비스가 비활성화된 상태일 수 있습니다. Android 13 이상에서만 지원됩니다.',
        diagnosticCode
      )
    );
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
   * Android 온디바이스 음성 인식을 시작할 수 있는 조건을 확인한다.
   *
   * - iOS/기타 플랫폼은 현재 이 제약을 강제하지 않으므로 true
   * - Android 13+에서만 온디바이스/continuous 인식 흐름을 허용한다.
   * - Google on-device recognition 서비스가 ko-KR을 지원하는지 확인한다.
   * - 모델이 아직 설치되지 않았더라도 지원 locale이면 true로 보고,
   *   실제 다운로드 안내는 음성 인식 시작 후 라이브러리 오류 흐름에서 처리한다.
   */
  const checkOnDeviceSpeechPrerequisites = useCallback(async (): Promise<VoicePrerequisiteResult> => {
    logVoicePermissionGate('prereq:start', {
      platform: Platform.OS,
      platformVersion: Platform.Version,
    });

    if (Platform.OS !== 'android') {
      logVoicePermissionGate('prereq:skip-non-android');
      return { canStart: true };
    }

    const androidApiLevel = getAndroidApiLevel();
    logVoicePermissionGate('prereq:android-api-level', androidApiLevel);

    if (androidApiLevel < MIN_ANDROID_ON_DEVICE_SPEECH_API_LEVEL) {
      const diagnosticCode = 'VOICE_ANDROID_API_UNSUPPORTED';
      logVoicePermissionGate('prereq:unsupported-api-level', diagnosticCode);
      return { canStart: false, diagnosticCode };
    }

    try {
      logVoicePermissionGate('prereq:before supportsOnDeviceRecognition');
      const supportsOnDeviceRecognition =
        ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      logVoicePermissionGate(
        'prereq:after supportsOnDeviceRecognition',
        supportsOnDeviceRecognition
      );

      if (!supportsOnDeviceRecognition) {
        const diagnosticCode = 'VOICE_ON_DEVICE_UNSUPPORTED';
        logVoicePermissionGate('prereq:on-device-unsupported', diagnosticCode);
        return { canStart: false, diagnosticCode };
      }

      logVoicePermissionGate('prereq:before getSupportedLocales', {
        androidRecognitionServicePackage: ANDROID_ON_DEVICE_SERVICE,
      });
      const supportedLocales =
        await withVoiceTimeout(
          ExpoSpeechRecognitionModule.getSupportedLocales({
            androidRecognitionServicePackage: ANDROID_ON_DEVICE_SERVICE,
          }),
          VOICE_LOCALES_TIMEOUT_MS,
          'VOICE_LOCALES_TIMEOUT'
        );
      logVoicePermissionGate('prereq:after getSupportedLocales', supportedLocales);

      const hasRequiredLocale = (
        hasMatchingOnDeviceLocale(
          supportedLocales.installedLocales ?? [],
          REQUIRED_ON_DEVICE_LOCALE
        )
        || hasMatchingOnDeviceLocale(
          supportedLocales.locales ?? [],
          REQUIRED_ON_DEVICE_LOCALE
        )
      );
      logVoicePermissionGate('prereq:result', hasRequiredLocale);

      if (!hasRequiredLocale) {
        return {
          canStart: false,
          diagnosticCode: 'VOICE_KO_LOCALE_UNAVAILABLE',
        };
      }

      return { canStart: true };
    } catch (error) {
      logVoicePermissionGate('prereq:error', error);
      return {
        canStart: false,
        diagnosticCode: isVoiceDiagnosticError(error)
          ? error.diagnosticCode
          : 'VOICE_LOCALES_CHECK_FAILED',
      };
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
  const applyDeniedVoicePermission = useCallback((
    showModal: boolean,
    diagnosticCode?: VoiceDiagnosticCode
  ) => {
    setVoiceRecognitionPermissionStatusSetting('denied');
    setVoiceCommandsEnabledSetting(false);
    setVoiceCommandsEnabled(false);
    setVoicePermissionGranted(false);
    if (showModal) {
      showVoicePermissionSettingsModal(diagnosticCode);
    } else {
      setVoicePermissionModalVisible(false);
    }
    setVoicePermissionError('');
  }, [showVoicePermissionSettingsModal]);

  const applyUnavailableVoiceRecognition = useCallback((
    showModal: boolean,
    diagnosticCode?: VoiceDiagnosticCode
  ) => {
    // OS 권한은 이미 허용된 상태이므로 granted를 유지해야,
    // 나중에 모델이 설치되어도 사용자가 끈 설정(false)이 임의로 true로 복원되지 않는다.
    setVoiceRecognitionPermissionStatusSetting('granted');
    setVoiceCommandsEnabledSetting(false);
    setVoiceCommandsEnabled(false);
    setVoicePermissionGranted(false);
    if (showModal) {
      showVoiceUnavailableModal(diagnosticCode);
    } else {
      setVoicePermissionModalVisible(false);
    }
    setVoicePermissionError('');
  }, [showVoiceUnavailableModal]);

  // 토글 ON 직전 시스템 권한을 확인하고, 아직 없으면 OS 권한 요청을 띄운다.
  const requestVoicePermission = useCallback(async (): Promise<boolean> => {
    logVoicePermissionGate('request-permission:before getPermissionsAsync');
    const currentPermission =
      await withVoiceTimeout(
        ExpoSpeechRecognitionModule.getPermissionsAsync(),
        VOICE_PERMISSION_TIMEOUT_MS,
        'VOICE_PERMISSION_TIMEOUT'
      );
    logVoicePermissionGate('request-permission:after getPermissionsAsync', currentPermission);

    if (currentPermission.granted) {
      logVoicePermissionGate('request-permission:already-granted');
      return true;
    }

    logVoicePermissionGate('request-permission:before requestPermissionsAsync');
    const requestedPermission =
      await withVoiceTimeout(
        ExpoSpeechRecognitionModule.requestPermissionsAsync(),
        VOICE_PERMISSION_TIMEOUT_MS,
        'VOICE_PERMISSION_REQUEST_TIMEOUT'
      );
    logVoicePermissionGate(
      'request-permission:after requestPermissionsAsync',
      requestedPermission
    );

    return requestedPermission.granted;
  }, []);

  /**
   * 저장된 권한 상태와 현재 OS 권한 상태를 비교해
   * 기능 ON/OFF, granted/denied, 모달 노출 상태를 다시 맞춘다.
   */
  const syncVoicePermission = useCallback(async () => {
    logVoicePermissionGate('sync:start');
    // 권한 팝업이 열리고 닫히는 동안 AppState 이벤트가 다시 들어올 수 있어
    // 동일한 권한 요청 흐름이 중복 실행되지 않도록 막는다.
    if (isSyncingPermissionRef.current) {
      logVoicePermissionGate('sync:skip-already-syncing');
      return;
    }
    if (isVoiceMicPrimerOpenRef.current) {
      logVoicePermissionGate('sync:skip-mic-primer-open');
      return;
    }

    isSyncingPermissionRef.current = true;
    const storedStatus = getVoiceRecognitionPermissionStatusSetting();
    logVoicePermissionGate('sync:stored-status', storedStatus);

    try {
      logVoicePermissionGate('sync:before getPermissionsAsync');
      const currentPermission =
        await withVoiceTimeout(
          ExpoSpeechRecognitionModule.getPermissionsAsync(),
          VOICE_PERMISSION_TIMEOUT_MS,
          'VOICE_PERMISSION_TIMEOUT'
        );
      logVoicePermissionGate('sync:after getPermissionsAsync', currentPermission);

      // 이미 허용된 경우: 저장소에 남아 있던 enabled 여부를 기준으로 복원한다.
      // 단, 최초 허용 직후처럼 저장 상태가 없으면 기본값을 true로 둔다.
      if (currentPermission.granted) {
        logVoicePermissionGate('sync:permission-granted');
        logVoicePermissionGate('sync:before checkOnDeviceSpeechPrerequisites');
        const prerequisite = await checkOnDeviceSpeechPrerequisites();
        logVoicePermissionGate(
          'sync:after checkOnDeviceSpeechPrerequisites',
          prerequisite
        );

        if (!prerequisite.canStart) {
          logVoicePermissionGate('sync:apply-unavailable', {
            showModal: getVoiceCommandsEnabledSetting(),
            diagnosticCode: prerequisite.diagnosticCode,
          });
          applyUnavailableVoiceRecognition(
            getVoiceCommandsEnabledSetting(),
            prerequisite.diagnosticCode
          );
          return;
        }

        const shouldEnable = storedStatus === 'granted'
          ? getVoiceCommandsEnabledSetting()
          : true;
        logVoicePermissionGate('sync:apply-granted', shouldEnable);
        applyGrantedVoicePermission(shouldEnable);
        return;
      }

      // 이미 처리된 거절/권한 철회 상태에서는 화면 재진입만으로
      // 시스템 권한 요청 팝업을 다시 띄우지 않는다.
      if (storedStatus === 'granted' || storedStatus === 'denied') {
        logVoicePermissionGate('sync:apply-denied-without-modal');
        applyDeniedVoicePermission(false);
        return;
      }

      // 더 이상 canAskAgain이 불가능하면 설정 앱 이동만 남는다.
      if (currentPermission.canAskAgain === false) {
        logVoicePermissionGate('sync:apply-denied-with-modal');
        applyDeniedVoicePermission(true);
        return;
      }

      logVoicePermissionGate('sync:show-mic-primer');
      showMicPrimerThen(async () => {
        logVoicePermissionGate('sync-primer:continue');
        isSyncingPermissionRef.current = true;
        try {
          logVoicePermissionGate('sync-primer:before requestPermissionsAsync');
          const requestedPermission =
            await withVoiceTimeout(
              ExpoSpeechRecognitionModule.requestPermissionsAsync(),
              VOICE_PERMISSION_TIMEOUT_MS,
              'VOICE_PERMISSION_REQUEST_TIMEOUT'
            );
          logVoicePermissionGate(
            'sync-primer:after requestPermissionsAsync',
            requestedPermission
          );

          if (requestedPermission.granted) {
            logVoicePermissionGate('sync-primer:permission-granted');
            logVoicePermissionGate('sync-primer:before checkOnDeviceSpeechPrerequisites');
            const prerequisite = await checkOnDeviceSpeechPrerequisites();
            logVoicePermissionGate(
              'sync-primer:after checkOnDeviceSpeechPrerequisites',
              prerequisite
            );

            if (!prerequisite.canStart) {
              logVoicePermissionGate(
                'sync-primer:apply-unavailable',
                prerequisite.diagnosticCode
              );
              applyUnavailableVoiceRecognition(true, prerequisite.diagnosticCode);
              return;
            }

            logVoicePermissionGate('sync-primer:apply-granted');
            applyGrantedVoicePermission(true);
            return;
          }

          logVoicePermissionGate('sync-primer:apply-denied');
          applyDeniedVoicePermission(true);
        } catch (error) {
          const diagnosticCode = isVoiceDiagnosticError(error)
            ? error.diagnosticCode
            : 'VOICE_PERMISSION_REQUEST_FAILED';
          logVoicePermissionGate('sync-primer:error', {
            error,
            diagnosticCode,
          });
          setVoiceCommandsEnabledSetting(false);
          setVoiceCommandsEnabled(false);
          setVoicePermissionGranted(false);
          showVoicePermissionSettingsModal(diagnosticCode);
          setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
        } finally {
          isSyncingPermissionRef.current = false;
        }
      });
      return;
    } catch (error) {
      const diagnosticCode = isVoiceDiagnosticError(error)
        ? error.diagnosticCode
        : 'VOICE_PERMISSION_CHECK_FAILED';
      logVoicePermissionGate('sync:error', {
        error,
        diagnosticCode,
      });
      setVoiceCommandsEnabledSetting(false);
      setVoiceCommandsEnabled(false);
      setVoicePermissionGranted(false);
      showVoicePermissionSettingsModal(diagnosticCode);
      setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
    } finally {
      isSyncingPermissionRef.current = false;
    }
  }, [
    applyDeniedVoicePermission,
    applyGrantedVoicePermission,
    applyUnavailableVoiceRecognition,
    checkOnDeviceSpeechPrerequisites,
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
   * - 실제 OS 권한이 이미 있으면 곧바로 온디바이스 음성 최소 OS 조건까지 확인
   * - OS 차원에서 더 이상 권한 요청이 불가능하면 설정 이동 모달 노출
   * - 그 외에는 시스템 권한을 요청하고 결과에 따라 granted/denied 적용
   */
  const toggleVoiceCommands = useCallback(async () => {
    const voiceCommandsActuallyEnabled = voiceCommandsEnabled && voicePermissionGranted;
    logVoicePermissionGate('toggle:start', {
      voiceCommandsEnabled,
      voicePermissionGranted,
      voiceCommandsActuallyEnabled,
    });
    if (voiceCommandsActuallyEnabled) {
      logVoicePermissionGate('toggle:disable');
      setVoiceCommandsEnabledSetting(false);
      setVoiceCommandsEnabled(false);
      setVoicePermissionError('');
      return;
    }

    try {
      logVoicePermissionGate('toggle:before getPermissionsAsync');
      const currentPermission =
        await withVoiceTimeout(
          ExpoSpeechRecognitionModule.getPermissionsAsync(),
          VOICE_PERMISSION_TIMEOUT_MS,
          'VOICE_PERMISSION_TIMEOUT'
        );
      logVoicePermissionGate('toggle:after getPermissionsAsync', currentPermission);

      if (currentPermission.granted) {
        logVoicePermissionGate('toggle:permission-granted');
        logVoicePermissionGate('toggle:before checkOnDeviceSpeechPrerequisites');
        const prerequisite = await checkOnDeviceSpeechPrerequisites();
        logVoicePermissionGate(
          'toggle:after checkOnDeviceSpeechPrerequisites',
          prerequisite
        );

        if (!prerequisite.canStart) {
          logVoicePermissionGate('toggle:apply-unavailable', prerequisite.diagnosticCode);
          applyUnavailableVoiceRecognition(true, prerequisite.diagnosticCode);
          return;
        }

        logVoicePermissionGate('toggle:apply-granted');
        applyGrantedVoicePermission(true);
        return;
      }

      if (currentPermission.canAskAgain === false) {
        logVoicePermissionGate('toggle:apply-denied-with-modal');
        applyDeniedVoicePermission(true);
        return;
      }

      logVoicePermissionGate('toggle:show-mic-primer');
      showMicPrimerThen(async () => {
        logVoicePermissionGate('toggle-primer:continue');
        try {
          logVoicePermissionGate('toggle-primer:before requestVoicePermission');
          const granted = await requestVoicePermission();
          logVoicePermissionGate('toggle-primer:after requestVoicePermission', granted);

          if (granted) {
            logVoicePermissionGate('toggle-primer:before checkOnDeviceSpeechPrerequisites');
            const prerequisite = await checkOnDeviceSpeechPrerequisites();
            logVoicePermissionGate(
              'toggle-primer:after checkOnDeviceSpeechPrerequisites',
              prerequisite
            );

            if (!prerequisite.canStart) {
              logVoicePermissionGate(
                'toggle-primer:apply-unavailable',
                prerequisite.diagnosticCode
              );
              applyUnavailableVoiceRecognition(true, prerequisite.diagnosticCode);
              return;
            }

            logVoicePermissionGate('toggle-primer:apply-granted');
            applyGrantedVoicePermission(true);
            return;
          }

          logVoicePermissionGate('toggle-primer:apply-denied');
          applyDeniedVoicePermission(true);
        } catch (error) {
          const diagnosticCode = isVoiceDiagnosticError(error)
            ? error.diagnosticCode
            : 'VOICE_PERMISSION_REQUEST_FAILED';
          logVoicePermissionGate('toggle-primer:error', {
            error,
            diagnosticCode,
          });
          setVoiceCommandsEnabledSetting(false);
          setVoiceCommandsEnabled(false);
          setVoicePermissionGranted(false);
          showVoicePermissionSettingsModal(diagnosticCode);
          setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
        }
      });
      return;
    } catch (error) {
      const diagnosticCode = isVoiceDiagnosticError(error)
        ? error.diagnosticCode
        : 'VOICE_PERMISSION_CHECK_FAILED';
      logVoicePermissionGate('toggle:error', {
        error,
        diagnosticCode,
      });
      setVoiceCommandsEnabledSetting(false);
      setVoiceCommandsEnabled(false);
      setVoicePermissionGranted(false);
      showVoicePermissionSettingsModal(diagnosticCode);
      setVoicePermissionError('음성 인식 권한을 확인할 수 없습니다');
    }
  }, [
    applyDeniedVoicePermission,
    applyGrantedVoicePermission,
    applyUnavailableVoiceRecognition,
    checkOnDeviceSpeechPrerequisites,
    requestVoicePermission,
    showMicPrimerThen,
    showVoicePermissionSettingsModal,
    voiceCommandsEnabled,
    voicePermissionGranted,
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
