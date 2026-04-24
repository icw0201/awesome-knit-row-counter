// src/components/counter/CounterDirection.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Pressable, Text } from 'react-native';
import Animated, { Keyframe, LinearTransition } from 'react-native-reanimated';
import { Way, RepeatRule } from '@storage/types';
import { directionImages } from '@assets/images';
import EmphasisBubbleIcon from '@assets/images/way/emphasis_bubble.svg';
import { usePreferReducedMotion } from '@hooks/usePreferReducedMotion';
import { appTheme } from '@styles/appTheme';
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
  onLongPress?: () => void;
}

// 버블 이미지 크기 상수
const BUBBLE_SIZE_SCALE = 1.15; // 버블 이미지 크기 배율
const MAX_VISIBLE_RULE_BUBBLES = 3; // 현재 포함 최대 3개의 말풍선만 노출
const STACK_VERTICAL_GAP_RATIO = 0.14; // 말풍선 스택 간 세로 간격
const STACK_SCALE_STEP = 0.12; // 뒤쪽 말풍선 축소 비율
const BUBBLE_STACK_TOP_RATIO = -0.8; // 스택 맨 앞(stackIndex=0) 말풍선의 세로 위치 (이미지 높이 비율)

// 텍스트 컨테이너 위치 상수
const TEXT_CONTAINER_LEFT_RATIO = 0.2; // 텍스트 컨테이너의 좌측 오프셋 비율 (이미지 너비 대비)
const TEXT_CONTAINER_WIDTH_RATIO = 0.6; // 텍스트 컨테이너의 너비 비율 (이미지 너비 대비)
const DEFAULT_TEXT_FONT_SIZE_RATIO = 0.3; // 메시지가 없을 때 사용할 기본 폰트 크기 (이미지 높이 비율)

// 다중 규칙 라벨 위치 (말풍선 스택 위쪽에 분리 표시)
const MULTI_RULE_LABEL_BASE_TOP_RATIO = -1.3;

// 규칙 순회 간격
const RULE_ROTATION_INTERVAL_MS = 2000; // 규칙 순회 간격 (밀리초)
const DIRECTION_VERTICAL_OFFSET_RATIO = 0.18; // 방향 컴포넌트 세로 오프셋 (이미지 높이 비율)
const DISAPPEARING_BUBBLE_ANIMATION_DURATION_MS = 260; // 사라지는 말풍선 애니메이션 길이
const FLOATING_THIRD_BUBBLE_ANIMATION_DURATION_MS = 460; // 마지막 말풍선 떠오름 애니메이션 길이
const STACK_LAYOUT_TRANSITION_DURATION_MS = 280; // 중간 말풍선 위치 전환 애니메이션 길이

const BUBBLE_BASE_LEFT_RATIO = 0.05 + 0.5 - BUBBLE_SIZE_SCALE / 2;
const TEXT_CONTAINER_IN_BUBBLE_LEFT_RATIO =
  (TEXT_CONTAINER_LEFT_RATIO - BUBBLE_BASE_LEFT_RATIO) / BUBBLE_SIZE_SCALE;
const TEXT_CONTAINER_IN_BUBBLE_WIDTH_RATIO = TEXT_CONTAINER_WIDTH_RATIO / BUBBLE_SIZE_SCALE;

/**
 * 퇴장 시 재생되는 블러 잔상 레이어 구성
 * - 본체가 블러로 사라질 때 살짝 뒤로 번지는 잔상 효과를 내기 위해
 *   크기·투명도·세로 오프셋을 조금씩 다르게 한 복제 레이어를 겹쳐서 렌더링한다.
 */
const DISAPPEARING_GHOST_LAYERS: ReadonlyArray<{
  opacity: number;
  scale: number;
  verticalOffsetRatio: number;
}> = [
  { opacity: 0.16, scale: 1.05, verticalOffsetRatio: 0 },
  { opacity: 0.1, scale: 1.12, verticalOffsetRatio: 0.015 },
  { opacity: 0.06, scale: 1.19, verticalOffsetRatio: 0.03 },
];

/**
 * 규칙 고유 key 생성 함수
 * - 동일 규칙인지 판별할 때 사용
 * - 스택 내 렌더링 key는 여기에 "도착 시점"을 덧붙여 중복을 방지한다 (visibleRules 참고)
 */
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
 * 현재 단의 규칙 적용 여부와 방향 토글 가능 여부에 따라 마스코트 방향 이미지를 선택한다.
 */
