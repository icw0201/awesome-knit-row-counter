import React from 'react';
import { Check } from 'lucide-react-native';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { appTheme } from '@styles/appTheme';

export interface SettingsSingleSelectOption<T extends string = string> {
  value: T;
  label: string;
  primary200: string;
  primary400: string;
}

interface SettingsSingleSelectProps<T extends string = string> {
  title: string;
  selectedValue: T;
  options: SettingsSingleSelectOption<T>[];
  onSelect: (value: T) => void;
}

const SettingsSingleSelect = <T extends string>({
  title,
  selectedValue,
  options,
  onSelect,
}: SettingsSingleSelectProps<T>) => {
  const chipSize = (Dimensions.get('window').width - 32 - 16) / 4.5;

  const renderChip = (option: SettingsSingleSelectOption<T>) => {
    const selected = selectedValue === option.value;

    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => onSelect(option.value)}
        activeOpacity={0.7}
        className="flex-col overflow-hidden rounded-[10px]"
        style={{ width: chipSize, height: chipSize }}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={option.label}
      >
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: option.primary200 }}
        >
          {selected ? (
            <Check size={20} color={appTheme.colors.white} strokeWidth={2.5} />
          ) : null}
        </View>
        <View
          className="flex-1 items-center justify-center px-1.5"
          style={{ backgroundColor: option.primary400 }}
        >
          {selected ? (
            <Text
              className="text-center text-sm font-semibold text-white"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {option.label}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center px-4">
        <Text className={`mr-3 text-sm font-semibold ${appTheme.tw.text.darkgray}`}>
          {title}
        </Text>
        <View className={`flex-1 border-b ${appTheme.tw.border.lightgray}`} />
      </View>

      <View className="mb-2 flex-row justify-center gap-6 px-4 mb-5">
        {options.slice(0, 3).map(renderChip)}
      </View>
      <View className="flex-row justify-center gap-6 px-4">
        {options.slice(3, 6).map(renderChip)}
      </View>
    </View>
  );
};

export default SettingsSingleSelect;
