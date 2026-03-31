import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import clsx from 'clsx';
import { colorStyles } from '@styles/colorStyles';

type ProjectTypeOption = {
  value: 'project' | 'counter';
  label: string;
  tooltip: string;
};

const PROJECT_TYPE_OPTIONS: ProjectTypeOption[] = [
  {
    label: '프로젝트',
    value: 'project',
    tooltip: '프로젝트는 하위에 여러 카운터를 생성할 수 있습니다.',
  },
  {
    label: '카운터',
    value: 'counter',
    tooltip: '단일 카운터를 생성합니다.',
  },
];

interface ProjectTypeSelectorProps {
  selected: ProjectTypeOption['value'];
  onSelect: (value: ProjectTypeOption['value']) => void;
}

interface ProjectTypeRadioButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
}

const ProjectTypeRadioButton: React.FC<ProjectTypeRadioButtonProps> = ({
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

const getSelectedTooltip = (
  options: ProjectTypeOption[],
  selectedValue: ProjectTypeOption['value']
): string => {
  return options.find(option => option.value === selectedValue)?.tooltip ?? '';
};

const ProjectTypeSelector: React.FC<ProjectTypeSelectorProps> = ({
  selected,
  onSelect,
}) => {
  const selectedTooltip = getSelectedTooltip(PROJECT_TYPE_OPTIONS, selected);

  return (
    <View className="items-center">
      <View 
        className="flex-row items-center justify-center"
        accessibilityRole="radiogroup"
      >
        {PROJECT_TYPE_OPTIONS.map((option, index) => (
          <View
            key={option.value}
            className={index < PROJECT_TYPE_OPTIONS.length - 1 ? 'mr-6' : undefined}
          >
            <ProjectTypeRadioButton
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

export default ProjectTypeSelector;
