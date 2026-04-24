import React from 'react';
import { Check } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { appTheme } from '@styles/appTheme';

export interface SettingsSingleSelectOption<T extends string = string> {
  value: T;
  label: string;
  representativeColor: string;
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
  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center px-4">
        <Text className={`mr-3 text-sm font-semibold ${appTheme.tw.text.darkgray}`}>
          {title}
        </Text>
        <View className={`flex-1 border-b ${appTheme.tw.border.lightgray}`} />
      </View>

      <View className="px-4">
        <View className="flex-row flex-wrap overflow-hidden">
        {options.map((option) => {
          const selected = selectedValue === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
              className="w-1/3"
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={option.label}
            >
              <View
                className="h-24 items-center justify-center"
                style={{ backgroundColor: option.representativeColor }}
              >
                {selected ? (
                  <View className="w-full items-center justify-center px-2">
                    <Check size={18} color={appTheme.colors.white} strokeWidth={3} />
                    <Text
                      className="mt-2 w-full text-center text-sm font-semibold text-white"
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {option.label}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
        </View>
      </View>
    </View>
  );
};

export default SettingsSingleSelect;
