// src/hooks/useVoiceCommands.ts

import { useEffect, useRef } from 'react';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

const LOCALE = 'ko-KR';
const KEYWORDS_ADD = ['곤지', '군지', '건지'];
const KEYWORDS_SUBTRACT = ['연지', '현지', '연기'];
const KEYWORD_SET_ADD = new Set(KEYWORDS_ADD);
const KEYWORD_SET_SUBTRACT = new Set(KEYWORDS_SUBTRACT);
const ANDROID_ON_DEVICE_SERVICE = 'com.google.android.as';
const DEBUG_TAG = '[useVoiceCommands]';
const DEFAULT_RESTART_DELAY_MS = 1200;
const BUSY_RESTART_DELAY_MS = 8000;
const IDLE_RECYCLE_MS = 30000;
const IDLE_RESTART_DELAY_MS = 1500;
const START_WATCHDOG_MS = 5000;

const ERROR_MESSAGES: Record<string, string> = {
  aborted: '음성 인식이 중단되었습니다',
  'audio-capture': '마이크를 사용할 수 없습니다',
  interrupted: '음성 인식이 중단되었습니다',
  'language-not-supported': '지원하지 않는 언어입니다',
  network: '네트워크 오류가 발생했습니다',
  'no-speech': '음성이 감지되지 않았습니다',
  'not-allowed': '마이크 권한이 필요합니다',
  'service-not-allowed': '음성 인식을 사용할 수 없습니다',
  busy: '음성 인식 서비스를 사용할 수 없어 다시 시도합니다',
  client: '음성 인식 클라이언트 오류가 발생했습니다',
  'speech-timeout': '음성 입력 시간이 초과되었습니다',
  unknown: '알 수 없는 오류가 발생했습니다',
};

function getErrorMessage(event: { error: string; message?: string }): string {
  const msg = event.message?.trim();
  if (msg) {
    return msg;
  }
  return ERROR_MESSAGES[event.error] ?? event.error ?? 'Unknown error';
}

function normalizeTranscriptWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^0-9a-zA-Z가-힣\s]+/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function getCommonPrefixLength(previousWords: string[], nextWords: string[]): number {
  const maxLength = Math.min(previousWords.length, nextWords.length);
  let index = 0;

  while (index < maxLength && previousWords[index] === nextWords[index]) {
    index += 1;
  }

  return index;
}

function getWordAction(word: string): 'add' | 'subtract' | null {
  if (KEYWORD_SET_ADD.has(word)) {
    return 'add';
  }

  if (KEYWORD_SET_SUBTRACT.has(word)) {
    return 'subtract';
  }

  return null;
}

/**
 * 화면 포커스 중 음성으로 "증가" / "감소" 계열 명령을 인식해 콜백을 호출하는 훅.
 * 버튼 없이 계속 듣다가 키워드가 들리면 동작한다.
 */
