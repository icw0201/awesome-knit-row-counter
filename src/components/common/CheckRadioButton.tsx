import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import clsx from 'clsx';
import { colorStyles } from '@styles/colorStyles';

interface CheckRadioButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
}

// 체크 아이콘을 사용하는 단일 라디오 버튼
const CheckRadioButton: React.FC<CheckRadioButtonProps> = ({
  label,
  selected,
  onPress,
  className,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={clsx('items-center', className)}
    activeOpacity={0.7}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    accessibilityLabel={label}
  >
    {/* 선택 상태에 따라 배경색과 체크 아이콘을 전환합니다. */}
    <View
      className={clsx(
        'w-6 h-6 rounded-full items-center justify-center mb-1',
        selected
          ? colorStyles.vivid.container
          : 'bg-red-orange-100 border border-red-orange-100'
      )}
    >
      {selected && (
        <Check size={14} color="white" />
      )}
    </View>
    <Text className="text-sm text-black">{label}</Text>
  </TouchableOpacity>
);

export default CheckRadioButton;
