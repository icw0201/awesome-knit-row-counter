// src/hooks/useVoiceCommands.ts

import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type { EffectiveVoiceCommandSetting } from '@storage/settings';

const LOCALE = 'ko-KR';
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
// 세션 경계·지연 final 등으로 같은 키워드가 짧은 간격에 두 번 오는 경우 1회만 실행한다.
const KEYWORD_ACTION_DEDUP_MS = 400;
export const VOICE_LISTENING_TEXT = '듣는 중...';
const MODEL_NOT_DOWNLOADED_MESSAGE_FRAGMENT =
  'requested language is supported, but not yet downloaded';
const OFFLINE_MODEL_REQUIRED_MESSAGE =
  '한국어 온디바이스 음성 모델 다운로드가 필요합니다. 시스템 안내를 완료한 뒤 다시 시도해 주세요.';

type VoiceCommandKeywordConfig = Pick<
  EffectiveVoiceCommandSetting,
  'addKeywords' | 'subtractKeywords' | 'subAddKeywords' | 'subSubtractKeywords'
>;

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

function isOfflineModelDownloadRequiredError(event: {
  error: string;
  message?: string;
}): boolean {
  return event.message?.trim().toLowerCase().includes(MODEL_NOT_DOWNLOADED_MESSAGE_FRAGMENT) ?? false;
}

function getErrorMessage(event: { error: string; message?: string }): string {
  if (isOfflineModelDownloadRequiredError(event)) {
    return OFFLINE_MODEL_REQUIRED_MESSAGE;
  }

  const msg = event.message?.trim();
  if (msg?.toLowerCase().includes('server disconnect')) {
    return ERROR_MESSAGES['server-disconnect'];
  }
  if (msg) {
    return msg;
  }
  return ERROR_MESSAGES[event.error] ?? event.error ?? 'Unknown error';
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
    return (
      normalizedLocale === normalizedRequiredLocale ||
      getLocaleLanguage(normalizedLocale) === requiredLanguage
    );
  });
}

async function checkAndroidOfflineModelAvailability(): Promise<boolean> {
  try {
    const supportedLocales = await ExpoSpeechRecognitionModule.getSupportedLocales({
      androidRecognitionServicePackage: ANDROID_ON_DEVICE_SERVICE,
    });
    const installedLocales = supportedLocales.installedLocales ?? [];

    if (hasMatchingOnDeviceLocale(installedLocales, LOCALE)) {
      return true;
    }

    return (
      installedLocales.length === 0 &&
      hasMatchingOnDeviceLocale(supportedLocales.locales ?? [], LOCALE)
    );
  } catch {
    return false;
  }
}

function normalizeTranscriptWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^0-9a-zA-Z가-힣\s]+/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

/** STT가 같은 토큰을 연속으로 넣을 때 1번만 남긴다(배너·newWords 처리용). */
function collapseConsecutiveDuplicateWords(words: string[]): string[] {
  return words.filter((w, i) => i === 0 || w !== words[i - 1]);
}

function getCommonPrefixLength(previousWords: string[], nextWords: string[]): number {
  const maxLength = Math.min(previousWords.length, nextWords.length);
  let index = 0;

  while (index < maxLength && previousWords[index] === nextWords[index]) {
    index += 1;
  }

  return index;
}

function getWordAction(
  word: string,
  keywordSets: {
    add: Set<string>;
    subtract: Set<string>;
    subAdd: Set<string>;
    subSubtract: Set<string>;
  }
): 'add' | 'subtract' | 'subAdd' | 'subSubtract' | null {
  if (keywordSets.add.has(word)) {
    return 'add';
  }

  if (keywordSets.subtract.has(word)) {
    return 'subtract';
  }

  if (keywordSets.subAdd.has(word)) {
    return 'subAdd';
  }

  if (keywordSets.subSubtract.has(word)) {
    return 'subSubtract';
  }

  return null;
}

/**
 * 같은 인덱스에서 STT가 "군지" → "건지"처럼 교정만 해도 접두어가 같다고 보기 위해,
 * 키워드 동작별로 하나의 토큰으로 치환한다. (실제 콜백에는 원문 단어를 그대로 넘긴다.)
 */
function canonicalizeKeywordForTranscriptDiff(
  word: string,
  keywordSets: {
    add: Set<string>;
    subtract: Set<string>;
    subAdd: Set<string>;
    subSubtract: Set<string>;
  }
): string {
  const action = getWordAction(word, keywordSets);
  if (action === 'add') {
    return '\0__kw_add__';
  }
  if (action === 'subtract') {
    return '\0__kw_subtract__';
  }
  if (action === 'subAdd') {
    return '\0__kw_subadd__';
  }
  if (action === 'subSubtract') {
    return '\0__kw_subsubtract__';
  }
  return word;
}

/**
 * 화면 포커스 중 음성으로 "증가" / "감소" 계열 명령을 인식해 콜백을 호출하는 훅.
 * 버튼 없이 계속 듣다가 키워드가 들리면 동작한다.
 */
