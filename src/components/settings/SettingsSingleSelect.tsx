import React from 'react';
import { Check, Star } from 'lucide-react-native';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { appTheme } from '@styles/appTheme';
import SettingsSectionHeader from './SettingsSectionHeader';

// 설정 단일 선택: 섹션 헤더 + 색상 칩 그리드(잠금 시 프리미엄 오버레이).

// 단일 선택 목록의 각 항목: 값, 라벨, 칩 상·하단 배경색.
export interface SettingsSingleSelectOption<T extends string = string> {
  value: T;
  label: string;
  primary200: string;
  primary400: string;
}

// 컴포넌트 입력: 섹션 제목, 현재 선택, 옵션 배열, 선택/잠금 시 동작.
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
  // 칩 한 변 길이(화면 너비 기준)와 잠금 시 회색 multiply 오버레이에 쓰는 blend 설정.
  const chipSize = (Dimensions.get('window').width - 32 - 16) / 4.5;

  /** RN 타입에는 없을 수 있으나 새 아키텍처/플랫폼에서 multiply 합성에 사용됨 */
  const multiplyOverlayBlend = { mixBlendMode: 'multiply' as const };

  // 옵션 하나를 터치 가능한 칩으로 렌더: 상·하단 색, 선택 시 체크·라벨, 잠금 시 오버레이.
  const renderChip = (option: SettingsSingleSelectOption<T>) => {
    const selected = selectedValue === option.value;
    const locked = isOptionLocked?.(option.value) ?? false;

    return (
      // 터치·접근성: 잠긴 항목은 onSelect 대신 onLockedOptionPress만 호출.
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
          {/* 칩 본문: 상단 primary200(선택 시 체크) · 하단 primary400(선택 시 라벨). */}
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
          {/* 잠금: 회색 multiply 레이어와 프리미엄 별(터치는 상위에서 처리). */}
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

  // 섹션 제목과 옵션 칩 최대 6개를 위·아래 행(각 3개)으로 배치.
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
