import React from 'react';
import { View } from 'react-native';
import clsx from 'clsx';
import CircleRadioButton from '@components/common/CircleRadioButton';

export interface CircleRadioOption<T extends string = string> {
  value: T;
  content: React.ReactNode;
}

interface CircleRadioButtonsProps<T extends string = string> {
  options: CircleRadioOption<T>[];
  selected: T | null;
  onSelect: (value: T | null) => void;
  size?: 'sm' | 'base';
  direction?: 'row' | 'column';
  containerClassName?: string;
}

// 원형 라디오 버튼과 각 옵션의 커스텀 콘텐츠를 함께 배치합니다.
const CircleRadioButtons = <T extends string>({
  options,
  selected,
  onSelect,
  size = 'base',
  direction = 'column',
  containerClassName,
}: CircleRadioButtonsProps<T>) => {
  const isColumn = direction === 'column';

  return (
    <View className={clsx(isColumn ? 'items-start' : 'items-center', containerClassName)}>
      {options.map((option, index) => (
        <View
          key={option.value}
          className={clsx(
            'flex-row items-center',
            isColumn ? index < options.length - 1 && 'mb-2' : index < options.length - 1 && 'mr-6'
          )}
        >
          <View className="mr-2">
            <CircleRadioButton
              selected={selected === option.value}
              onPress={() => onSelect(selected === option.value ? null : option.value)}
              size={size}
            />
          </View>
          <View className="flex-row items-center flex-shrink">
            {option.content}
          </View>
        </View>
      ))}
    </View>
  );
};

export default CircleRadioButtons;
