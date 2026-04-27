import React from 'react';
import { Mic } from 'lucide-react-native';
import { View, Text, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';
import { VOICE_LISTENING_TEXT } from '@hooks/useVoiceCommands';
import { appTheme } from '@styles/appTheme';

const MIC_SIZE = 18;
const MIC_OFFSET_Y = 2;
const ERROR_FONT_RATIO = 0.3;
const RECOGNIZED_TEXT_FONT_RATIO = 0.55;
/**
 * 배너 섹션 높이 대비 1줄 텍스트 높이 비율.
 * 일반 인식 텍스트는 maxWidth 안에서 줄바꿈 여부를 감지하므로,
 * lineHeight와 wrapper maxHeight를 같은 값으로 맞춰 한 줄 클리핑을 안정화한다.
 */
const ONE_LINE_HEIGHT_RATIO = 0.55;

export interface VoiceRecognitionBannerProps {
  visible: boolean;
  /** 배너가 배치되는 세로 영역의 실제 높이(px) */
  bannerHeight: number;
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
  bannerHeight,
  maxWidth,
  voiceError,
  recognizedText,
  isResetPending,
  onRecognizedTextLayout,
}) => {
  const hasVoiceError = voiceError.length > 0;
  const oneLineHeight = Math.max(0, bannerHeight * ONE_LINE_HEIGHT_RATIO);
  const errorFontSize = Math.max(0, bannerHeight * ERROR_FONT_RATIO);
  const recognizedTextFontSize = Math.max(0, bannerHeight * RECOGNIZED_TEXT_FONT_RATIO);

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
          <Mic
            size={MIC_SIZE}
            color={appTheme.colors.black}
            strokeWidth={2}
            style={{ marginTop: MIC_OFFSET_Y }}
          />
          {hasVoiceError ? (
            // 에러는 잘라내지 않고 전체 문구를 그대로 보여준다.
            <View className="shrink">
              <Text
                allowFontScaling={false}
                className={appTheme.tw.text.primary['500']}
                style={{ fontSize: errorFontSize, lineHeight: oneLineHeight }}
              >
                에러: {voiceError}
              </Text>
            </View>
          ) : (
            // 일반 인식 텍스트는 maxWidth 안에서 줄바꿈되면 부모가 감지해 다음 내용부터 다시 보여준다.
            <View style={{ maxHeight: oneLineHeight, overflow: 'hidden' }}>
              <Text
                allowFontScaling={false}
                className="text-black"
                style={{
                  fontSize: recognizedTextFontSize,
                  lineHeight: oneLineHeight,
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
