import React from 'react';
import { View, Text } from 'react-native';
import clsx from 'clsx';
import CheckRadioButton from '@components/common/CheckRadioButton';

export interface CheckRadioOption {
  value: string;
  label: string;
  tooltip?: string;
}

interface CheckRadioButtonsProps {
  options: CheckRadioOption[];
  selected: string | null;
  onSelect: (value: string) => void;
  containerClassName?: string;
}

const getSelectedTooltip = (
  options: CheckRadioOption[],
  selectedValue: string | null
): string | undefined => {
  if (!selectedValue) {
    return undefined;
  }

  return options.find(option => option.value === selectedValue)?.tooltip;
};

// 체크형 라디오 버튼을 가로로 배치하고 선택된 항목의 안내 문구를 보여줍니다.
const CheckRadioButtons: React.FC<CheckRadioButtonsProps> = ({
  options,
  selected,
  onSelect,
  containerClassName,
}) => {
  const selectedTooltip = getSelectedTooltip(options, selected);

  return (
    <View className={clsx('items-center', containerClassName)}>
      <View className="flex-row items-center justify-center">
        {options.map((option, index) => (
          <View
            key={option.value}
            // 버튼 사이 간격은 래퍼에 직접 적용해야 안정적으로 유지됩니다.
            className={index < options.length - 1 ? 'mr-6' : undefined}
          >
            <CheckRadioButton
              label={option.label}
              selected={selected === option.value}
              onPress={() => onSelect(option.value)}
            />
          </View>
        ))}
      </View>

      {selectedTooltip && (
        <Text className="mt-2 text-center text-xs text-darkgray">
          {selectedTooltip}
        </Text>
      )}
    </View>
  );
};

export default CheckRadioButtons;
