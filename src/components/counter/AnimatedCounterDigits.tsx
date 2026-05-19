import { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { appTheme } from '@styles/appTheme';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const DIGIT_WIDTH_RATIO = 0.6;
const DIGIT_HORIZONTAL_PADDING_RATIO = 0.04;

const springConfig = {
  damping: 18,
  stiffness: 220,
  mass: 0.4,
};

type DigitColumnProps = {
  digit: number;
  fontSize: number;
  lineHeight: number;
  textClass: string;
};

/**
 * 한 자리(0–9)를 세로 스트립으로 두고 translateY로 해당 숫자에 맞춥니다.
 * 첫 마운트는 즉시 맞춤.
 * 자릿 숫자는 그대로인데 줄 높이만 바뀐 경우(레이아웃 리사이즈)만 스프링 없이 즉시 맞춤.
 * 숫자가 바뀌면 lineHeight가 같이 바뀌어도(자릿수 늘어나며 글자 크기 조정) 스프링으로 롤합니다.
 */
function DigitColumn({ digit, fontSize, lineHeight, textClass }: DigitColumnProps) {
  const translateY = useSharedValue(-digit * lineHeight);
  const isFirstMountRef = useRef(true);
  const prevLineHeightRef = useRef(lineHeight);
  const prevDigitRef = useRef(digit);

  useEffect(() => {
    const target = -digit * lineHeight;
    const lineHeightChanged = prevLineHeightRef.current !== lineHeight;
    const digitChanged = prevDigitRef.current !== digit;

    if (isFirstMountRef.current) {
      translateY.value = target;
      isFirstMountRef.current = false;
      prevDigitRef.current = digit;
      prevLineHeightRef.current = lineHeight;
      return;
    }

    if (lineHeightChanged && !digitChanged) {
      translateY.value = target;
      prevDigitRef.current = digit;
      prevLineHeightRef.current = lineHeight;
      return;
    }

    if (digitChanged) {
      translateY.value = withSpring(target, springConfig);
    } else if (lineHeightChanged) {
      translateY.value = target;
    }

    prevDigitRef.current = digit;
    prevLineHeightRef.current = lineHeight;
  }, [digit, lineHeight, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const digitWidth = fontSize * DIGIT_WIDTH_RATIO;
  const sideBearingPadding = fontSize * DIGIT_HORIZONTAL_PADDING_RATIO;
  const columnWidth = digitWidth + sideBearingPadding * 2;

  return (
    <View
      style={{
        height: lineHeight,
        width: columnWidth,
        marginHorizontal: -sideBearingPadding,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[animatedStyle, { width: columnWidth }]}>
        {DIGITS.map((d) => (
          <Text
            key={d}
            className={`${textClass} font-bold text-black`}
            style={{
              width: columnWidth,
              fontSize,
              lineHeight,
              height: lineHeight,
              textAlign: 'center',
            }}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export type AnimatedCounterDigitsProps = {
  value: number;
  fontSize: number;
  lineHeight: number;
  textClass: string;
};

/**
 * 메인 카운트를 React Bits Counter에 가까운 자릿수별 세로 롤링으로 표시합니다.
 */
function AnimatedCounterDigits({ value, fontSize, lineHeight, textClass }: AnimatedCounterDigitsProps) {
  const isNegative = value < 0;
  const absTrunc = Math.abs(Math.trunc(value));
  const digitChars =
    absTrunc === 0 ? [0] : String(absTrunc).split('').map((c) => Number.parseInt(c, 10));
  const textAreaHorizontalPadding = fontSize * DIGIT_HORIZONTAL_PADDING_RATIO;

  return (
    <View
      className={`flex-row items-center justify-center`}
      style={{ paddingHorizontal: textAreaHorizontalPadding }}
      accessibilityRole="text"
      accessibilityLabel={String(value)}
      accessibilityLiveRegion="polite"
    >
      {isNegative && (
        <Text
          className={`${textClass} font-bold text-black`}
          style={{ fontSize, lineHeight, height: lineHeight }}
        >
          -
        </Text>
      )}
      {digitChars.map((digit, index) => (
        <DigitColumn
          key={index}
          digit={digit}
          fontSize={fontSize}
          lineHeight={lineHeight}
          textClass={textClass}
        />
      ))}
    </View>
  );
}

export default AnimatedCounterDigits;
