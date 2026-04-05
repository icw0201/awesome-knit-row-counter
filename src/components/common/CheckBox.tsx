// src/components/CheckBox.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { colorStyles } from '@styles/colorStyles';
import clsx from 'clsx';

/**
 * CheckBox 컴포넌트의 Props 인터페이스
 * @param label - 체크박스 옆에 표시될 텍스트 라벨 (선택사항)
 * @param checked - 체크박스의 체크 상태 (true: 체크됨, false: 체크 안됨)
 * @param onToggle - 체크박스 클릭 시 실행될 콜백 함수
 * @param size - 체크박스 크기 ('base' | 'xs'), 기본값: 'base'
 * @param variant - 'default': 채움 + 체크 아이콘 / 'chunky': 흰 박스·검은 테두리·체크 시 안쪽 검은 사각형
 * @param children - 체크박스 왼쪽에 표시할 추가 요소 (선택사항)
 * @param accessibilityLabel - 라벨이 없을 때 접근성 라벨 (선택사항)
 */
interface CheckBoxProps {
  label?: string;
  checked: boolean;
  onToggle: () => void;
  size?: 'base' | 'xs';
  variant?: 'default' | 'chunky';
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

/**
 * 체크박스 컴포넌트
 * 라벨과 함께 표시되는 체크박스로, 클릭 시 상태를 토글할 수 있습니다.
 */
const CheckBox: React.FC<CheckBoxProps> = ({
  label,
  checked,
  onToggle,
  size = 'base',
  variant = 'default',
  children,
  accessibilityLabel: accessibilityLabelProp,
}) => {
  const activeColor = colorStyles.vivid.container;
  const inactiveColor = 'bg-red-orange-100';

  const isXs = size === 'xs';
  const checkboxSizeClass = isXs ? 'w-4 h-4' : 'w-6 h-6';
  const textSizeClass = isXs ? 'text-xs' : 'text-base';
  const iconSize = isXs ? 12 : 16;
  const paddingClass = isXs ? 'px-3 py-2' : 'px-4 py-3';

  const isChunky = variant === 'chunky';
  const innerSquareClass = isXs ? 'h-1.5 w-1.5 rounded-sm' : 'h-2.5 w-2.5 rounded-sm';

  const checkboxClass = clsx(
    checkboxSizeClass,
    'items-center justify-center',
    isChunky
      ? ['rounded-md border-2 border-black bg-white']
      : ['rounded-md', checked ? activeColor : inactiveColor]
  );

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      className={clsx(label ? `flex-row items-center justify-between ${paddingClass}` : '')}
      accessible={true}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked }}
      accessibilityLabel={accessibilityLabelProp ?? label ?? '선택'}
      accessibilityHint="탭하여 선택하거나 해제합니다"
    >
      {/* 체크박스 라벨 텍스트 - label이 있을 때만 표시 */}
      {label && (
        <Text className={`${textSizeClass} text-black shrink flex-1`} numberOfLines={2}>{label}</Text>
      )}

      {/* children이 있으면 라벨과 체크박스 사이에 배치 (label이 있을 때만) */}
      {label && children && (
        <View className="mx-2">
          {children}
        </View>
      )}

      <View className={checkboxClass}>
        {checked && isChunky && <View className={clsx('bg-black', innerSquareClass)} />}
        {checked && !isChunky && <Check size={iconSize} color="white" />}
      </View>
    </TouchableOpacity>
  );
};

export default CheckBox;
