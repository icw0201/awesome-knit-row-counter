import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CircleQuestionMark } from 'lucide-react-native';
import { appTheme } from '@styles/appTheme';

interface QuestionMarkTooltipProps {
  tooltipText: string;
}

/**
 * 퀘스천마크 아이콘과 툴팁을 함께 제공하는 컴포넌트
 * 아이콘을 누르면 모달로 툴팁이 표시됩니다.
 * 툴팁은 화살표가 아래를 향하고 박스가 위에 위치합니다.
 */
const QuestionMarkTooltip: React.FC<QuestionMarkTooltipProps> = ({ tooltipText }) => {
  const iconSize = 24;
  const iconColor = appTheme.colors.darkgray;
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<View | null>(null);
  const bodyRef = useRef<View | null>(null);
  const [tooltipBottom, setTooltipBottom] = useState<number | undefined>(undefined);
  const [tooltipLeft, setTooltipLeft] = useState<number | undefined>(undefined);
  const [arrowLeftPx, setArrowLeftPx] = useState<number | null>(null);
  const [iconCenterX, setIconCenterX] = useState<number | undefined>(undefined);
  const [boxTranslateX, setBoxTranslateX] = useState<number>(-120); // 박스 중앙 정렬 기본값 (240px / 2)
  const opacity = useRef(new Animated.Value(1)).current;
  const AUTO_HIDE_MS = 4000;
  const FADE_OUT_MS = 400;
  const ARROW_HALF_WIDTH = 6; // SVG 화살표 너비 12px의 절반
  /** 화살표·박스 경계 서브픽셀 틈 방지(1px만 박스 쪽으로 겹침) */
  const ARROW_BOX_OVERLAP_PX = 1;
  const TOOLTIP_BOX_MAX_WIDTH = 240;
  const TOOLTIP_BOX_HALF_WIDTH = TOOLTIP_BOX_MAX_WIDTH / 2;
  const PADDING = 16; // 화면 양쪽 여백

  const handlePress = () => {
    // 아이콘의 화면 기준 좌표를 측정하여 툴팁 위치 계산
    iconRef.current?.measureInWindow((x: number, y: number, width: number) => {
      const centerX = x + width / 2;
      setIconCenterX(centerX);
      // Tooltip 화살표가 "아래쪽"에 있으므로, 아이콘 위에 툴팁을 배치합니다.
      // bottom을 사용하여 화면 하단에서부터의 거리로 계산합니다.
      // 아이콘의 top 위치(y)에서 아이콘 높이(24px)만큼 빼서 아이콘 bottom 위치에 툴팁 배치
      setTooltipBottom(screenHeight - y - 24);
      setTooltipLeft(centerX); // 아이콘 중앙 x 좌표 저장 (화살표 위치 기준)

      // 박스가 화면 밖으로 나가지 않도록 translateX 계산
      const boxLeft = centerX - TOOLTIP_BOX_HALF_WIDTH;
      const boxRight = centerX + TOOLTIP_BOX_HALF_WIDTH;
      let translateX = -TOOLTIP_BOX_HALF_WIDTH; // 기본: 박스 중앙이 아이콘 중앙에 오도록

      if (boxLeft < PADDING) {
        // 왼쪽으로 나가는 경우: 왼쪽 여백만큼 이동
        translateX = -centerX + PADDING;
      } else if (boxRight > screenWidth - PADDING) {
        // 오른쪽으로 나가는 경우: 박스의 오른쪽 끝이 화면 오른쪽 여백 안에 오도록
        translateX = screenWidth - PADDING - TOOLTIP_BOX_MAX_WIDTH - centerX;
      }

      setBoxTranslateX(translateX);
      setShowTooltip(true);
      opacity.setValue(1);
    });
  };

  useEffect(() => {
    if (showTooltip && AUTO_HIDE_MS > 0) {
      const t = setTimeout(() => {
        // 페이드아웃: 지정 시간 동안 opacity를 1 → 0으로 감소시킵니다.
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_OUT_MS,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setShowTooltip(false);
          }
        });
      }, AUTO_HIDE_MS);
      return () => clearTimeout(t);
    }
  }, [showTooltip, AUTO_HIDE_MS, FADE_OUT_MS, opacity]);

  return (
    <>
      <View
        ref={(ref) => { iconRef.current = ref; }}
        onLayout={(_e: LayoutChangeEvent) => {
          // 레이아웃이 변경될 때마다 위치 재계산
          if (showTooltip) {
            iconRef.current?.measureInWindow((x: number, y: number, width: number) => {
              const centerX = x + width / 2;
              setIconCenterX(centerX);
              setTooltipBottom(screenHeight - y - 24);
              setTooltipLeft(centerX);

              // 박스가 화면 밖으로 나가지 않도록 translateX 재계산
              const boxLeft = centerX - TOOLTIP_BOX_HALF_WIDTH;
              const boxRight = centerX + TOOLTIP_BOX_HALF_WIDTH;
              let translateX = -TOOLTIP_BOX_HALF_WIDTH;

              if (boxLeft < PADDING) {
                translateX = -centerX + PADDING;
              } else if (boxRight > screenWidth - PADDING) {
                // 오른쪽으로 나가는 경우: 박스의 오른쪽 끝이 화면 오른쪽 여백 안에 오도록
                translateX = screenWidth - PADDING - TOOLTIP_BOX_MAX_WIDTH - centerX;
              }

              setBoxTranslateX(translateX);
            });
          }
        }}
      >
        <Pressable onPress={handlePress} style={{ padding: 4 }}>
          <CircleQuestionMark size={iconSize} color={iconColor} />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={showTooltip}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => {
          setShowTooltip(false);
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => {
          setShowTooltip(false);
        }}>
          {showTooltip && tooltipBottom != null && tooltipLeft != null && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.tooltipContainer,
                {
                  bottom: tooltipBottom,
                  left: tooltipLeft, // 아이콘 중앙 x 좌표
                  opacity,
                },
              ]}
            >
              <View
                className="relative"
                style={{
                  transform: [{ translateX: boxTranslateX }], // 박스 위치 조정 (화면 밖으로 나가지 않도록)
                }}
              >
                <View className="relative">
                  {/* 아래쪽 삼각형 화살표 (180도 회전) - 박스 위에 위치, 아이콘 중앙에 정렬 */}
                  <Svg
                    width={12}
                    height={20}
                    style={{
                      position: 'absolute',
                      left: arrowLeftPx ?? 120, // 기본값은 박스 중앙 (240px / 2 = 120px)
                      bottom: -8 + ARROW_BOX_OVERLAP_PX,
                      transform: [{ translateX: -(arrowLeftPx != null ? ARROW_HALF_WIDTH : 6) }, { rotate: '180deg' }],
                    }}
                  >
                    <Path d="M0 20 L5 5 Q6 4 7 5 L12 20 Z" fill={appTheme.colors.black} />
                  </Svg>
                  <View
                    ref={(ref) => { bodyRef.current = ref; }}
                    className="px-2 py-3 rounded-md bg-black mb-3"
                    style={{ maxWidth: 240 }}
                    onLayout={(_e: LayoutChangeEvent) => {
                      if (!iconCenterX || !bodyRef.current) {
                        setArrowLeftPx(null); // 기본 중앙 정렬
                        return;
                      }
                      // 박스의 화면 기준 좌표를 가져와 아이콘 중앙 X와의 차이로 화살표 위치(px) 계산
                      bodyRef.current.measureInWindow((x, _y, width) => {
                        const raw = iconCenterX - x;
                        const clamped = Math.max(ARROW_HALF_WIDTH, Math.min(width - ARROW_HALF_WIDTH, raw));
                        setArrowLeftPx(clamped);
                      });
                    }}
                  >
                    {tooltipText ? (
                      <Text className="text-white text-xs text-center">{tooltipText}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
});

export default QuestionMarkTooltip;

