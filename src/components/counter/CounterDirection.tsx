// src/components/counter/CounterDirection.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Pressable, Text } from 'react-native';
import Animated, { FadeIn, Keyframe, LinearTransition } from 'react-native-reanimated';
import { Way, RepeatRule } from '@storage/types';
import { directionImages } from '@assets/images';
import EmphasisBubbleIcon from '@assets/images/way/emphasis_bubble.svg';
import { usePreferReducedMotion } from '@hooks/usePreferReducedMotion';
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
const MAX_VISIBLE_RULE_BUBBLES = 3; // 현재 포함 최대 3개의 말풍선만 노출
const STACK_VERTICAL_GAP_RATIO = 0.14; // 말풍선 스택 간 세로 간격
const STACK_SCALE_STEP = 0.12; // 뒤쪽 말풍선 축소 비율

// 텍스트 컨테이너 위치 상수
const TEXT_CONTAINER_LEFT_RATIO = 0.2; // 텍스트 컨테이너의 좌측 오프셋 비율 (이미지 너비 대비)
const TEXT_CONTAINER_WIDTH_RATIO = 0.6; // 텍스트 컨테이너의 너비 비율 (이미지 너비 대비)

// 규칙 순회 간격
const RULE_ROTATION_INTERVAL_MS = 2000; // 규칙 순회 간격 (밀리초)
const DIRECTION_VERTICAL_OFFSET_RATIO = 0.18; // 방향 컴포넌트 세로 오프셋 (이미지 높이 비율)

const BUBBLE_BASE_LEFT_RATIO = 0.05 + 0.5 - BUBBLE_SIZE_SCALE / 2;
const TEXT_CONTAINER_IN_BUBBLE_LEFT_RATIO =
  (TEXT_CONTAINER_LEFT_RATIO - BUBBLE_BASE_LEFT_RATIO) / BUBBLE_SIZE_SCALE;
const TEXT_CONTAINER_IN_BUBBLE_WIDTH_RATIO = TEXT_CONTAINER_WIDTH_RATIO / BUBBLE_SIZE_SCALE;

