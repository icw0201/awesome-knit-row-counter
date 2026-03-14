// src/components/counter/CounterTouchArea.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface CounterTouchAreaProps {
  onAdd: () => void;
  onSubtract: () => void;
  highlightedAction?: 'add' | 'subtract' | null;
}

/**
 * 카운터 터치 영역 컴포넌트
 * 좌우 터치로 숫자 증가/감소를 처리합니다.
 */
const CounterTouchArea: React.FC<CounterTouchAreaProps> = ({
  onAdd,
  onSubtract,
  highlightedAction = null,
}) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const isSubtractHighlighted = leftPressed || highlightedAction === 'subtract';
  const isAddHighlighted = rightPressed || highlightedAction === 'add';
  const leftPressedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightPressedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPressedTimeout = (timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  /**
   * 특정 영역의 "눌린 상태"를 잠깐 켰다가 자동으로 끄는 공통 함수.
   *
   * 왜 timeoutRef를 같이 받나:
   * - 사용자가 아주 빠르게 여러 번 누르면 이전 setTimeout이 아직 살아있을 수 있다.
   * - 그 상태에서 새 타이머를 또 만들면 true/false 전환 타이밍이 꼬일 수 있어서
   *   먼저 이전 타이머를 취소한 뒤 새 타이머를 등록한다.
   */
  const flashPressedState = (
    setPressed: React.Dispatch<React.SetStateAction<boolean>>,
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => {
    // 이전에 예약된 "끄기" 타이머가 있으면 먼저 취소한다.
    clearPressedTimeout(timeoutRef);

    // 즉시 눌린 상태로 바꿔 배경 하이라이트를 켠다.
    setPressed(true);

    // 100ms 뒤 눌린 상태를 해제해 짧은 터치 피드백만 남긴다.
    timeoutRef.current = setTimeout(() => {
      setPressed(false);
      timeoutRef.current = null;
    }, 100);
  };

  /**
   * 1. 왼쪽 영역 배경색을 잠깐 바꿔서 눌린 느낌을 준다.
   * 2. 부모로부터 받은 `onSubtract()`를 호출해서 실제 카운트를 감소시킨다.
   */
  const handleSubtractPress = () => {
    flashPressedState(setLeftPressed, leftPressedTimeoutRef);
    onSubtract();
  };

  /**
   * 1. 오른쪽 영역 하이라이트를 잠깐 켠다.
   * 2. `onAdd()`를 호출해서 실제 카운트를 증가시킨다.
   */
  const handleAddPress = () => {
    flashPressedState(setRightPressed, rightPressedTimeoutRef);
    onAdd();
  };

  useEffect(() => {
    return () => {
      // 언마운트 시 타이머 정리
      clearPressedTimeout(leftPressedTimeoutRef);
      clearPressedTimeout(rightPressedTimeoutRef);
    };
  }, []);

  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 flex-row">
      {/* 왼쪽 터치 영역 (감소) - 37% */}
      <View
        className={`items-start justify-center ${isSubtractHighlighted ? 'bg-gray-100' : 'bg-white'}`}
        style={{ width: '37%' }}
        focusable={false}
        accessible={false}
        // 이 오버레이는 화면 전체를 덮는 입력 레이어라 접근성/포커스를 열어두면
        // 하드웨어 키보드 포커스가 여기로 들어와 잘못된 하이라이트가 생길 수 있다.
        importantForAccessibility="no-hide-descendants"
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleSubtractPress}
      >
        <Minus
          size={60}
          color="#fc3e39"
          strokeWidth={2}
          className="ml-3"
        />
      </View>

      {/* 오른쪽 터치 영역 (증가) - 63% */}
      <View
        className={`items-end justify-center ${isAddHighlighted ? 'bg-red-200' : 'bg-red-100'}`}
        style={{ width: '63%' }}
        focusable={false}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleAddPress}
      >
        <Plus
          size={60}
          color="#fc3e39"
          strokeWidth={2}
          className="mr-3"
        />
      </View>
    </View>
  );
};

export default CounterTouchArea;