export function useVoiceCommands(
  enabled: boolean,
  keywordConfig: VoiceCommandKeywordConfig,
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

    const keywordSets = {
      add: new Set(keywordConfig.addKeywords),
      subtract: new Set(keywordConfig.subtractKeywords),
      subAdd: new Set(keywordConfig.subAddKeywords),
      subSubtract: new Set(keywordConfig.subSubtractKeywords),
    };

    // recognition session의 로컬 런타임 상태.
    // React state로 두지 않고 effect 내부 변수로 관리해 네이티브 이벤트/타이머에서 즉시 읽는다.
    let cancelled = false;
    let restartTimeout: ReturnType<typeof setTimeout> | null = null;
    let startWatchdogTimeout: ReturnType<typeof setTimeout> | null = null;
    let idleRecycleTimeout: ReturnType<typeof setTimeout> | null = null;
    let offlineModelCheckTimeout: ReturnType<typeof setTimeout> | null = null;
    let isStarting = false;
    let isRecognizing = false;
    // 우리가 내부적으로 호출한 abort()/stop() 뒤에 따라오는 에러는 정상 흐름이므로 1회 무시한다.
    let ignoreNextAbortedError = false;
    let ignoreNextNoSpeechError = false;
    let nextRestartDelayMs = DEFAULT_RESTART_DELAY_MS;
    let lastActivityAt = Date.now();
    let isWaitingForOfflineModelDownload = false;
    // partial/final이 같은 접두어를 반복하면 새 단어만 액션으로 소비한다.
    // 리셋 타이밍은 아래 'start' 리스너를 본다(end에서 비우면 지연 final이 같은 말을 두 번 실행할 수 있다).
    let lastTranscriptWords: string[] = [];
    let lastKeywordDedupKey = '';
    let lastKeywordDedupAt = 0;

    const resetTranscriptTracking = () => {
      lastTranscriptWords = [];
    };

    const resetKeywordDedup = () => {
      lastKeywordDedupKey = '';
      lastKeywordDedupAt = 0;
    };

    const shouldSkipDuplicateKeywordAction = (action: string, word: string): boolean => {
      const key = `${action}:${word}`;
      const now = Date.now();
      if (key === lastKeywordDedupKey && now - lastKeywordDedupAt < KEYWORD_ACTION_DEDUP_MS) {
        return true;
      }
      lastKeywordDedupKey = key;
      lastKeywordDedupAt = now;
      return false;
    };

    // STT 엔진은 같은 문장을 partial -> final로 반복 전달하므로,
    // 이전 transcript와 공통 prefix를 비교해 "새 단어"만 액션으로 변환한다.
    // 같은 슬롯에서 "군지" → "건지"처럼 유사어 교정만 일어난 경우는
    // 동작이 같은 키워드면 접두어 길이에 포함해 한 번만 실행되게 한다.
    const runActionsFromTranscript = (text: string) => {
      const nextWords = normalizeTranscriptWords(text);
      const prevCanonical = lastTranscriptWords.map((word) =>
        canonicalizeKeywordForTranscriptDiff(word, keywordSets)
      );
      const nextCanonical = nextWords.map((word) =>
        canonicalizeKeywordForTranscriptDiff(word, keywordSets)
      );
      const commonPrefixLength = getCommonPrefixLength(prevCanonical, nextCanonical);
      let newWords = nextWords.slice(commonPrefixLength);

      const prevTail = lastTranscriptWords[lastTranscriptWords.length - 1];
      if (
        prevTail !== undefined &&
        newWords.length > 0 &&
        newWords.every((w) => w === prevTail)
      ) {
        lastTranscriptWords = nextWords;
        return;
      }

      newWords = collapseConsecutiveDuplicateWords(newWords);

      lastTranscriptWords = nextWords;
      newWords.forEach((word) => {
        const action = getWordAction(word, keywordSets);
        if (action === 'add') {
          if (!shouldSkipDuplicateKeywordAction(action, word)) {
            onAddRef.current(word);
          }
          return;
        }

        if (action === 'subtract') {
          if (!shouldSkipDuplicateKeywordAction(action, word)) {
            onSubtractRef.current(word);
          }
          return;
        }

        if (action === 'subAdd') {
          if (!shouldSkipDuplicateKeywordAction(action, word)) {
            onSubAddRef.current?.(word);
          }
          return;
        }

        if (action === 'subSubtract') {
          if (!shouldSkipDuplicateKeywordAction(action, word)) {
            onSubSubtractRef.current?.(word);
          }
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

    const clearOfflineModelCheckTimeout = () => {
      if (offlineModelCheckTimeout) {
        clearTimeout(offlineModelCheckTimeout);
        offlineModelCheckTimeout = null;
      }
    };

    const clearAllTimeouts = () => {
      clearRestartTimeout();
      clearStartWatchdog();
      clearIdleRecycleTimeout();
      clearOfflineModelCheckTimeout();
    };

    // 음성/이벤트 활동이 감지되면 idle recycle 기준 시각을 갱신한다.
    const touchActivity = (_source: string) => {
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

    const resumeAfterOfflineModelDownload = async () => {
      if (
        cancelled ||
        !enabledRef.current ||
        !isWaitingForOfflineModelDownload ||
        Platform.OS !== 'android'
      ) {
        return;
      }

      const isModelAvailable = await checkAndroidOfflineModelAvailability();
      if (
        cancelled ||
        !enabledRef.current ||
        !isWaitingForOfflineModelDownload
      ) {
        return;
      }

      if (!isModelAvailable) {
        onErrorRef.current?.(OFFLINE_MODEL_REQUIRED_MESSAGE);
        onRecognizedRef.current?.('한국어 음성 모델 다운로드가 필요합니다...');
        return;
      }

      isWaitingForOfflineModelDownload = false;
      nextRestartDelayMs = DEFAULT_RESTART_DELAY_MS;
      onErrorRef.current?.('');
      onRecognizedRef.current?.('모델 다운로드를 확인해 음성 인식을 다시 시작합니다...');
      scheduleRestart(200);
    };

    const scheduleOfflineModelAvailabilityCheck = (delayMs = 1500) => {
      clearOfflineModelCheckTimeout();
      if (
        cancelled ||
        !enabledRef.current ||
        !isWaitingForOfflineModelDownload ||
        Platform.OS !== 'android'
      ) {
        return;
      }

      offlineModelCheckTimeout = setTimeout(() => {
        offlineModelCheckTimeout = null;
        resumeAfterOfflineModelDownload().catch(() => {
          onErrorRef.current?.(OFFLINE_MODEL_REQUIRED_MESSAGE);
        });
      }, delayMs);
    };

    const scheduleRestart = (delayMs = DEFAULT_RESTART_DELAY_MS) => {
      clearRestartTimeout();
      if (cancelled || !enabledRef.current || isWaitingForOfflineModelDownload) {
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
      if (
        !enabledRef.current ||
        cancelled ||
        isStarting ||
        isRecognizing ||
        isWaitingForOfflineModelDownload
      ) {
        return;
      }

      isStarting = true;
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
            ...keywordConfig.addKeywords,
            ...keywordConfig.subtractKeywords,
            ...keywordConfig.subAddKeywords,
            ...keywordConfig.subSubtractKeywords,
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
        resetTranscriptTracking();
        resetKeywordDedup();
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
          touchActivity(event.isFinal ? 'result-final' : 'result-partial');
          onErrorRef.current?.('');
          const forDisplay = collapseConsecutiveDuplicateWords(
            normalizeTranscriptWords(transcript)
          ).join(' ');
          onRecognizedRef.current?.(forDisplay);
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

        if (Platform.OS === 'android' && isOfflineModelDownloadRequiredError(event)) {
          isWaitingForOfflineModelDownload = true;
          onErrorRef.current?.(OFFLINE_MODEL_REQUIRED_MESSAGE);
          onRecognizedRef.current?.('한국어 음성 모델 다운로드가 필요합니다...');
          ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({
            locale: LOCALE,
          })
            .then(() => {
              scheduleOfflineModelAvailabilityCheck();
            })
            .catch(() => {
              onErrorRef.current?.(OFFLINE_MODEL_REQUIRED_MESSAGE);
            });
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
        // transcript는 'start'에서만 리셋한다. 여기서 비우면 partial 직후 end·지연 final 조합에서 같은 말이 두 번 실행된다.
        isStarting = false;
        isRecognizing = false;

        if (enabledRef.current && !cancelled) {
          const delayMs = nextRestartDelayMs;
          nextRestartDelayMs = DEFAULT_RESTART_DELAY_MS;
          scheduleRestart(delayMs);
        }
      }
    );

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        resumeAfterOfflineModelDownload().catch(() => {
          onErrorRef.current?.(OFFLINE_MODEL_REQUIRED_MESSAGE);
        });
      }
    });

    startListening();

    return () => {
      cancelled = true;
      ignoreNextAbortedError = true;
      resetTranscriptTracking();
      resetKeywordDedup();
      clearAllTimeouts();
      // unmount/disable 시에는 현재 세션을 중단시키고,
      // 뒤따라오는 aborted 에러는 ignoreNextAbortedError로 무시한다.
      startSubscription.remove();
      speechStartSubscription.remove();
      resultSubscription.remove();
      errorSubscription.remove();
      endSubscription.remove();
      appStateSubscription.remove();
      ExpoSpeechRecognitionModule.abort();
    };
  }, [
    enabled,
    keywordConfig.addKeywords,
    keywordConfig.subtractKeywords,
    keywordConfig.subAddKeywords,
    keywordConfig.subSubtractKeywords,
  ]);
}