export function useVoiceCommands(
  enabled: boolean,
  onAdd: () => void,
  onSubtract: () => void,
  onRecognized?: (text: string) => void,
  onError?: (message: string) => void
) {
  const onAddRef = useRef(onAdd);
  const onSubtractRef = useRef(onSubtract);
  const onRecognizedRef = useRef(onRecognized);
  const onErrorRef = useRef(onError);
  const enabledRef = useRef(enabled);

  onAddRef.current = onAdd;
  onSubtractRef.current = onSubtract;
  onRecognizedRef.current = onRecognized;
  onErrorRef.current = onError;
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let restartTimeout: ReturnType<typeof setTimeout> | null = null;
    let startWatchdogTimeout: ReturnType<typeof setTimeout> | null = null;
    let idleRecycleTimeout: ReturnType<typeof setTimeout> | null = null;
    let isStarting = false;
    let isRecognizing = false;
    let ignoreNextAbortedError = false;
    let ignoreNextNoSpeechError = false;
    let nextRestartDelayMs = DEFAULT_RESTART_DELAY_MS;
    let lastActivityAt = Date.now();
    let lastTranscriptWords: string[] = [];

    const logState = (message: string, extra?: Record<string, unknown>) => {
      if (!__DEV__) {
        return;
      }

      const snapshot = {
        enabled: enabledRef.current,
        cancelled,
        isStarting,
        isRecognizing,
        nextRestartDelayMs,
        lastActivityAgoMs: Date.now() - lastActivityAt,
        ...extra,
      };
      console.log(`${DEBUG_TAG} ${message} ${JSON.stringify(snapshot)}`);
    };

    const resetTranscriptTracking = () => {
      lastTranscriptWords = [];
    };

    const runActionsFromTranscript = (text: string) => {
      const nextWords = normalizeTranscriptWords(text);
      const commonPrefixLength = getCommonPrefixLength(lastTranscriptWords, nextWords);
      const newWords = nextWords.slice(commonPrefixLength);

      if (__DEV__ && commonPrefixLength < lastTranscriptWords.length) {
        logState('transcript revised', {
          previousWords: lastTranscriptWords,
          nextWords,
          commonPrefixLength,
        });
      }

      lastTranscriptWords = nextWords;

      newWords.forEach((word) => {
        const action = getWordAction(word);
        if (action === 'add') {
          onAddRef.current();
          return;
        }

        if (action === 'subtract') {
          onSubtractRef.current();
        }
      });
    };

    const clearRestartTimeout = () => {
      if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
      }
    };

    const clearStartWatchdog = () => {
      if (startWatchdogTimeout) {
        clearTimeout(startWatchdogTimeout);
        startWatchdogTimeout = null;
      }
    };

    const clearIdleRecycleTimeout = () => {
      if (idleRecycleTimeout) {
        clearTimeout(idleRecycleTimeout);
        idleRecycleTimeout = null;
      }
    };

    const clearAllTimeouts = () => {
      clearRestartTimeout();
      clearStartWatchdog();
      clearIdleRecycleTimeout();
    };

    const touchActivity = (source: string) => {
      lastActivityAt = Date.now();
      logState('activity', { source });
      scheduleIdleRecycle();
    };

    const probeRecognitionEnvironment = async () => {
      try {
        const availableServices =
          ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
        const defaultService =
          ExpoSpeechRecognitionModule.getDefaultRecognitionService();
        const supportsOnDeviceRecognition =
          ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();

        logState('recognition environment', {
          availableServices,
          defaultServicePackage: defaultService.packageName,
          supportsOnDeviceRecognition,
        });

        if (!supportsOnDeviceRecognition) {
          return;
        }

        try {
          const supportedLocales =
            await ExpoSpeechRecognitionModule.getSupportedLocales({
              androidRecognitionServicePackage: ANDROID_ON_DEVICE_SERVICE,
            });

          const installedLocales = supportedLocales.installedLocales ?? [];
          const hasTargetLocaleInstalled = installedLocales.some(
            (locale) => locale.toLowerCase() === LOCALE.toLowerCase()
          );

          logState('on-device locale environment', {
            onDeviceServicePackage: ANDROID_ON_DEVICE_SERVICE,
            hasTargetLocaleInstalled,
            installedLocales,
            supportedLocaleCount: supportedLocales.locales.length,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          logState('getSupportedLocales failed', {
            onDeviceServicePackage: ANDROID_ON_DEVICE_SERVICE,
            error: message,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logState('recognition environment probe failed', {
          error: message,
        });
      }
    };

    const scheduleIdleRecycle = () => {
      clearIdleRecycleTimeout();
      if (cancelled || !enabledRef.current || isStarting || !isRecognizing) {
        return;
      }

      idleRecycleTimeout = setTimeout(() => {
        idleRecycleTimeout = null;
        if (cancelled || !enabledRef.current || isStarting || !isRecognizing) {
          return;
        }

        const idleForMs = Date.now() - lastActivityAt;
        if (idleForMs < IDLE_RECYCLE_MS) {
          scheduleIdleRecycle();
          return;
        }

        ignoreNextNoSpeechError = true;
        nextRestartDelayMs = IDLE_RESTART_DELAY_MS;
        isRecognizing = false;
        onRecognizedRef.current?.('오랫동안 입력이 없어 음성 인식을 새로 시작합니다...');
        logState('idle recycle via stop()', { idleForMs });
        ExpoSpeechRecognitionModule.stop();
      }, IDLE_RECYCLE_MS);
    };

    const scheduleRestart = (delayMs = DEFAULT_RESTART_DELAY_MS) => {
      clearRestartTimeout();
      if (cancelled || !enabledRef.current) {
        return;
      }

      logState('scheduleRestart', { delayMs });

      restartTimeout = setTimeout(() => {
        restartTimeout = null;
        if (cancelled || !enabledRef.current) {
          return;
        }
        startListening();
      }, delayMs);
    };

    const startListening = async () => {
      if (!enabledRef.current || cancelled || isStarting || isRecognizing) {
        logState('startListening skipped', {
          reason: !enabledRef.current
            ? 'disabled'
            : cancelled
              ? 'cancelled'
              : isStarting
                ? 'already-starting'
                : 'already-recognizing',
        });
        return;
      }

      isStarting = true;
      resetTranscriptTracking();
      clearAllTimeouts();
      onErrorRef.current?.('');
      onRecognizedRef.current?.('마이크 준비 중...');
      logState('startListening begin');

      try {
        const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (cancelled || !enabledRef.current) {
          isStarting = false;
          return;
        }

        if (!permissions.granted) {
          isStarting = false;
          onErrorRef.current?.('마이크 권한이 필요합니다');
          return;
        }

        if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
          isStarting = false;
          onErrorRef.current?.('음성 인식을 사용할 수 없습니다');
          return;
        }

        const state = await ExpoSpeechRecognitionModule.getStateAsync().catch(
          () => 'inactive' as const
        );
        logState('pre-start recognizer state', { nativeState: state });

        if (cancelled || !enabledRef.current) {
          isStarting = false;
          return;
        }

        if (state !== 'inactive') {
          isStarting = false;
          nextRestartDelayMs =
            state === 'stopping' ? BUSY_RESTART_DELAY_MS : DEFAULT_RESTART_DELAY_MS;

          if (state === 'stopping') {
            onRecognizedRef.current?.('이전 음성 인식이 완전히 종료되길 기다리는 중...');
            logState('recognizer already stopping, waiting for end event', {
              nativeState: state,
            });
            scheduleRestart(BUSY_RESTART_DELAY_MS);
            return;
          }

          ignoreNextAbortedError = true;
          onRecognizedRef.current?.('이전 음성 인식 세션을 정리하는 중...');
          logState('closing stale in-app recognizer before restart', {
            nativeState: state,
          });
          ExpoSpeechRecognitionModule.abort();
          return;
        }

        logState('calling ExpoSpeechRecognitionModule.start', {
          keywords: [...KEYWORDS_ADD, ...KEYWORDS_SUBTRACT],
        });
        ExpoSpeechRecognitionModule.start({
          lang: LOCALE,
          interimResults: true,
          continuous: true,
          maxAlternatives: 1,
          requiresOnDeviceRecognition: true,
          androidRecognitionServicePackage: ANDROID_ON_DEVICE_SERVICE,
          contextualStrings: [...KEYWORDS_ADD, ...KEYWORDS_SUBTRACT],
          androidIntentOptions: {
            EXTRA_LANGUAGE_MODEL: 'web_search',
          },
        });

        startWatchdogTimeout = setTimeout(() => {
          if (cancelled || !enabledRef.current || !isStarting || isRecognizing) {
            return;
          }

          isStarting = false;
          ignoreNextAbortedError = true;
          onRecognizedRef.current?.('음성 인식을 다시 시작하는 중...');
          logState('start watchdog fired, aborting stalled start');
          ExpoSpeechRecognitionModule.abort();
        }, START_WATCHDOG_MS);
      } catch (err) {
        isStarting = false;
        clearStartWatchdog();
        if (cancelled) {
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        onErrorRef.current?.(msg || '음성 인식을 시작하지 못했습니다');
        logState('startListening failed', {
          error: msg || '음성 인식을 시작하지 못했습니다',
        });
        nextRestartDelayMs = DEFAULT_RESTART_DELAY_MS;
        scheduleRestart(DEFAULT_RESTART_DELAY_MS);
      }
    };

    const startSubscription = ExpoSpeechRecognitionModule.addListener(
      'start',
      () => {
        if (cancelled || !enabledRef.current) {
          return;
        }

        isStarting = false;
        isRecognizing = true;
        clearStartWatchdog();
        onErrorRef.current?.('');
        onRecognizedRef.current?.('듣는 중...');
        logState('event:start');
        touchActivity('start');
      }
    );

    const speechStartSubscription = ExpoSpeechRecognitionModule.addListener(
      'speechstart',
      () => {
        if (!enabledRef.current || cancelled) {
          return;
        }

        logState('event:speechstart');
        touchActivity('speechstart');
      }
    );

    const resultSubscription = ExpoSpeechRecognitionModule.addListener(
      'result',
      (event) => {
        if (!enabledRef.current || cancelled) {
          return;
        }

        isStarting = false;
        isRecognizing = true;
        clearStartWatchdog();
        const transcript = event.results[0]?.transcript ?? '';
        if (transcript) {
          logState('event:result', {
            transcript,
            isFinal: event.isFinal,
          });
          touchActivity(event.isFinal ? 'result-final' : 'result-partial');
          onRecognizedRef.current?.(transcript);
          onErrorRef.current?.('');
          runActionsFromTranscript(transcript);
        }
      }
    );

    const errorSubscription = ExpoSpeechRecognitionModule.addListener(
      'error',
      async (event) => {
        clearStartWatchdog();
        isStarting = false;
        isRecognizing = false;

        logState('event:error', {
          error: event.error,
          message: event.message,
          code: (event as { code?: string | number }).code,
        });

        const isIgnoredNoSpeech = event.error === 'no-speech' && ignoreNextNoSpeechError;
        if (isIgnoredNoSpeech) {
          ignoreNextNoSpeechError = false;
          onErrorRef.current?.('');
          logState('ignored internal no-speech event', {
            preservedRestartDelayMs: nextRestartDelayMs,
          });
          return;
        }

        const isIgnoredAbort = event.error === 'aborted' && ignoreNextAbortedError;
        if (isIgnoredAbort) {
          ignoreNextAbortedError = false;
          logState('ignored internal aborted event', {
            preservedRestartDelayMs: nextRestartDelayMs,
          });
          return;
        }

        const msg = getErrorMessage(event);
        onErrorRef.current?.(msg);
        if (!enabledRef.current || cancelled) {
          return;
        }

        const isBusy = event.error === 'busy' || event.error === 'network';
        if (isBusy) {
          const state = await ExpoSpeechRecognitionModule.getStateAsync().catch(
            () => 'inactive' as const
          );
          logState('busy/network error current recognizer state', {
            nativeState: state,
          });

          if (state !== 'inactive') {
            nextRestartDelayMs = BUSY_RESTART_DELAY_MS;

            if (state === 'stopping') {
              onRecognizedRef.current?.('음성 인식 서비스가 완전히 종료되길 기다리는 중...');
              logState('busy/network while recognizer is stopping, waiting', {
                nativeState: state,
              });
              return;
            }

            ignoreNextAbortedError = true;
            onRecognizedRef.current?.('멈춘 음성 인식 세션을 정리하는 중...');
            logState('busy/network caused in-app abort', {
              nativeState: state,
            });
            ExpoSpeechRecognitionModule.abort();
            return;
          }
        }

        nextRestartDelayMs = isBusy ? BUSY_RESTART_DELAY_MS : DEFAULT_RESTART_DELAY_MS;
      }
    );

    const endSubscription = ExpoSpeechRecognitionModule.addListener(
      'end',
      () => {
        clearStartWatchdog();
        clearIdleRecycleTimeout();
        resetTranscriptTracking();
        isStarting = false;
        isRecognizing = false;
        logState('event:end');

        if (enabledRef.current && !cancelled) {
          const delayMs = nextRestartDelayMs;
          nextRestartDelayMs = DEFAULT_RESTART_DELAY_MS;
          scheduleRestart(delayMs);
        }
      }
    );

    probeRecognitionEnvironment();
    startListening();

    return () => {
      cancelled = true;
      ignoreNextAbortedError = true;
      resetTranscriptTracking();
      clearAllTimeouts();
      logState('cleanup abort');
      startSubscription.remove();
      speechStartSubscription.remove();
      resultSubscription.remove();
      errorSubscription.remove();
      endSubscription.remove();
      ExpoSpeechRecognitionModule.abort();
    };
  }, [enabled]);
}
