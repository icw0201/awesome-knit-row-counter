import React, { useMemo } from 'react';
import { Mic } from 'lucide-react-native';
import { View, Text, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';
import clsx from 'clsx';
import { VOICE_LISTENING_TEXT } from '@hooks/useVoiceCommands';

const MIC_SIZE = 18;
const H_PAD = 16; // px-2 ×2
/** 한 줄 높이만 보이게 잘라 `onTextLayout`에서 줄 수(2줄 이상)로 초기화 트리거 */
const ONE_LINE_HEIGHT = 22;

export interface VoiceRecognitionBannerProps {
  visible: boolean;
  /** 배너가 넘지 않는 최대 가로 (화면 기준, 줄 바꿈·초기화 트리거용) */
  maxWidth: number;
  voiceError: string;
  recognizedText: string;
  isResetPending: boolean;
  onRecognizedTextLayout: (e: NativeSyntheticEvent<TextLayoutEventData>) => void;
}

/**
 * 카운터 콘텐츠 내부 음성 인식 상태·결과 표시 배너
 */
const VoiceRecognitionBanner: React.FC<VoiceRecognitionBannerProps> = ({
  visible,
  maxWidth,
  voiceError,
  recognizedText,
  isResetPending,
  onRecognizedTextLayout,
}) => {
  const textMaxWidth = useMemo(
    () => Math.max(0, maxWidth - H_PAD - MIC_SIZE - 6),
    [maxWidth]
  );

  if (!visible) {
    return null;
  }

  return (
    <View className="w-full items-center justify-center" pointerEvents="none">
      <View
        className={clsx('rounded bg-lightgray px-2 py-1.5')}
        style={{ maxWidth }}
      >
        <View className="flex-row items-center gap-1.5">
          <Mic size={MIC_SIZE} color="#111111" strokeWidth={2} />
          {voiceError ? (
            <View style={{ maxHeight: ONE_LINE_HEIGHT, overflow: 'hidden' }}>
              <Text
                className="text-xs leading-[22px] text-red-orange-500"
                style={{ maxWidth: textMaxWidth }}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                에러: {voiceError}
              </Text>
            </View>
          ) : (
            <View style={{ maxHeight: ONE_LINE_HEIGHT, overflow: 'hidden' }}>
              <Text
                className="text-sm leading-[22px] text-black"
                style={{ maxWidth: textMaxWidth }}
                onTextLayout={onRecognizedTextLayout}
              >
                {recognizedText || (isResetPending ? '' : VOICE_LISTENING_TEXT)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default VoiceRecognitionBanner;
