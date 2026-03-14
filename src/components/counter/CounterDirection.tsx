// src/components/counter/CounterDirection.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Pressable, Text } from 'react-native';
import { Way, RepeatRule } from '@storage/types';
import { directionImages } from '@assets/images';
import EmphasisBubbleIcon from '@assets/images/way/emphasis_bubble.svg';
import { isRuleApplied, isDarkColor } from '@utils/ruleUtils';
import { calculateInitialFontSize } from '@utils/textUtils';

interface CounterDirectionProps {
  mascotIsActive: boolean;
  wayIsChange: boolean;
  way: Way;
  currentCount: number;
  repeatRules: RepeatRule[];
  imageWidth: number;
  imageHeight: number;
  onToggleWay: () => void;
}

// 버블 이미지 크기 상수
const BUBBLE_SIZE_SCALE = 1.15; // 버블 이미지 크기 배율

// 텍스트 컨테이너 위치 상수
const TEXT_CONTAINER_LEFT_RATIO = 0.2; // 텍스트 컨테이너의 좌측 오프셋 비율 (이미지 너비 대비)
const TEXT_CONTAINER_WIDTH_RATIO = 0.6; // 텍스트 컨테이너의 너비 비율 (이미지 너비 대비)

// 규칙 순회 간격
const RULE_ROTATION_INTERVAL_MS = 2000; // 규칙 순회 간격 (밀리초)
const DIRECTION_VERTICAL_OFFSET_RATIO = 0.18; // 방향 컴포넌트 세로 오프셋 (이미지 높이 비율)

/**
 * 카운터 방향 표시 컴포넌트
 * mascotIsActive가 true일 때만 표시되고, wayIsChange가 true일 때만 클릭으로 방향 토글 가능합니다.
 * 규칙이 적용되는 단에서는 emphasis 이미지를 표시합니다.
 */
