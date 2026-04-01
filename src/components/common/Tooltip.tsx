import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent } from 'react-native';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface TooltipProps {
  text?: string;
  containerClassName?: string;
  // 화면 기준 타겟 X좌표(px). 제공되면 화살표를 해당 타겟을 향해 정렬
  targetAnchorX?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ text, containerClassName, targetAnchorX }) => {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const AUTO_HIDE_MS = 4000;
  const FADE_OUT_MS = 400;
  const bodyRef = useRef<View | null>(null);
  const [arrowLeftPx, setArrowLeftPx] = useState<number | null>(null);
  const ARROW_HALF_WIDTH = 6; // Svg width 12 기준
  /** 화살표·박스 경계 서브픽셀 틈 방지(1px만 박스 쪽으로 겹침; 삼각형 스케일 키우는 것과 달리 두께는 그대로) */
  const ARROW_BOX_OVERLAP_PX = 1;

  useEffect(() => {
    if (AUTO_HIDE_MS > 0) {
      const t = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_OUT_MS,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setVisible(false);
          }
        });
      }, AUTO_HIDE_MS);
      return () => clearTimeout(t);
    }
  }, [AUTO_HIDE_MS, FADE_OUT_MS, opacity]);

  // targetAnchorX가 바뀌면(ex: onLayout으로 resolvedWidth 갱신)
  // measureInWindow로 화살표 위치를 재계산
  useEffect(() => {
    if (!targetAnchorX || !bodyRef.current) {
      return;
    }
    bodyRef.current.measureInWindow((x, _y, w) => {
      if (x === undefined || w === undefined) { return; }
      const raw = targetAnchorX - x;
      const clamped = Math.max(ARROW_HALF_WIDTH, Math.min(w - ARROW_HALF_WIDTH, raw));
      setArrowLeftPx(clamped);
    });
  }, [targetAnchorX]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" className={containerClassName} style={{ opacity }}>
      <View className="relative self-center">
        <View className="relative">
          {/* 위쪽 삼각형 화살표 (SVG로 꼭짓점 자체를 둥글게) - 바로 아래 박스의 정확한 중앙에 정렬 */}
          <Svg
            width={12}
            height={20}
            style={{
              position: 'absolute',
              left: arrowLeftPx ?? '50%',
              top: -8 + ARROW_BOX_OVERLAP_PX,
              transform: [{ translateX: -(arrowLeftPx != null ? ARROW_HALF_WIDTH : 6) }],
            }}
          >
            <Path d="M0 20 L5 5 Q6 4 7 5 L12 20 Z" fill="rgba(0,0,0,0.6)" />
          </Svg>
          <View
            ref={(ref) => { bodyRef.current = ref; }}
            className="px-2 py-3 rounded-md bg-black/60 mt-3"
            style={{ maxWidth: 240 }}
            onLayout={(_e: LayoutChangeEvent) => {
              if (!targetAnchorX || !bodyRef.current) {
                setArrowLeftPx(null); // 기본 중앙 정렬
                return;
              }
              // 박스의 화면 기준 좌표를 가져와 타겟 X와의 차이로 화살표 위치(px) 계산
              bodyRef.current.measureInWindow((x, _y, width) => {
                const raw = targetAnchorX - x;
                const clamped = Math.max(ARROW_HALF_WIDTH, Math.min(width - ARROW_HALF_WIDTH, raw));
                setArrowLeftPx(clamped);
              });
            }}
          >
            {text ? (
              <Text className="text-white text-xs text-center">{text}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default Tooltip;

