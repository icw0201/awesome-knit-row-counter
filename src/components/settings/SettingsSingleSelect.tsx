import React from 'react';
import { Check, Star } from 'lucide-react-native';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { appTheme } from '@styles/appTheme';
import SettingsSectionHeader from './SettingsSectionHeader';

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
  /** true면 해당 값은 선택 불가 UI(별·그레이 multiply) 처리 */
  isOptionLocked?: (value: T) => boolean;
  /** 잠긴 칩을 눌렀을 때 (예: 프리미엄 결제 화면으로 이동) */
  onLockedOptionPress?: () => void;
}

const SettingsSingleSelect = <T extends string>({
  title,
  selectedValue,
  options,
  onSelect,
  isOptionLocked,
  onLockedOptionPress,
}: SettingsSingleSelectProps<T>) => {
  const chipSize = (Dimensions.get('window').width - 32 - 16) / 4.5;

  /** RN 타입에는 없을 수 있으나 새 아키텍처/플랫폼에서 multiply 합성에 사용됨 */
  const multiplyOverlayBlend = { mixBlendMode: 'multiply' as const };

  const renderChip = (option: SettingsSingleSelectOption<T>) => {
    const selected = selectedValue === option.value;
    const locked = isOptionLocked?.(option.value) ?? false;

    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => {
          if (locked) {
            onLockedOptionPress?.();
            return;
          }
          onSelect(option.value);
        }}
        activeOpacity={0.7}
        className="overflow-hidden rounded-[10px]"
        style={{ width: chipSize, height: chipSize }}
        accessibilityRole="radio"
        accessibilityState={{ checked: locked ? false : selected }}
        accessibilityLabel={locked ? `${option.label}, 프리미엄 전용` : option.label}
      >
        <View className="flex-1 overflow-hidden rounded-[10px]" collapsable={false}>
          <View className="flex-1 flex-col">
            <View
              className="flex-1 items-center justify-center"
              style={{ backgroundColor: option.primary200 }}
            >
              {selected && !locked ? (
                <Check size={20} color={appTheme.colors.white} strokeWidth={2.5} />
              ) : null}
            </View>
            <View
              className="flex-1 items-center justify-center px-1.5"
              style={{ backgroundColor: option.primary400 }}
            >
              {selected && !locked ? (
                <Text
                  className="text-center text-sm font-semibold text-white"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {option.label}
                </Text>
              ) : null}
            </View>
          </View>
          {locked ? (
            <View pointerEvents="none" className="absolute inset-0" collapsable={false}>
              <View
                pointerEvents="none"
                collapsable={false}
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    margin: 3,
                    borderRadius: 10 - 3,
                    backgroundColor: appTheme.colors.mediumgray,
                    ...multiplyOverlayBlend,
                  },
                ]}
              />
              <View
                pointerEvents="none"
                style={StyleSheet.absoluteFillObject}
                className="items-center justify-center"
              >
                <Star
                  size={20}
                  color={appTheme.colors.premiumGold}
                  fill={appTheme.colors.premiumGold}
                />
              </View>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="mb-6">
      <SettingsSectionHeader title={title} />

      <View className="flex-row justify-center gap-6 px-4 mb-5">
        {options.slice(0, 3).map(renderChip)}
      </View>
      <View className="flex-row justify-center gap-6 px-4">
        {options.slice(3, 6).map(renderChip)}
      </View>
    </View>
  );
};

export default SettingsSingleSelect;
