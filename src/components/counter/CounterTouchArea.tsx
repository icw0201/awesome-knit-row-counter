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

  const flashPressedState = (
    setPressed: React.Dispatch<React.SetStateAction<boolean>>,
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => {
    clearPressedTimeout(timeoutRef);
    setPressed(true);
    timeoutRef.current = setTimeout(() => {
      setPressed(false);
      timeoutRef.current = null;
    }, 100);
  };

  const handleSubtractPress = () => {
    flashPressedState(setLeftPressed, leftPressedTimeoutRef);
    onSubtract();
  };

  const handleAddPress = () => {
    flashPressedState(setRightPressed, rightPressedTimeoutRef);
    onAdd();
  };

  useEffect(() => {
    return () => {
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
