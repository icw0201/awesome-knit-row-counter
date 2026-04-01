import React from 'react';
import { View } from 'react-native';
import CircleIcon from '@components/common/CircleIcon';

interface FloatingListActionButtonProps {
  onPress: () => void;
  bottom: number;
  /** true이면 추가(plus) 대신 일괄 삭제(trash-2) 아이콘 */
  isEditMode?: boolean;
}

/**
 * Main / ProjectDetail 목록용 플로팅 버튼
 * 일반 모드: 항목 추가(plus), 편집 모드: 선택 항목 일괄 삭제(trash-2)
 */
const FloatingListActionButton: React.FC<FloatingListActionButtonProps> = ({
  onPress,
  bottom,
  isEditMode = false,
}) => {
  return (
    <View
      className="absolute right-8"
      style={{ bottom: 20 + bottom }}
    >
      <CircleIcon
        size={64}
        iconName={isEditMode ? 'trash-2' : 'plus'}
        colorStyle="light"
        isButton
        onPress={onPress}
      />
    </View>
  );
};

export default FloatingListActionButton;
