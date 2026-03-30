// src/hooks/useVoiceCommands.ts

import { useEffect, useRef } from 'react';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

const LOCALE = 'ko-KR';
const KEYWORDS_ADD = ['곤지', '군지', '건지', '본지'];
const KEYWORDS_SUBTRACT = ['연지', '현지', '연기'];
const KEYWORDS_SUB_ADD = ['홍실', '홍신', '동실', '통실'];
const KEYWORDS_SUB_SUBTRACT = ['청실', '청신', '창실'];
const KEYWORD_SET_ADD = new Set(KEYWORDS_ADD);
const KEYWORD_SET_SUBTRACT = new Set(KEYWORDS_SUBTRACT);
const KEYWORD_SET_SUB_ADD = new Set(KEYWORDS_SUB_ADD);
const KEYWORD_SET_SUB_SUBTRACT = new Set(KEYWORDS_SUB_SUBTRACT);
const ANDROID_ON_DEVICE_SERVICE = 'com.google.android.as';
// 일반적인 end/error 이후 recognition을 다시 시작할 때 기본 대기 시간.
const DEFAULT_RESTART_DELAY_MS = 1200;
// recognizer가 busy/stopping 상태일 때는 더 길게 기다려 네이티브 세션 정리를 우선한다.
const BUSY_RESTART_DELAY_MS = 5000;
// 이 시간 동안 음성/이벤트 활동이 없으면 현재 세션을 재활용하지 않고 새로 연다.
const IDLE_RECYCLE_MS = 30000;
// idle recycle로 stop()한 뒤에는 기본 재시작보다 살짝 긴 딜레이로 다시 시작한다.
const IDLE_RESTART_DELAY_MS = 1500;
// start() 호출 후 이 시간 안에 start 이벤트가 없으면 시작이 멈춘 것으로 보고 abort()한다.
const START_WATCHDOG_MS = 5000;
export const VOICE_LISTENING_TEXT = '듣는 중...';

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
  'server-disconnect': '음성 인식 서버 연결이 끊어졌습니다. 잠시 후 다시 시도합니다.',
  unknown: '알 수 없는 오류가 발생했습니다',
};

