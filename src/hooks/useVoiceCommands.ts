// src/hooks/useVoiceCommands.ts

import { useRef, useEffect } from 'react';
import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import Voice from '@react-native-voice/voice';

const LOCALE = 'ko-KR';
const KEYWORD_ADD = '더하기';
const KEYWORD_SUBTRACT = '빼기';

/** Android SpeechRecognizer 에러 코드 → 한글 설명 (일반적인 코드만) */
const ANDROID_SPEECH_ERROR_MESSAGES: Record<number, string> = {
  1: '네트워크 시간 초과',
  2: '네트워크 오류',
  5: '클라이언트 오류(언어 미지원 등)',
  6: '말이 감지되지 않아 시간 초과',
  7: '인식된 말이 없음 (조용히 다시 말해 보세요)',
  8: '인식기가 사용 중 (잠시 후 다시)',
  9: '마이크 권한이 없습니다',
  10: '오디오 녹음 오류',
  11: '서버/인식 오류 (네트워크·Google 음성 확인)',
  12: '지원하지 않는 언어',
  13: '선택한 언어 패키지가 없음',
};

function getSpeechErrorMessage(e: { error?: { code?: string | number; message?: string } | string | number }): string {
  const err = e?.error;
  if (err == null) return '알 수 없는 오류';
  if (typeof err === 'number') {
    return ANDROID_SPEECH_ERROR_MESSAGES[err] ?? `에러 코드 ${err}`;
  }
  if (typeof err === 'string') return err;
  const code = err?.code;
  const codeNum = typeof code === 'string' ? parseInt(code, 10) : code;
  if (typeof codeNum === 'number' && !Number.isNaN(codeNum) && ANDROID_SPEECH_ERROR_MESSAGES[codeNum]) {
    return ANDROID_SPEECH_ERROR_MESSAGES[codeNum];
  }
  const message = err?.message?.trim();
  if (message) return message;
  if (code != null) return `에러 코드 ${code}`;
  return '알 수 없는 오류';
}

/** Android에서 마이크 권한 요청 후 허용 여부 반환 */
async function requestAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: '음성 인식 권한',
        message: '「연지」「곤지」 음성으로 카운터를 조작하려면 마이크 권한이 필요합니다.',
        buttonNeutral: '나중에',
        buttonNegative: '거절',
        buttonPositive: '허용',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/** Voice 네이티브 모듈 사용 가능 여부 (null이면 링크 안 됨) */
function isVoiceAvailable(): boolean {
  const nativeVoice = NativeModules.Voice;
  if (nativeVoice == null || typeof nativeVoice.startSpeech !== 'function') {
    return false;
  }
  const v = Voice as unknown as { start?: (locale: string) => Promise<unknown> };
  return typeof v?.start === 'function';
}

/**
 * 화면 포커스 중 음성으로 "연지"(감소) / "곤지"(증가)를 인식해 콜백을 호출하는 훅.
 * 버튼 없이 계속 듣다가 키워드가 들리면 동작한다.
 * @param onRecognized - 인식된 문장이 올 때마다 호출 (디버깅/표시용)
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
    if (!enabled) return;
    if (!isVoiceAvailable()) {
      onErrorRef.current?.('음성 인식 모듈을 불러올 수 없습니다. 앱을 다시 빌드해 주세요.');
      return;
    }

    let cancelled = false;

    const startListening = () => {
      if (!enabledRef.current || cancelled) return;
      Voice.start(LOCALE).catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        onErrorRef.current?.(msg || '음성 인식 시작 실패');
      });
    };

    const noop = () => {};
    Voice.onSpeechStart = noop;
    Voice.onSpeechRecognized = noop;
    Voice.onSpeechPartialResults = noop;
    Voice.onSpeechVolumeChanged = noop;

    const onSpeechResults = (event: { value?: string[] }) => {
      if (!enabledRef.current) return;
      const value = event.value;
      if (!value || !Array.isArray(value) || value.length === 0) {
        startListening();
        return;
      }
      const text = value.join(' ').trim();
      onRecognizedRef.current?.(text);
      onErrorRef.current?.(''); // 인식 성공 시 에러 메시지 제거
      if (text.includes(KEYWORD_ADD)) {
        onAddRef.current();
      } else if (text.includes(KEYWORD_SUBTRACT)) {
        onSubtractRef.current();
      }
      startListening();
    };

    const onSpeechEnd = () => {
      if (enabledRef.current && !cancelled) {
        setTimeout(startListening, 300);
      }
    };

    const onSpeechError = (e: { error?: { code?: string | number; message?: string } | string }) => {
      const msg = getSpeechErrorMessage(e);
      onErrorRef.current?.(msg);
      if (enabledRef.current && !cancelled) {
        setTimeout(startListening, 500);
      }
    };

    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;

    const onSpeechPartialResults = (event: { value?: string[] }) => {
      const value = event.value;
      if (value?.length && enabledRef.current) {
        const text = value.join(' ').trim();
        if (text) onRecognizedRef.current?.(text);
      }
    };
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    requestAudioPermission().then((granted) => {
      if (cancelled) return;
      if (!granted) {
        onErrorRef.current?.('마이크 권한을 허용해 주세요');
        return;
      }
      startListening();
    });

    return () => {
      cancelled = true;
      Voice.onSpeechStart = noop;
      Voice.onSpeechRecognized = noop;
      Voice.onSpeechResults = noop;
      Voice.onSpeechPartialResults = noop;
      Voice.onSpeechEnd = noop;
      Voice.onSpeechError = noop;
      Voice.onSpeechVolumeChanged = noop;
      Voice.destroy().catch(() => {});
      Voice.removeAllListeners();
    };
  }, [enabled]);
}
