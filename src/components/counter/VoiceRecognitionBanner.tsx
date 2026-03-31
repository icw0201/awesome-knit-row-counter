import React from 'react';
import { Mic } from 'lucide-react-native';
import { View, Text, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';
import { VOICE_LISTENING_TEXT } from '@hooks/useVoiceCommands';

const MIC_SIZE = 18;
const ERROR_FONT_SIZE = 12;
const RECOGNIZED_TEXT_FONT_SIZE = 14;
/**
 * 배너에서 실제로 보여줄 1줄 높이.
 * 일반 인식 텍스트는 maxWidth(현재 화면의 30%) 안에서 줄바꿈이 생길 수 있으므로,
 * lineHeight와 wrapper maxHeight를 같은 값으로 맞춰 overflow 감지를 안정화한다.
 */
const ONE_LINE_HEIGHT = 22;

export interface VoiceRecognitionBannerProps {
  visible: boolean;
  /** 일반 인식 텍스트 영역의 최대 가로 (현재 화면 너비의 30%) */
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
      {/* 실제 배너 박스: 에러는 폭 제한 없이, 일반 인식 텍스트만 전달받은 maxWidth를 적용한다. */}
      <View className="rounded bg-lightgray px-2 py-1.5">
        {/* 아이콘 + 텍스트를 한 줄로 배치한다. */}
        <View className="flex-row items-center gap-1.5">
          <Mic size={MIC_SIZE} color="#111111" strokeWidth={2} />
          {hasVoiceError ? (
            // 에러는 잘라내지 않고 전체 문구를 그대로 보여준다.
            <View className="shrink">
              <Text
                allowFontScaling={false}
                className="text-red-orange-500"
                style={{ fontSize: ERROR_FONT_SIZE, lineHeight: ONE_LINE_HEIGHT }}
              >
                에러: {voiceError}
              </Text>
            </View>
          ) : (
            // 일반 인식 텍스트는 maxWidth 안에서 줄바꿈되면 부모가 감지해 다음 내용부터 다시 보여준다.
            <View style={{ maxHeight: ONE_LINE_HEIGHT, overflow: 'hidden' }}>
              <Text
                allowFontScaling={false}
                className="text-black"
                style={{
                  fontSize: RECOGNIZED_TEXT_FONT_SIZE,
                  lineHeight: ONE_LINE_HEIGHT,
                  maxWidth,
                }}
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
