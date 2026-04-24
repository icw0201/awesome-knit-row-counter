// src/components/counter/CounterTouchArea.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Minus, Plus, Speech } from 'lucide-react-native';
import { appTheme } from '@styles/appTheme';

interface CounterTouchAreaProps {
  onAdd: () => void;
  onSubtract: () => void;
  highlightedAction?: 'add' | 'subtract' | null;
  showVoiceCommandHints?: boolean;
  addVoiceHint?: string;
  subtractVoiceHint?: string;
  disabled?: boolean;
}

/**
 * 카운터 터치 영역 컴포넌트
 * 좌우 터치로 숫자 증가/감소를 처리합니다.
 */
const CounterTouchArea: React.FC<CounterTouchAreaProps> = ({
  onAdd,
  onSubtract,
  highlightedAction = null,
  showVoiceCommandHints = false,
  addVoiceHint = '곤지',
  subtractVoiceHint = '연지',
  disabled = false,
}) => {
  const isSubtractHighlighted = highlightedAction === 'subtract';
  const isAddHighlighted = highlightedAction === 'add';
  const voiceHintIconColor = appTheme.colors.darkgray;
  const subtractBackgroundColor = isSubtractHighlighted
    ? appTheme.colors.neutral['100']
    : appTheme.colors.white;
  const addBackgroundColor = isAddHighlighted
    ? appTheme.colors.primary['200']
    : appTheme.colors.primary['100'];

  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 flex-row">
      {/* 왼쪽 터치 영역 (감소) - 37% */}
      <View
        className="items-start justify-center"
        style={{ width: '37%', backgroundColor: subtractBackgroundColor }}
        focusable={false}
        accessible={false}
        // 이 오버레이는 화면 전체를 덮는 입력 레이어라 접근성/포커스를 열어두면
        // 하드웨어 키보드 포커스가 여기로 들어와 잘못된 하이라이트가 생길 수 있다.
        importantForAccessibility="no-hide-descendants"
        onStartShouldSetResponder={() => !disabled}
        onResponderRelease={() => onSubtract()}
      >
        <View className="relative ml-3 items-center">
          <Minus
            size={60}
            color={appTheme.colors.primary['500']}
            strokeWidth={2}
          />
          {showVoiceCommandHints && (
            <View className="absolute top-[68px] flex-row items-center">
              <Speech size={16} color={voiceHintIconColor} strokeWidth={2} />
              <Text className="ml-1 text-sm text-darkgray">{subtractVoiceHint}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 오른쪽 터치 영역 (증가) - 63% */}
      <View
        className="items-end justify-center"
        style={{ width: '63%', backgroundColor: addBackgroundColor }}
        focusable={false}
        accessible={false}
        // 오른쪽 영역도 같은 이유로 포커스/접근성 대상에서 제외한다.
        importantForAccessibility="no-hide-descendants"
        onStartShouldSetResponder={() => !disabled}
        onResponderRelease={() => onAdd()}
      >
        <View className="relative mr-3 items-center">
          <Plus
            size={60}
            color={appTheme.colors.primary['500']}
            strokeWidth={2}
          />
          {showVoiceCommandHints && (
            <View className="absolute top-[68px] flex-row items-center">
              <Speech size={16} color={voiceHintIconColor} strokeWidth={2} />
              <Text className="ml-1 text-sm text-darkgray">{addVoiceHint}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default CounterTouchArea;
