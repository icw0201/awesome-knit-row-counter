import { useCallback, useEffect, useRef, useState } from 'react';
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
 * 줄이 넘치면 이미 보인 prefix를 숨기고, 남은 suffix부터 이어서 표시한다.
 */
export const useVoiceBannerText = ({
  isVoiceCommandsActive,
}: UseVoiceBannerTextParams): UseVoiceBannerTextReturn => {
  const [voiceRecognizedText, setVoiceRecognizedText] = useState('');
  const [isVoiceTextResetPending, setIsVoiceTextResetPending] = useState(false);
  const lastVoiceTranscriptRef = useRef('');
  const resetVoiceTextBaseRef = useRef('');

  useEffect(() => {
    if (!isVoiceCommandsActive) {
      setVoiceRecognizedText('');
      lastVoiceTranscriptRef.current = '';
      resetVoiceTextBaseRef.current = '';
      setIsVoiceTextResetPending(false);
    }
  }, [isVoiceCommandsActive]);

  const handleVoiceRecognizedTextChange = useCallback((nextText: string) => {
    lastVoiceTranscriptRef.current = nextText;
    const hiddenPrefix = resetVoiceTextBaseRef.current;

    if (
      hiddenPrefix &&
      nextText.startsWith(hiddenPrefix)
    ) {
      const remainingText = nextText
        .slice(hiddenPrefix.length)
        .trimStart();

      setVoiceRecognizedText(remainingText);
      setIsVoiceTextResetPending(remainingText.length === 0);
      return;
    }

    resetVoiceTextBaseRef.current = '';
    setIsVoiceTextResetPending(false);
    setVoiceRecognizedText(nextText);
  }, []);

  const handleVoiceTextLayout = useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      const { lines } = event.nativeEvent;

      if (lines.length > 1 && voiceRecognizedText) {
        const visibleLineText = lines[0]?.text ?? '';

        if (!visibleLineText || !voiceRecognizedText.startsWith(visibleLineText)) {
          resetVoiceTextBaseRef.current = lastVoiceTranscriptRef.current;
          setVoiceRecognizedText('');
          setIsVoiceTextResetPending(true);
          return;
        }

        const remainingTextRaw = voiceRecognizedText.slice(visibleLineText.length);
        const remainingText = remainingTextRaw.trimStart();
        const consumedLength = voiceRecognizedText.length - remainingText.length;

        resetVoiceTextBaseRef.current += voiceRecognizedText.slice(0, consumedLength);

        setVoiceRecognizedText(remainingText);
        setIsVoiceTextResetPending(remainingText.length === 0);
      }
    },
    [voiceRecognizedText]
  );

  return {
    voiceRecognizedText,
    isVoiceTextResetPending,
    handleVoiceRecognizedTextChange,
    handleVoiceTextLayout,
  };
};
