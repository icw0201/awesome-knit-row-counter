import { useCallback, useEffect, useState } from 'react';
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

type UseVoiceBannerTextParams = {
  isVoiceCommandsActive: boolean;
};

type UseVoiceBannerTextReturn = {
  voiceRecognizedText: string;
  isVoiceTextResetPending: boolean;
  handleVoiceRecognizedTextChange: (nextText: string) => void;
  handleVoiceTextLayout: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
};

/**
 * 음성 transcript를 배너용 1줄 텍스트로 관리한다.
 * 실제 한 줄 표시는 Text의 numberOfLines/ellipsizeMode에 맡긴다.
 * 레이아웃 이벤트에서 문자열을 직접 잘라내면 Android STT partial 갱신 중
 * 글자가 생겼다가 사라지는 깜빡임이 생길 수 있다.
 */
export const useVoiceBannerText = ({
  isVoiceCommandsActive,
}: UseVoiceBannerTextParams): UseVoiceBannerTextReturn => {
  const [voiceRecognizedText, setVoiceRecognizedText] = useState('');
  const [isVoiceTextResetPending, setIsVoiceTextResetPending] = useState(false);

  useEffect(() => {
    if (!isVoiceCommandsActive) {
      setVoiceRecognizedText('');
      setIsVoiceTextResetPending(false);
    }
  }, [isVoiceCommandsActive]);

  const handleVoiceRecognizedTextChange = useCallback((nextText: string) => {
    setIsVoiceTextResetPending(false);
    setVoiceRecognizedText(nextText);
  }, []);

  const handleVoiceTextLayout = useCallback((_event: NativeSyntheticEvent<TextLayoutEventData>) => {
    // Text 레이아웃 결과는 표시 상태를 바꾸지 않는다.
  }, []);

  return {
    voiceRecognizedText,
    isVoiceTextResetPending,
    handleVoiceRecognizedTextChange,
    handleVoiceTextLayout,
  };
};
