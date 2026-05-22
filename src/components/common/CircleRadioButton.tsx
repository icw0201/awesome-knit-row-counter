import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import clsx from 'clsx';

interface CircleRadioButtonProps {
  selected: boolean;
  onPress: () => void;
  className?: string;
  selectedBorderClassName?: string;
  selectedFillClassName?: string;
}

const CircleRadioButton: React.FC<CircleRadioButtonProps> = ({
  selected,
  onPress,
  className,
  selectedBorderClassName = 'border-black',
  selectedFillClassName = 'bg-black',
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={clsx('items-center justify-center', className)}
      accessible={true}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel="원형 라디오 버튼"
    >
      <View
        className={clsx(
          'h-6 w-6 border-2 items-center justify-center rounded-full bg-white',
          selected ? selectedBorderClassName : 'border-lightgray'
        )}
      >
        {selected && (
          <View className={clsx('h-3 w-3 rounded-full', selectedFillClassName)} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CircleRadioButton;