function getErrorMessage(event: { error: string; message?: string }): string {
  const msg = event.message?.trim();
  if (msg?.toLowerCase().includes('server disconnect')) {
    return ERROR_MESSAGES['server-disconnect'];
  }
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

function getWordAction(word: string): 'add' | 'subtract' | 'subAdd' | 'subSubtract' | null {
  if (KEYWORD_SET_ADD.has(word)) {
    return 'add';
  }

  if (KEYWORD_SET_SUBTRACT.has(word)) {
    return 'subtract';
  }

  if (KEYWORD_SET_SUB_ADD.has(word)) {
    return 'subAdd';
  }

  if (KEYWORD_SET_SUB_SUBTRACT.has(word)) {
    return 'subSubtract';
  }

  return null;
}

/**
 * 화면 포커스 중 음성으로 "증가" / "감소" 계열 명령을 인식해 콜백을 호출하는 훅.
 * 버튼 없이 계속 듣다가 키워드가 들리면 동작한다.
 */
export function useVoiceCommands(
  enabled: boolean,
  onAdd: (commandWord?: string) => void,
  onSubtract: (commandWord?: string) => void,
  onSubAdd?: (commandWord?: string) => void,
  onSubSubtract?: (commandWord?: string) => void,
  onRecognized?: (text: string) => void,
  onError?: (message: string) => void
) {
  const onAddRef = useRef(onAdd);
  const onSubtractRef = useRef(onSubtract);
  const onSubAddRef = useRef(onSubAdd);
  const onSubSubtractRef = useRef(onSubSubtract);
  const onRecognizedRef = useRef(onRecognized);
  const onErrorRef = useRef(onError);
  const enabledRef = useRef(enabled);

  onAddRef.current = onAdd;
  onSubtractRef.current = onSubtract;
  onSubAddRef.current = onSubAdd;
  onSubSubtractRef.current = onSubSubtract;
  onRecognizedRef.current = onRecognized;
  onErrorRef.current = onError;
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // recognition session의 로컬 런타임 상태.
    // React state로 두지 않고 effect 내부 변수로 관리해 네이티브 이벤트/타이머에서 즉시 읽는다.
    let cancelled = false;
    let restartTimeout: ReturnType<typeof setTimeout> | null = null;
    let startWatchdogTimeout: ReturnType<typeof setTimeout> | null = null;
    let idleRecycleTimeout: ReturnType<typeof setTimeout> | null = null;
    let isStarting = false;
    let isRecognizing = false;
    // 우리가 내부적으로 호출한 abort()/stop() 뒤에 따라오는 에러는 정상 흐름이므로 1회 무시한다.
    let ignoreNextAbortedError = false;
    let ignoreNextNoSpeechError = false;
    let nextRestartDelayMs = DEFAULT_RESTART_DELAY_MS;
    let lastActivityAt = Date.now();
    // partial/final result가 같은 prefix를 반복 전달하므로, 새로 들어온 단어만 액션으로 소비한다.
    let lastTranscriptWords: string[] = [];

    const resetTranscriptTracking = () => {
      lastTranscriptWords = [];
    };

    // STT 엔진은 같은 문장을 partial -> final로 반복 전달하므로,
    // 이전 transcript와 공통 prefix를 비교해 "새 단어"만 액션으로 변환한다.
    const runActionsFromTranscript = (text: string) => {
      const nextWords = normalizeTranscriptWords(text);
      const commonPrefixLength = getCommonPrefixLength(lastTranscriptWords, nextWords);
      const newWords = nextWords.slice(commonPrefixLength);

      lastTranscriptWords = nextWords;
      newWords.forEach((word) => {
        const action = getWordAction(word);
        if (action === 'add') {
          onAddRef.current(word);
          return;
        }

        if (action === 'subtract') {
          onSubtractRef.current(word);
          return;
        }

        if (action === 'subAdd') {
          onSubAddRef.current?.(word);
          return;
        }

        if (action === 'subSubtract') {
          onSubSubtractRef.current?.(word);
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

    // 음성/이벤트 활동이 감지되면 idle recycle 기준 시각을 갱신한다.
    const touchActivity = (source: string) => {
      lastActivityAt = Date.now();
      scheduleIdleRecycle();
    };

    const scheduleIdleRecycle = () => {
      clearIdleRecycleTimeout();
      if (cancelled || !enabledRef.current || isStarting || !isRecognizing) {
        return;
      }

      // 긴 무음 상태가 이어지면 stop() 후 재시작해 on-device recognizer가
      // 조용히 멈춰 버리는 상황을 완화한다.
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
        ExpoSpeechRecognitionModule.stop();
      }, IDLE_RECYCLE_MS);
    };

    const scheduleRestart = (delayMs = DEFAULT_RESTART_DELAY_MS) => {
      clearRestartTimeout();
      if (cancelled || !enabledRef.current) {
        return;
      }

      restartTimeout = setTimeout(() => {
        restartTimeout = null;
        if (cancelled || !enabledRef.current) {
          return;
        }
        startListening();
      }, delayMs);
    };

    // recognition 시작 전 stale session 정리, watchdog 설정,
    // unavailable/busy 상황 분기를 한곳에서 처리한다.
    const startListening = async () => {
      if (!enabledRef.current || cancelled || isStarting || isRecognizing) {
        return;
      }

      isStarting = true;
      resetTranscriptTracking();
      clearAllTimeouts();
      onErrorRef.current?.('');
      onRecognizedRef.current?.('마이크 준비 중...');

      try {
        if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
          isStarting = false;
          onErrorRef.current?.('음성 인식을 사용할 수 없습니다');
          return;
        }

        const state = await ExpoSpeechRecognitionModule.getStateAsync().catch(
          () => 'inactive' as const
        );

        if (cancelled || !enabledRef.current) {
          isStarting = false;
          return;
        }

        if (state !== 'inactive') {
          isStarting = false;
          nextRestartDelayMs =
            state === 'stopping' ? BUSY_RESTART_DELAY_MS : DEFAULT_RESTART_DELAY_MS;

          // 이전 세션이 완전히 종료되지 않았으면 end 이벤트를 기다렸다가 다시 시도한다.
          if (state === 'stopping') {
            onRecognizedRef.current?.('이전 음성 인식이 완전히 종료되길 기다리는 중...');
            scheduleRestart(BUSY_RESTART_DELAY_MS);
            return;
          }

          ignoreNextAbortedError = true;
          onRecognizedRef.current?.('이전 음성 인식 세션을 정리하는 중...');
          ExpoSpeechRecognitionModule.abort();
          return;
        }

        ExpoSpeechRecognitionModule.start({
          lang: LOCALE,
          interimResults: true,
          continuous: true,
          maxAlternatives: 1,
          requiresOnDeviceRecognition: true,
          androidRecognitionServicePackage: ANDROID_ON_DEVICE_SERVICE,
          contextualStrings: [
            ...KEYWORDS_ADD,
            ...KEYWORDS_SUBTRACT,
            ...KEYWORDS_SUB_ADD,
            ...KEYWORDS_SUB_SUBTRACT,
          ],
          androidIntentOptions: {
            EXTRA_LANGUAGE_MODEL: 'web_search',
          },
        });

        // start 이벤트가 오지 않고 시작이 걸려 버리는 경우를 대비한 watchdog.
        startWatchdogTimeout = setTimeout(() => {
          if (cancelled || !enabledRef.current || !isStarting || isRecognizing) {
            return;
          }

          isStarting = false;
          ignoreNextAbortedError = true;
          onRecognizedRef.current?.('음성 인식을 다시 시작하는 중...');
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
        onRecognizedRef.current?.(VOICE_LISTENING_TEXT);
        touchActivity('start');
      }
    );

    const speechStartSubscription = ExpoSpeechRecognitionModule.addListener(
      'speechstart',
      () => {
        if (!enabledRef.current || cancelled) {
          return;
        }

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
          // partial/final 결과 모두 배너 표시에는 전달하되,
          // 실제 add/subtract 액션은 runActionsFromTranscript가 중복을 걸러낸다.
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

        // idle recycle에서 의도적으로 stop()한 뒤 따라오는 no-speech는 사용자 오류가 아니다.
        const isIgnoredNoSpeech = event.error === 'no-speech' && ignoreNextNoSpeechError;
        if (isIgnoredNoSpeech) {
          ignoreNextNoSpeechError = false;
          onErrorRef.current?.('');
          return;
        }

        // stale session 정리용 abort() 뒤에 따라오는 aborted도 내부 제어 흐름으로 본다.
        const isIgnoredAbort = event.error === 'aborted' && ignoreNextAbortedError;
        if (isIgnoredAbort) {
          ignoreNextAbortedError = false;
          return;
        }

        const msg = getErrorMessage(event);
        onErrorRef.current?.(msg);
        if (!enabledRef.current || cancelled) {
          return;
        }

        const isServerDisconnect = event.message
          ?.toLowerCase()
          .includes('server disconnect');
        const isBusy =
          event.error === 'busy' ||
          event.error === 'network' ||
          isServerDisconnect;
        if (isBusy) {
          // recognizer가 여전히 살아 있으면 abort()로 정리하고,
          // inactive면 end 이후 restart delay만 조정한다.
          const state = await ExpoSpeechRecognitionModule.getStateAsync().catch(
            () => 'inactive' as const
          );

          if (state !== 'inactive') {
            nextRestartDelayMs = BUSY_RESTART_DELAY_MS;

            if (state === 'stopping') {
              onRecognizedRef.current?.('음성 인식 서비스가 완전히 종료되길 기다리는 중...');
              return;
            }

            ignoreNextAbortedError = true;
            onRecognizedRef.current?.('멈춘 음성 인식 세션을 정리하는 중...');
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
        // 세션 경계가 바뀌면 transcript diff 기준도 함께 리셋한다.
        resetTranscriptTracking();
        isStarting = false;
        isRecognizing = false;

        if (enabledRef.current && !cancelled) {
          const delayMs = nextRestartDelayMs;
          nextRestartDelayMs = DEFAULT_RESTART_DELAY_MS;
          scheduleRestart(delayMs);
        }
      }
    );

    startListening();

    return () => {
      cancelled = true;
      ignoreNextAbortedError = true;
      resetTranscriptTracking();
      clearAllTimeouts();
      // unmount/disable 시에는 현재 세션을 중단시키고,
      // 뒤따라오는 aborted 에러는 ignoreNextAbortedError로 무시한다.
      startSubscription.remove();
      speechStartSubscription.remove();
      resultSubscription.remove();
      errorSubscription.remove();
      endSubscription.remove();
      ExpoSpeechRecognitionModule.abort();
    };
  }, [enabled]);
}
