import React, { useEffect, useState, useRef } from 'react';
import { Text, View, LayoutChangeEvent, Pressable } from 'react-native';
import { ScreenSize, getTimeDisplayTextClass } from '@constants/screenSizeConfig';
import { formatElapsedTime } from '@utils/timeUtils';
import TimerBackgroundIcon from '@assets/images/timer_background.svg';

interface TimeDisplayProps {
  screenSize: ScreenSize;
  timerIsPlaying: boolean;
  elapsedTime: number; // 소요 시간 (초 단위, 0 ~ 35999999, 최대 9999:59:59)
  onPress: () => void;
  /** 길게 누르면 호출 (예: 타이머 초기화 확인 모달 열기). 있으면 길게 누를 때만 호출되고 짧게 누르면 onPress만 동작 */
  onLongPress?: () => void;
}

/**
 * 시간 표시 컴포넌트
 * DSEG7Classic 폰트를 사용하여 시간을 표시합니다.
 */
const TimeDisplay: React.FC<TimeDisplayProps> = ({ screenSize, timerIsPlaying, elapsedTime, onPress, onLongPress }) => {
  // 깎인 모서리 크기 (픽셀 단위)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showColon, setShowColon] = useState(true);
  // 길게 누른 경우 onPress(일시정지/재생)가 함께 호출되지 않도록
  const longPressHandledRef = useRef(false);

  /**
   * 콜론 깜빡임 효과
   * timerIsPlaying이 true일 때, 초가 바뀔 때마다 콜론을 600ms 동안 표시하고 400ms 동안 숨깁니다.
   * timerIsPlaying이 false일 때는 콜론을 항상 표시합니다.
   */
  useEffect(() => {
    if (!timerIsPlaying) {
      setShowColon(true);
      return;
    }

    const VISIBLE_DURATION_MS = 600;

    // 초가 바뀌는(elapsedTime 변경) 순간 콜론을 켜고,
    // 600ms 동안 켜져 있다가 나머지 400ms는 꺼진 상태 유지
    setShowColon(true);

    const timeoutId = setTimeout(() => {
      setShowColon(false);
    }, VISIBLE_DURATION_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [timerIsPlaying, elapsedTime]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  // 화면 크기에 따른 패딩 클래스 (컴포넌트 크기)
  const paddingClass = screenSize === ScreenSize.SMALL ? 'px-3 py-1.5' : 'px-4 py-2';

  // 배경색 결정: timerIsPlaying이 false면 light gray, true면 red-orange-300
  const backgroundColor = timerIsPlaying ? '#ffa09e' : '#DBDBDB';

  // 시간 포맷팅
  const { hours, minutes, seconds } = formatElapsedTime(elapsedTime);
  const colonStyle = timerIsPlaying && !showColon ? { color: 'transparent' } : undefined;

  const handlePress = () => {
    if (longPressHandledRef.current) {
      longPressHandledRef.current = false;
      return;
    }
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      longPressHandledRef.current = true;
      onLongPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      className={`items-center justify-center ${paddingClass} relative`}
      onLayout={onLayout}
    >
      {/* 배경 - SVG로 깎인 모양 구현 */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <View className="absolute inset-0">
          <TimerBackgroundIcon
            width={dimensions.width}
            height={dimensions.height}
            color={backgroundColor}
          />
        </View>
      )}
      <Text style={{ fontFamily: 'DSEG7Classic-Bold' }} className={`${getTimeDisplayTextClass(screenSize)} relative z-10`}>
        {hours}
        <Text style={colonStyle}>:</Text>
        {minutes}
        <Text style={colonStyle}>:</Text>
        {seconds}
      </Text>
    </Pressable>
  );
};

export default TimeDisplay;

