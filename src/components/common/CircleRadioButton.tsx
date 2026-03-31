import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import clsx from 'clsx';

interface CircleRadioButtonProps {
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'base';
  className?: string;
}

const CircleRadioButton: React.FC<CircleRadioButtonProps> = ({
  selected,
  onPress,
  disabled = false,
  size = 'base',
  className,
}) => {
  const isSmall = size === 'sm';
  const outerSizeClass = isSmall ? 'h-6 w-6 border-2' : 'h-8 w-8 border-[3px]';
  const innerSizeClass = isSmall ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      className={clsx('items-center justify-center', disabled && 'opacity-50', className)}
      accessible={true}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel="원형 라디오 버튼"
    >
      <View
        className={clsx(
          'items-center justify-center rounded-full bg-white',
          outerSizeClass,
          selected ? 'border-black' : 'border-lightgray'
        )}
      >
        {selected && (
          <View className={clsx('rounded-full bg-black', innerSizeClass)} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CircleRadioButton;
