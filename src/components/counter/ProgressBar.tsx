// src/components/counter/ProgressBar.tsx
import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { ScreenSize, getProgressBarHeightClass } from '@constants/screenSizeConfig';
import FlagIcon from '@assets/images/flag.svg';

interface ProgressBarProps {
  count: number;
  targetCount: number;
  screenSize: ScreenSize;
  onPress: () => void;
}

/**
 * 프로그레스 바 컴포넌트
 * 화면 상단에 고정되어 목표 진행률을 표시합니다.
 * 터치 시 목표 단수 설정 모달이 열립니다.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({ count, targetCount, screenSize, onPress }) => {
  const { width } = useWindowDimensions();

  const percentage = targetCount > 0 ? (count / targetCount) * 100 : null;
  const percentageText = percentage !== null ? `${percentage.toFixed(1)}%` : null;
  const isZeroState = targetCount === 0;

  // 프로그레스 바의 너비 계산 (목표 0일 때 2%, 그 외 100%를 넘어가도 표시)
  const progressWidth = isZeroState
    ? width * 0.02
    : percentage !== null
      ? Math.min((width * percentage) / 100, width)
      : 0;
  const isFullWidth = percentage !== null && percentage >= 100;

  // 텍스트가 들어갈 수 있는 최소 너비 (대략적으로 "100.0%" 정도를 고려)
  const minTextWidth = 50;
  const isProgressBarWideEnough = progressWidth >= minTextWidth;
  const isCompact = screenSize === ScreenSize.COMPACT;
  const heightClass = getProgressBarHeightClass(screenSize);

  const containerClassName = `absolute top-0 left-0 right-0 ${heightClass} bg-red-orange-50`;

  // 프로그레스 바와 텍스트 내용
  const content = (
    <>
      {/* 프로그레스 바 (왼쪽부터 채워지는 부분, 목표 0일 때는 2% 표시) */}
      {progressWidth > 0 && (
        <View
          className={`absolute left-0 top-0 bottom-0 bg-red-orange-300 ${isFullWidth ? '' : 'rounded-tr-2xl rounded-br-2xl'}`}
          style={{ width: progressWidth }}
        />
      )}

      {/* 백분율 텍스트 - compact에서는 미표시. 목표 0일 때는 깃발+안내 문구, 그 외에는 백분율 */}
      {!isCompact && (isZeroState || (percentageText && targetCount > 0)) && (
        <View
          className="absolute left-0 top-0 bottom-0 flex-row items-center"
          style={{
            width: isZeroState ? undefined : isProgressBarWideEnough ? progressWidth : undefined,
            paddingRight: isZeroState ? 8 : isProgressBarWideEnough ? 8 : 0,
            paddingLeft: isZeroState ? 8 : isProgressBarWideEnough ? 0 : 8,
          }}
          pointerEvents="none"
        >
          {isZeroState ? (
            <>
              <View className="mr-1.5">
                <FlagIcon width={18} height={18} />
              </View>
              <Text className="text-darkgray text-xs font-bold" numberOfLines={1}>
                터치하여 목표치를 설정해 주세요
              </Text>
            </>
          ) : (
            <Text
              className="text-black text-xs font-bold"
              numberOfLines={1}
              style={{
                flex: 1,
                textAlign: isProgressBarWideEnough ? 'right' : 'left',
              }}
            >
              {percentageText}
            </Text>
          )}
        </View>
      )}
    </>
  );

  // compact일 때는 View, 그 외에는 Pressable
  return isCompact ? (
    <View className={containerClassName}>{content}</View>
  ) : (
    <Pressable className={containerClassName} onPress={onPress}>
      {content}
    </Pressable>
  );
};

export default ProgressBar;
