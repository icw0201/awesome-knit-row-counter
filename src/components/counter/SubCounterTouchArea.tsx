// src/components/counter/SubCounterTouchArea.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Minus, Plus, Speech } from 'lucide-react-native';

interface SubCounterTouchAreaProps {
  handleWidth?: number;
  onAdd?: () => void;
  onSubtract?: () => void;
  showVoiceCommandHints?: boolean;
  highlightedAction?: 'add' | 'subtract' | null;
}

/**
 * 보조 카운터 터치 영역 컴포넌트
 * 보조모달용 작은 터치 영역 UI
 *
 * Pressable 대신 responder가 달린 View를 사용해,
 * 하드웨어 키보드 포커스는 막고 손가락 터치만 받도록 구성한다.
 */
const SubCounterTouchArea: React.FC<SubCounterTouchAreaProps> = ({
  handleWidth = 30,
  onAdd,
  onSubtract,
  showVoiceCommandHints = false,
  highlightedAction = null,
}) => {
  const voiceHintIconColor = '#767676';
  const isSubtractHighlighted = highlightedAction === 'subtract';
  const isAddHighlighted = highlightedAction === 'add';

  return (
    <View
      className="absolute top-0 left-0 right-0 bottom-0 flex-row"
      // SlideModal이 children과 핸들이 겹치지 않게 오른쪽에 여유를 두는 만큼,
      // 터치 영역(배경)의 중앙도 동일하게 맞춰준다.
      style={{ paddingRight: handleWidth * 0.4 }}
    >
      {/* 왼쪽 영역 (감소) - 투명 배경 */}
      <View
        className={`flex-1 items-start justify-center ${isSubtractHighlighted ? 'bg-gray-100' : 'bg-transparent'}`}
        focusable={false}
        accessible={false}
        // 이 터치 레이어를 포커스/접근성 대상에서 제외해
        // 하드웨어 키보드 입력 시 서브 카운터 영역으로 포커스가 들어오지 않게 한다.
        importantForAccessibility="no-hide-descendants"
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => onSubtract?.()}
      >
        <View
          className="relative ml-5 items-center"
          style={{ transform: [{ translateY: -10 }] }}
        >
          <Minus
            size={24}
            color="#fc3e39"
            strokeWidth={2}
          />
          {showVoiceCommandHints && (
            <View className="absolute top-8 flex-row items-center">
              <Speech size={12} color={voiceHintIconColor} strokeWidth={2} />
              <Text className="ml-1 text-xs text-darkgray">청실</Text>
            </View>
          )}
        </View>
      </View>

      {/* 오른쪽 영역 (증가) - 투명 배경 */}
      <View
        className={`flex-1 items-end justify-center ${isAddHighlighted ? 'bg-gray-100' : 'bg-transparent'}`}
        focusable={false}
        accessible={false}
        // 오른쪽 영역도 같은 이유로 포커스/접근성 대상에서 제외한다.
        importantForAccessibility="no-hide-descendants"
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => onAdd?.()}
      >
        <View
          className="relative mr-5 items-center"
          style={{ transform: [{ translateY: -10 }] }}
        >
          <Plus
            size={24}
            color="#fc3e39"
            strokeWidth={2}
          />
          {showVoiceCommandHints && (
            <View className="absolute top-8 flex-row items-center">
              <Speech size={12} color={voiceHintIconColor} strokeWidth={2} />
              <Text className="ml-1 text-xs text-darkgray">홍실</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default SubCounterTouchArea;
