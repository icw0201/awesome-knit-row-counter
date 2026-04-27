import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { appTheme } from '@styles/appTheme';

interface TooltipProps {
  text?: string;
  containerClassName?: string;
  /** top: 위 화살표+아래 박스. bottom: 위 박스+아래 화살표(아래 방향). left: 왼쪽 화살+오른쪽 박스 */
  placement?: 'top' | 'bottom' | 'left';
  /** true: 언마운트 없이 투명 처리만(슬라이드 모달 열림 등). 4초 타이머는 마운트당 1회만 진행 */
  visuallyHidden?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  text,
  containerClassName,
  placement = 'top',
  visuallyHidden = false,
}) => {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const AUTO_HIDE_MS = 4000;
  const FADE_OUT_MS = 400;
  /** 화살표·박스 경계 서브픽셀 틈 방지(1px만 박스 쪽으로 겹침; 삼각형 스케일 키우는 것과 달리 두께는 그대로) */
  const ARROW_BOX_OVERLAP_PX = 1;

  /** auto-hide 완료 시점의 visuallyHidden(타이머는 마운트당 1회만 — deps에 넣지 않음) */
  const visuallyHiddenRef = useRef(visuallyHidden);
  visuallyHiddenRef.current = visuallyHidden;

  useEffect(() => {
    if (AUTO_HIDE_MS <= 0) {
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) {
        return;
      }
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (cancelled || !finished) {
          return;
        }
        if (!visuallyHiddenRef.current) {
          setVisible(false);
        }
      });
    }, AUTO_HIDE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
      opacity.stopAnimation();
    };
  }, [AUTO_HIDE_MS, FADE_OUT_MS, opacity]);

  if (!visible) {
    return null;
  }

  const hideWrapStyle = visuallyHidden ? { opacity: 0 as const } : undefined;

  if (placement === 'left') {
    return (
      <View pointerEvents="none" className={containerClassName} style={hideWrapStyle}>
        <Animated.View style={{ opacity }}>
          <View className="relative flex-row items-center">
            {/* placement top의 Path를 -90° 회전한 형태와 동일한 둥근 삼각형(왼쪽 끝이 뾰족, 오른쪽이 밑변) */}
            <Svg width={20} height={12} viewBox="0 0 20 12">
              <Path d="M20 0 L6 5 Q5 6 6 7 L20 12 Z" fill={appTheme.colors.black} />
            </Svg>
            <View
              className="rounded-md bg-black px-2 py-3"
              style={{ maxWidth: 240, marginLeft: -ARROW_BOX_OVERLAP_PX }}
            >
              {text ? (
                <Text className="text-white text-xs text-center">{text}</Text>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (placement === 'bottom') {
    return (
      <View pointerEvents="none" className={containerClassName} style={hideWrapStyle}>
        <Animated.View style={{ opacity }}>
          <View className="relative self-center">
            <Svg
              width={12}
              height={20}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: -8 + ARROW_BOX_OVERLAP_PX,
                transform: [{ translateX: -6 }, { rotate: '180deg' }],
              }}
            >
              <Path d="M0 20 L5 5 Q6 4 7 5 L12 20 Z" fill={appTheme.colors.black} />
            </Svg>
            <View className="px-2 py-3 rounded-md bg-black mb-3" style={{ maxWidth: 240 }}>
              {text ? (
                <Text className="text-white text-xs text-center">{text}</Text>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View pointerEvents="none" className={containerClassName} style={hideWrapStyle}>
      <Animated.View style={{ opacity }}>
        <View className="relative self-center">
          <View className="relative">
            {/* 위쪽 삼각형 화살표 (SVG로 꼭짓점 자체를 둥글게) - 바로 아래 박스의 정확한 중앙에 정렬 */}
            <Svg
              width={12}
              height={20}
              style={{
                position: 'absolute',
                left: '50%',
                top: -8 + ARROW_BOX_OVERLAP_PX,
                transform: [{ translateX: -6 }],
              }}
            >
              <Path d="M0 20 L5 5 Q6 4 7 5 L12 20 Z" fill={appTheme.colors.black} />
            </Svg>
            <View className="px-2 py-3 rounded-md bg-black mt-3" style={{ maxWidth: 240 }}>
              {text ? (
                <Text className="text-white text-xs text-center">{text}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default Tooltip;
