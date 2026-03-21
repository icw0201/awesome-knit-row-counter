// src/components/counter/SubCounterTouchArea.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface SubCounterTouchAreaProps {
  handleWidth?: number;
  onAdd?: () => void;
  onSubtract?: () => void;
}

/**
 * 보조 카운터 터치 영역 컴포넌트
 * 보조모달용 작은 터치 영역 UI (누르고 있는 동안 배경색 변경)
 *
 * Pressable 대신 responder가 달린 View를 사용해,
 * 하드웨어 키보드 포커스는 막고 손가락 터치만 받도록 구성한다.
 */
const SubCounterTouchArea: React.FC<SubCounterTouchAreaProps> = ({
  handleWidth = 30,
  onAdd,
  onSubtract,
}) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  return (
    <View
      className="absolute top-0 left-0 right-0 bottom-0 flex-row"
      // SlideModal이 children과 핸들이 겹치지 않게 오른쪽에 여유를 두는 만큼,
      // 터치 영역(배경)의 중앙도 동일하게 맞춰준다.
      style={{ paddingRight: handleWidth * 0.4 }}
    >
      {/* 왼쪽 영역 (감소) - 투명 배경 */}
      <View
        className={`flex-1 items-start justify-center ${leftPressed ? 'bg-gray-100' : 'bg-transparent'}`}
        focusable={false}
        accessible={false}
        // 이 터치 레이어를 포커스/접근성 대상에서 제외해
        // 하드웨어 키보드 입력 시 서브 카운터 영역으로 포커스가 들어오지 않게 한다.
        importantForAccessibility="no-hide-descendants"
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => setLeftPressed(true)}
        onResponderRelease={() => {
          setLeftPressed(false);
          onSubtract?.();
        }}
        onResponderTerminate={() => setLeftPressed(false)}
      >
        <Minus
          size={24}
          color="#fc3e39"
          strokeWidth={2}
          className="ml-3"
        />
      </View>

      {/* 오른쪽 영역 (증가) - 투명 배경 */}
      <View
        className={`flex-1 items-end justify-center ${rightPressed ? 'bg-gray-100' : 'bg-transparent'}`}
        focusable={false}
        accessible={false}
        // 오른쪽 영역도 같은 이유로 포커스/접근성 대상에서 제외한다.
        importantForAccessibility="no-hide-descendants"
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => setRightPressed(true)}
        onResponderRelease={() => {
          setRightPressed(false);
          onAdd?.();
        }}
        onResponderTerminate={() => setRightPressed(false)}
      >
        <Plus
          size={24}
          color="#fc3e39"
          strokeWidth={2}
          className="mr-3"
        />
      </View>
    </View>
  );
};

export default SubCounterTouchArea;