const buildRuleKey = (rule: RepeatRule) =>
  [
    rule.ruleNumber,
    rule.startNumber ?? 'none',
    rule.endNumber,
    rule.repeatCount ?? 0,
    rule.message,
    rule.color,
  ].join(':');

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
  const preferReducedMotion = usePreferReducedMotion();
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
      startNumber: r.startNumber ?? 'none',
      endNumber: r.endNumber,
      repeatCount: r.repeatCount ?? 0,
      ruleNumber: r.ruleNumber,
    }))
  );

  // 여러 규칙이 있을 때 순회를 위한 상태
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousVisibleRuleKeysRef = useRef<string[]>([]);
  const hasMountedStackRef = useRef(false);

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

  // 현재 규칙부터 뒤쪽 규칙까지 최대 3개를 스택으로 표시
  const visibleRules = useMemo(() => {
    if (appliedRules.length === 0) {
      return [];
    }

    const visibleCount = Math.min(MAX_VISIBLE_RULE_BUBBLES, appliedRules.length);
    return Array.from({ length: visibleCount }, (_, stackIndex) => ({
      stackIndex,
      rule: appliedRules[(currentRuleIndex + stackIndex) % appliedRules.length],
    }));
  }, [appliedRules, currentRuleIndex]);

  const currentRule = visibleRules[0]?.rule;
  const visibleRuleKeys = visibleRules.map(({ rule }) => buildRuleKey(rule));
  const movedToBackRuleKey =
    previousVisibleRuleKeysRef.current.length === visibleRuleKeys.length &&
    previousVisibleRuleKeysRef.current[0] === visibleRuleKeys[visibleRuleKeys.length - 1] &&
    previousVisibleRuleKeysRef.current.slice(1).every((key, index) => key === visibleRuleKeys[index])
      ? visibleRuleKeys[visibleRuleKeys.length - 1]
      : null;

  useEffect(() => {
    previousVisibleRuleKeysRef.current = visibleRuleKeys;
  }, [visibleRuleKeys]);

  useEffect(() => {
    hasMountedStackRef.current = true;
  }, []);

  // 텍스트 길이에 따라 폰트 크기를 미리 계산
  const textFontSize = useMemo(() => {
    if (!currentRule?.message) {
      return imageHeight * 0.3;
    }
    return calculateInitialFontSize(currentRule.message.length, imageWidth, imageHeight);
  }, [currentRule?.message, imageHeight, imageWidth]);
  const disappearingBubbleExitAnimation = useMemo(
    () =>
      new Keyframe({
        0: {
          opacity: 1,
          transform: [{ translateY: 0 }, { scale: 1 }],
        },
        100: {
          opacity: 0,
          transform: [{ translateY: imageHeight * 0.22 }, { scale: 1.18 }],
        },
      }).duration(260),
    [imageHeight]
  );
  const disappearingBubbleGhostExitAnimation = useMemo(
    () =>
      new Keyframe({
        0: {
          opacity: 0.22,
          transform: [{ translateY: 0 }, { scale: 1.02 }],
        },
        100: {
          opacity: 0,
          transform: [{ translateY: imageHeight * 0.1 }, { scale: 1.28 }],
        },
      }).duration(260),
    [imageHeight]
  );
  const floatingThirdBubbleEnterAnimation = useMemo(
    () =>
      new Keyframe({
        0: {
          opacity: 0.28,
          transform: [{ translateY: imageHeight * 0.13 }, { scale: 0.94 }],
        },
        55: {
          opacity: 1,
          transform: [{ translateY: imageHeight * -0.025 }, { scale: 1.02 }],
        },
        100: {
          opacity: 1,
          transform: [{ translateY: 0 }, { scale: 1 }],
        },
      }).duration(460),
    [imageHeight]
  );

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
              {/* 다중 규칙일 때 라벨 표시 (말풍선 위쪽에 분리, 터치 통과 → 아래 Pressable 전달) */}
              {appliedRules.length > 1 && (
                <View
                  className="absolute left-0 right-0 items-center"
                  style={{
                    top:
                      imageHeight *
                      (-1.3 - STACK_VERTICAL_GAP_RATIO * Math.max(0, visibleRules.length - 2)),
                    zIndex: 1,
                  }}
                  pointerEvents="none"
                >
                  <Text className="text-sm text-darkgray text-center font-bold">
                    {currentRuleIndex + 1}/{appliedRules.length}
                  </Text>
                </View>
              )}
              {/* 규칙 말풍선 스택 (뒤쪽으로 갈수록 y축으로만 이동하고 점점 작아짐) */}
              {visibleRules
                .slice()
                .reverse()
                .map(({ stackIndex, rule }) => {
                  const ruleKey = buildRuleKey(rule);
                  const bubbleBaseWidth = imageWidth * BUBBLE_SIZE_SCALE;
                  const bubbleBaseHeight = imageHeight * BUBBLE_SIZE_SCALE;
                  const bubbleBaseLeft = imageWidth * BUBBLE_BASE_LEFT_RATIO;
                  const bubbleBaseTop = imageHeight * -0.8;
                  const scale = 1 - STACK_SCALE_STEP * stackIndex;
                  const bubbleTop = bubbleBaseTop - imageHeight * STACK_VERTICAL_GAP_RATIO * stackIndex;
                  const bubbleLeft = bubbleBaseLeft;
                  const isCurrentBubble = stackIndex === 0;
                  const shouldSkipLayoutAnimation =
                    movedToBackRuleKey === ruleKey && stackIndex === visibleRules.length - 1;
                  const shouldAnimateEnterExit = hasMountedStackRef.current && !preferReducedMotion;
                  const shouldUseDisappearingExitAnimation =
                    shouldAnimateEnterExit && movedToBackRuleKey !== ruleKey;
                  const shouldUseFloatingThirdBubbleEnterAnimation =
                    shouldAnimateEnterExit && stackIndex === MAX_VISIBLE_RULE_BUBBLES - 1;

                  return (
                    <Animated.View
                      key={ruleKey}
                      layout={
                        preferReducedMotion || shouldSkipLayoutAnimation
                          ? undefined
                          : LinearTransition.duration(280)
                      }
                      entering={
                        shouldUseFloatingThirdBubbleEnterAnimation
                          ? floatingThirdBubbleEnterAnimation
                          : shouldAnimateEnterExit
                          ? FadeIn.duration(180).withInitialValues({
                              opacity: 0,
                            })
                          : undefined
                      }
                      exiting={
                        shouldUseDisappearingExitAnimation
                          ? disappearingBubbleExitAnimation
                          : undefined
                      }
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        width: bubbleBaseWidth,
                        height: bubbleBaseHeight,
                        top: bubbleTop,
                        left: bubbleLeft,
                        zIndex: 1,
                      }}
                    >
                      <Animated.View
                        pointerEvents="none"
                        exiting={
                          shouldUseDisappearingExitAnimation
                            ? disappearingBubbleGhostExitAnimation
                            : undefined
                        }
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: bubbleBaseWidth,
                          height: bubbleBaseHeight,
                          opacity: 0,
                        }}
                      >
                        {[0.16, 0.1, 0.06].map((layerOpacity, layerIndex) => {
                          const ghostScale = 1.05 + layerIndex * 0.07;
                          const ghostOffsetY = imageHeight * 0.015 * layerIndex;

                          return (
                            <View
                              key={`${ruleKey}-ghost-${layerIndex}`}
                              pointerEvents="none"
                              style={{
                                position: 'absolute',
                                top: ghostOffsetY,
                                left: 0,
                                width: bubbleBaseWidth,
                                height: bubbleBaseHeight,
                                opacity: layerOpacity,
                                transform: [{ scale: ghostScale }],
                              }}
                            >
                              <EmphasisBubbleIcon
                                width={bubbleBaseWidth}
                                height={bubbleBaseHeight}
                                color={rule.color}
                              />
                            </View>
                          );
                        })}
                      </Animated.View>
                      <View
                        style={{
                          width: bubbleBaseWidth,
                          height: bubbleBaseHeight,
                          transform: [{ scale }],
                        }}
                      >
                        <EmphasisBubbleIcon
                          width={bubbleBaseWidth}
                          height={bubbleBaseHeight}
                          color={rule.color}
                        />
                      </View>
                      {isCurrentBubble && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: bubbleBaseWidth * TEXT_CONTAINER_IN_BUBBLE_LEFT_RATIO,
                            width: bubbleBaseWidth * TEXT_CONTAINER_IN_BUBBLE_WIDTH_RATIO,
                            height: bubbleBaseHeight,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          {/* 규칙 메시지 텍스트 */}
                          <Text
                            className="font-bold text-center"
                            style={{
                              fontSize: textFontSize,
                              color: isDarkColor(rule.color) ? '#ffffff' : '#000000',
                            }}
                            allowFontScaling={false}
                          >
                            {rule.message}
                          </Text>
                        </View>
                      )}
                    </Animated.View>
                  );
                })}
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