const resolveDirectionImage = (
  isRuleAppliedToCurrentCount: boolean,
  wayIsChange: boolean,
  way: Way,
) => {
  if (isRuleAppliedToCurrentCount) {
    if (!wayIsChange) {
      return directionImages.emphasis_plain;
    }
    return way === 'front' ? directionImages.emphasis_front : directionImages.emphasis_back;
  }
  if (!wayIsChange) {
    return directionImages.way_plain;
  }
  return way === 'front' ? directionImages.way_front : directionImages.way_back;
};

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
  onLongPress,
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

  /**
   * 여러 규칙이 있을 때 순회를 위한 상태 (단조증가 카운터)
   * - `% rulesLength`로 나눈 값이 실제 표시 인덱스이지만,
   *   내부적으로는 절대 리셋되지 않는 단조증가 값으로 관리한다.
   * - 이렇게 해야 말풍선 key에 섞는 "도착 시점"이 순환/리셋으로 인해
   *   충돌(같은 규칙의 서로 다른 인스턴스가 동일 key를 갖는 문제)하지 않는다.
   */
  const [rotationCount, setRotationCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasMountedStackRef = useRef(false);

  /**
   * 적용 규칙이 바뀌면(또는 단수가 바뀌면) 표시 인덱스를 0으로 리셋
   * - 새 단으로 이동했거나
   * - 같은 단이라도 규칙 편집으로 인해 적용 규칙 목록이 달라졌을 때
   */
  useEffect(() => {
    setRotationCount(0);
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
      intervalRef.current = setInterval(() => {
        setRotationCount((prevCount) => prevCount + 1);
      }, RULE_ROTATION_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [appliedRulesKey, appliedRules.length]);

  /**
   * 현재 규칙부터 뒤쪽 규칙까지 최대 3개를 스택으로 표시
   * - stackIndex 0 = 맨 앞(현재 표시 중인 말풍선)
   * - stackIndex visibleCount-1 = 스택의 꼬리(가장 뒤, 가장 위쪽)
   * - arrivalTime = 해당 말풍선이 처음 꼬리에 도착했던 시점의 rotationCount (단조증가)
   *   - 같은 규칙이 순환 중 반복적으로 등장할 때, 서로 다른 "인스턴스"로 구분하기 위한 키 요소
   *   - 2~3개 규칙에서도 퇴장/진입이 실제 mount/unmount로 일어나게 해서 애니메이션이 자연스럽게 적용됨
   */
  const visibleRules = useMemo(() => {
    if (appliedRules.length === 0) {
      return [];
    }

    const rulesLength = appliedRules.length;
    const visibleCount = Math.min(MAX_VISIBLE_RULE_BUBBLES, rulesLength);
    return Array.from({ length: visibleCount }, (_, stackIndex) => {
      const rule = appliedRules[(rotationCount + stackIndex) % rulesLength];
      const arrivalTime = rotationCount - (visibleCount - 1 - stackIndex);
      return {
        stackIndex,
        rule,
        bubbleKey: `${buildRuleKey(rule)}@${arrivalTime}`,
      };
    });
  }, [appliedRules, rotationCount]);

  const currentRule = visibleRules[0]?.rule;
  // 사용자에게 보여줄 1-based 인덱스는 순환값 사용
  const displayRuleIndex =
    appliedRules.length > 0 ? (rotationCount % appliedRules.length) + 1 : 0;

  useEffect(() => {
    hasMountedStackRef.current = true;
  }, []);

  // 텍스트 길이에 따라 폰트 크기를 미리 계산
  const textFontSize = useMemo(() => {
    if (!currentRule?.message) {
      return imageHeight * DEFAULT_TEXT_FONT_SIZE_RATIO;
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
      }).duration(DISAPPEARING_BUBBLE_ANIMATION_DURATION_MS),
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
      }).duration(DISAPPEARING_BUBBLE_ANIMATION_DURATION_MS),
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
      }).duration(FLOATING_THIRD_BUBBLE_ANIMATION_DURATION_MS),
    [imageHeight]
  );

  if (!mascotIsActive) {
    return null;
  }

  // 현재 단의 규칙 적용 여부와 방향 토글 가능 여부에 따라 마스코트 이미지 선택
  const imageSource = resolveDirectionImage(isRuleAppliedToCurrentCount, wayIsChange, way);

  const bubbleBaseWidth = imageWidth * BUBBLE_SIZE_SCALE;
  const bubbleBaseHeight = imageHeight * BUBBLE_SIZE_SCALE;
  const bubbleBaseLeft = imageWidth * BUBBLE_BASE_LEFT_RATIO;
  const bubbleBaseTop = imageHeight * BUBBLE_STACK_TOP_RATIO;

  return (
    <View style={{ height: imageHeight }}>
      <Pressable
        onPress={wayIsChange ? onToggleWay : undefined}
        onLongPress={onLongPress}
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
                      (MULTI_RULE_LABEL_BASE_TOP_RATIO -
                        STACK_VERTICAL_GAP_RATIO * Math.max(0, visibleRules.length - 2)),
                    zIndex: 1,
                  }}
                  pointerEvents="none"
                >
                  <Text className="text-sm text-darkgray text-center font-bold">
                    {displayRuleIndex}/{appliedRules.length}
                  </Text>
                </View>
              )}
              {/* 규칙 말풍선 스택 (뒤쪽으로 갈수록 y축으로만 이동하고 점점 작아짐) */}
              {visibleRules
                .slice()
                .reverse()
                .map(({ stackIndex, rule, bubbleKey }) => {
                  const scale = 1 - STACK_SCALE_STEP * stackIndex;
                  const bubbleTop = bubbleBaseTop - imageHeight * STACK_VERTICAL_GAP_RATIO * stackIndex;
                  const isCurrentBubble = stackIndex === 0;
                  const shouldAnimate = hasMountedStackRef.current && !preferReducedMotion;
                  /**
                   * 꼬리(가장 뒤)에서 새로 들어오는 말풍선은 떠오름 애니메이션을 적용
                   * - 2개 규칙: 꼬리가 stackIndex 1이므로 이 조건에 걸리지 않아 그냥 등장
                   * - 3개 이상: 꼬리가 stackIndex 2이므로 떠오름 애니메이션 적용
                   */
                  const shouldUseFloatingEnter =
                    shouldAnimate && stackIndex === MAX_VISIBLE_RULE_BUBBLES - 1;

                  return (
                    <Animated.View
                      key={bubbleKey}
                      layout={
                        preferReducedMotion
                          ? undefined
                          : LinearTransition.duration(STACK_LAYOUT_TRANSITION_DURATION_MS)
                      }
                      entering={shouldUseFloatingEnter ? floatingThirdBubbleEnterAnimation : undefined}
                      exiting={shouldAnimate ? disappearingBubbleExitAnimation : undefined}
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        width: bubbleBaseWidth,
                        height: bubbleBaseHeight,
                        top: bubbleTop,
                        left: bubbleBaseLeft,
                        zIndex: 1,
                      }}
                    >
                      {/* 퇴장 시에만 잠깐 보이는 블러 잔상 레이어 (평상시 opacity 0) */}
                      <Animated.View
                        pointerEvents="none"
                        exiting={shouldAnimate ? disappearingBubbleGhostExitAnimation : undefined}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: bubbleBaseWidth,
                          height: bubbleBaseHeight,
                          opacity: 0,
                        }}
                      >
                        {DISAPPEARING_GHOST_LAYERS.map((layer, layerIndex) => (
                          <View
                            key={`${bubbleKey}-ghost-${layerIndex}`}
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              top: imageHeight * layer.verticalOffsetRatio,
                              left: 0,
                              width: bubbleBaseWidth,
                              height: bubbleBaseHeight,
                              opacity: layer.opacity,
                              transform: [{ scale: layer.scale }],
                            }}
                          >
                            <EmphasisBubbleIcon
                              width={bubbleBaseWidth}
                              height={bubbleBaseHeight}
                              color={rule.color}
                            />
                          </View>
                        ))}
                      </Animated.View>
                      {/* 본체 말풍선 아이콘 (스택 깊이에 따라 scale 적용) */}
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
                      {/* 맨 앞 말풍선에만 규칙 메시지 텍스트 표시 */}
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
                          <Text
                            className="font-bold text-center"
                            style={{
                              fontSize: textFontSize,
                              color: isDarkColor(rule.color)
                                ? appTheme.colors.white
                                : appTheme.colors.black,
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