const CounterDirection: React.FC<CounterDirectionProps> = ({
  mascotIsActive,
  wayIsChange,
  way,
  currentCount,
  repeatRules,
  imageWidth,
  imageHeight,
  onToggleWay,
}) => {
  /**
   * 현재 단수에 적용되는 규칙들
   * - 여러 규칙이 한 단에 동시에 적용될 수 있음
   */
  const appliedRules = repeatRules.filter((rule) => isRuleApplied(currentCount, rule));
  const isRuleAppliedToCurrentCount = appliedRules.length > 0;

  /**
   * appliedRules가 "내용상" 바뀌었는지 감지하기 위한 키
   * - 배열 참조는 렌더마다 새로 만들어질 수 있으므로, effect 의존성에 배열 자체를 넣지 않기 위해 사용
   * - 순회 표시(2초마다 변경)는 규칙 목록이 바뀌면(추가/삭제/수정/적용 단 변경) 즉시 초기화되어야 함
   */
  const appliedRulesKey = JSON.stringify(
    appliedRules.map((r) => ({
      message: r.message,
      startNumber: r.startNumber,
      endNumber: r.endNumber,
      ruleNumber: r.ruleNumber,
    }))
  );

  // 여러 규칙이 있을 때 순회를 위한 상태
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * 적용 규칙이 바뀌면(또는 단수가 바뀌면) 표시 인덱스를 0으로 리셋
   * - 새 단으로 이동했거나
   * - 같은 단이라도 규칙 편집으로 인해 적용 규칙 목록이 달라졌을 때
   */
  useEffect(() => {
    setCurrentRuleIndex(0);
  }, [currentCount, appliedRulesKey]);

  /**
   * 적용 규칙이 2개 이상이면 2초마다 메시지를 순회
   * - 규칙 목록이 바뀌면 기존 interval을 정리하고 새로 시작
   */
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (appliedRules.length > 1) {
      const rulesLength = appliedRules.length;
      intervalRef.current = setInterval(() => {
        setCurrentRuleIndex((prevIndex) => (prevIndex + 1) % rulesLength);
      }, RULE_ROTATION_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [appliedRulesKey, appliedRules.length]);

  // 현재 표시할 규칙 (안전하게 인덱스 보정)
  const currentRule =
    appliedRules.length > 0 ? appliedRules[currentRuleIndex % appliedRules.length] : undefined;

  // 텍스트 길이에 따라 폰트 크기를 미리 계산
  const textFontSize = useMemo(() => {
    if (!currentRule?.message) {
      return imageHeight * 0.3;
    }
    return calculateInitialFontSize(currentRule.message.length, imageWidth, imageHeight);
  }, [currentRule?.message, imageHeight, imageWidth]);

  if (!mascotIsActive) {
    return null;
  }

  // 이미지 선택 로직
  let imageSource;
  if (isRuleAppliedToCurrentCount) {
    // 규칙이 적용되는 단: emphasis 이미지 사용
    if (wayIsChange) {
      imageSource = way === 'front' ? directionImages.emphasis_front : directionImages.emphasis_back;
    } else {
      imageSource = directionImages.emphasis_plain;
    }
  } else {
    // 규칙이 적용되지 않는 단: 기존 이미지 사용
    if (wayIsChange) {
      imageSource = way === 'front' ? directionImages.way_front : directionImages.way_back;
    } else {
      imageSource = directionImages.way_plain;
    }
  }

  return (
    <View style={{ height: imageHeight }}>
      <Pressable
        onPress={wayIsChange ? onToggleWay : undefined}
        style={{ transform: [{ translateY: imageHeight * DIRECTION_VERTICAL_OFFSET_RATIO }] }}
        focusable={false}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <View className="relative" style={{ width: imageWidth, height: imageHeight }}>
          {/* 규칙이 적용되는 경우: bubble 이미지 (way 이미지 아래, y축으로 위에 위치) */}
          {isRuleAppliedToCurrentCount && currentRule && (
            <>
              {/* 다중 규칙일 때: 다음 규칙 미리보기 버블 (y- x- z-, 최대 2개) */}
              {appliedRules.length > 1 &&
                [1, 2].slice(0, Math.min(2, appliedRules.length - 1)).map((offset) => {
                  const nextRule = appliedRules[(currentRuleIndex + offset) % appliedRules.length];
                  const bubbleWidth = imageWidth * BUBBLE_SIZE_SCALE;
                  const bubbleHeight = imageHeight * BUBBLE_SIZE_SCALE;
                  // 원래 버블의 중앙 x 좌표를 유지하도록 left 위치 조정
                  const originalCenterX = imageWidth * 0.05 + imageWidth / 2;
                  const newLeft = originalCenterX - bubbleWidth / 2 - imageWidth * 0.04 * offset;
                  return (
                    // 미리보기 버블
                    <View
                      key={offset}
                      style={{
                        position: 'absolute',
                        width: bubbleWidth,
                        height: bubbleHeight,
                        top: imageHeight * -0.8 - imageHeight * 0.08 * offset,
                        left: newLeft,
                        zIndex: -offset,
                      }}
                    >
                      <EmphasisBubbleIcon
                        width={bubbleWidth}
                        height={bubbleHeight}
                        color={nextRule.color}
                      />
                    </View>
                  );
                })}
              {/* 다중 규칙일 때 라벨 표시 (말풍선 위쪽에 분리, 터치 통과 → 아래 Pressable 전달) */}
              {appliedRules.length > 1 && (
                <View
                  className="absolute left-0 right-0 items-center"
                  style={{
                    top: imageHeight * -1.3,
                    zIndex: 10,
                  }}
                  pointerEvents="none"
                >
                  <Text className="text-sm text-darkgray text-center font-bold">
                    {currentRuleIndex + 1}/{appliedRules.length}
                  </Text>
                </View>
              )}
              {/* 규칙 말풍선 이미지 */}
              <View
                style={{
                  position: 'absolute',
                  width: imageWidth * BUBBLE_SIZE_SCALE,
                  height: imageHeight * BUBBLE_SIZE_SCALE,
                  top: imageHeight * -0.8,
                  // 원래 버블의 중앙 x 좌표를 유지하도록 left 위치 조정
                  left: imageWidth * 0.05 + imageWidth / 2 - (imageWidth * BUBBLE_SIZE_SCALE) / 2,
                  zIndex: 0, // way 이미지보다 아래
                }}
              >
                <EmphasisBubbleIcon
                  width={imageWidth * BUBBLE_SIZE_SCALE}
                  height={imageHeight * BUBBLE_SIZE_SCALE}
                  color={currentRule.color}
                />
              </View>
              {/* 규칙 메시지 텍스트 (말풍선 위에 표시) */}
              <View
                style={{
                  position: 'absolute',
                  top: imageHeight * -0.8,
                  left: imageWidth * TEXT_CONTAINER_LEFT_RATIO,
                  width: imageWidth * TEXT_CONTAINER_WIDTH_RATIO,
                  height: imageHeight,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1, // 버블 이미지 위에 텍스트
                }}
              >
                {/* 규칙 메시지 텍스트 */}
                <Text
                  className="font-bold text-center"
                  style={{
                    fontSize: textFontSize,
                    color: isDarkColor(currentRule.color) ? '#ffffff' : '#000000',
                  }}
                  allowFontScaling={false}
                >
                  {currentRule.message}
                </Text>
              </View>
            </>
          )}
          {/* 방향 이미지 마스코트 어쩌미 (위에 표시) */}
          <Image
            source={imageSource}
            style={{
              width: imageWidth,
              height: imageHeight,
              resizeMode: 'contain',
              zIndex: 2, // 버블 이미지보다 위
            }}
          />
        </View>
      </Pressable>
    </View>
  );
};

export default CounterDirection;
