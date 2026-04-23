import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { activateIcons } from '@assets/images';

interface ActivateToggleProps {
  mascotIsActive: boolean;
  onToggle: () => void;
  size?: number;
}

/**
 * 활성화 토글 컴포넌트
 * 마스코트 활성화 여부를 표시하고 토글할 수 있는 아이콘 버튼
 */
const ActivateToggle: React.FC<ActivateToggleProps> = ({
  mascotIsActive,
  onToggle,
  size = 23,
}) => {
  return (
    <TouchableOpacity onPress={onToggle}>
      <Image
        source={activateIcons[mascotIsActive ? 'active' : 'inactive']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default ActivateToggle;

