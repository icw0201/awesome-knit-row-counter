import React from 'react';
import { Mic } from 'lucide-react-native';
import { View, Text, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';
import { VOICE_LISTENING_TEXT } from '@hooks/useVoiceCommands';

const MIC_SIZE = 18;
/**
 * 배너를 시각적으로 1줄만 보이게 고정하는 높이.
 * lineHeight와 wrapper maxHeight를 같은 값으로 맞춰야
 * 텍스트가 2줄로 넘어갈 때 onTextLayout 감지가 안정적이다.
 */
const ONE_LINE_HEIGHT = 22;

export interface VoiceRecognitionBannerProps {
  visible: boolean;
  /** 일반 인식 텍스트가 넘지 않는 최대 가로 (화면 기준, 줄 바꿈·초기화 트리거용) */
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
  const hasVoiceError = voiceError.length > 0;

  if (!visible) {
    return null;
  }

  return (
    // 부모가 준 voice banner 영역 전체 안에서 세로/가로 중앙 정렬한다.
    <View className="w-full flex-1 items-center justify-center" pointerEvents="none">
      {/* 실제 배너 박스: 에러는 폭 제한 없이, 일반 인식 텍스트만 30% 제한을 적용한다. */}
      <View className="rounded bg-lightgray px-2 py-1.5">
        {/* 아이콘 + 텍스트를 한 줄로 배치한다. */}
        <View className="flex-row items-center gap-1.5">
          <Mic size={MIC_SIZE} color="#111111" strokeWidth={2} />
          {hasVoiceError ? (
            // 에러는 잘라내지 않고 전체 문구를 그대로 보여준다.
            <View className="shrink">
              <Text
                className="text-xs text-red-orange-500"
                style={{ lineHeight: ONE_LINE_HEIGHT }}
              >
                에러: {voiceError}
              </Text>
            </View>
          ) : (
            // 일반 인식 텍스트는 줄바꿈이 생기면 부모가 감지해 내용을 초기화한다.
            <View style={{ maxHeight: ONE_LINE_HEIGHT, overflow: 'hidden' }}>
              <Text
                className="text-sm text-black"
                style={{ lineHeight: ONE_LINE_HEIGHT, maxWidth }}
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
