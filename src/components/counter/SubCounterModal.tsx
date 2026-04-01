import React from 'react';
import { View, Text } from 'react-native';
import { SlideModal } from '@components/common/modals/SlideModal/SlideModal';
import SubCounterAction from './SubCounterAction';
import SubCounterTouchArea from './SubCounterTouchArea';
import { getSubIconSize, getSubModalTextMarginClass, ScreenSize } from '@constants/screenSizeConfig';
import { DimensionValue } from 'react-native';

// ===== 타입 정의 =====
interface SubCounterModalProps {
  isOpen: boolean;
  onToggle: () => void;
  onReset?: () => void;
  onEdit?: () => void;
  onRule?: () => void;
  onAdd?: () => void;
  onSubtract?: () => void;
  showVoiceCommandHints?: boolean;
  highlightedAction?: 'add' | 'subtract' | null;
  inputDisabled?: boolean;
  handleWidth?: number;
  subCount?: number;
  subRule?: number;
  subRuleIsActive?: boolean;
  screenSize: ScreenSize;
  width: number;
  height: number;
  centerY: DimensionValue;
  /** SlideModal 패널 오른쪽에 표시 */
  sideTooltip?: React.ReactNode;
}

// ===== 메인 컴포넌트 =====
export const SubCounterModal: React.FC<SubCounterModalProps> = ({
  isOpen,
  onToggle,
  onReset,
  onEdit,
  onRule,
  onAdd,
  onSubtract,
  showVoiceCommandHints = false,
  highlightedAction = null,
  inputDisabled = false,
  handleWidth = 30,
  subCount = 0,
  subRule: _subRule = 0,
  subRuleIsActive: _subRuleIsActive = false,
  screenSize,
  width,
  height,
  centerY,
  sideTooltip,
}) => {
  // 아이콘 크기 및 간격 정보
  const iconSize = getSubIconSize(screenSize);
  const textMarginClass = getSubModalTextMarginClass(screenSize);
  return (
    <SlideModal
      isOpen={isOpen}
      onToggle={onToggle}
      height={height}
      width={width}
      handleWidth={handleWidth}
      backgroundColor="white"
      padding={0}
      centerY={centerY}
      sideTooltip={sideTooltip}
    >
      {/* 터치 영역 - 배경 100% 차지 */}
      <SubCounterTouchArea
        handleWidth={handleWidth}
        onAdd={onAdd}
        onSubtract={onSubtract}
        showVoiceCommandHints={showVoiceCommandHints}
        highlightedAction={highlightedAction}
        disabled={inputDisabled}
      />

      {/* 콘텐츠 영역 */}
      <View className="flex-1 items-center justify-center">

      <View pointerEvents="none">
        <Text className={`text-4xl font-bold text-black ${textMarginClass}`}>
          {subCount}
        </Text>
      </View>

        {/* 액션 버튼들 - LARGE 화면에서만 표시 */}
        {screenSize === ScreenSize.LARGE && (
          <SubCounterAction
            screenSize={screenSize}
            iconSize={iconSize}
            onReset={onReset}
            onEdit={onEdit}
            onRule={onRule}
          />
        )}
      </View>
    </SlideModal>
  );
};

export default SubCounterModal;
