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
 * @param children - 체크박스 왼쪽에 표시할 추가 요소 (선택사항)
 */
interface CheckBoxProps {
  label?: string;
  checked: boolean;
  onToggle: () => void;
  size?: 'base' | 'xs';
  children?: React.ReactNode;
}

/**
 * 체크박스 컴포넌트
 * 라벨과 함께 표시되는 체크박스로, 클릭 시 상태를 토글할 수 있습니다.
 */
const CheckBox: React.FC<CheckBoxProps> = ({ label, checked, onToggle, size = 'base', children }) => {
  // 체크박스 색상 설정
  const activeColor = colorStyles.vivid.container; // 활성화 상태일 때의 배경색 (체크된 상태)
  const inactiveColor = 'bg-red-orange-100'; // 체크되지 않은 상태일 때의 배경색

  // 사이즈에 따른 스타일 설정
  const isXs = size === 'xs';
  const checkboxSizeClass = isXs ? 'w-4 h-4' : 'w-6 h-6';
  const textSizeClass = isXs ? 'text-xs' : 'text-base';
  const iconSize = isXs ? 12 : 16;
  const paddingClass = isXs ? 'px-3 py-2' : 'px-4 py-3';

  // 체크박스 컨테이너 스타일 클래스
  const checkboxClass = clsx(
    checkboxSizeClass,
    'rounded-md items-center justify-center',
    checked ? activeColor : inactiveColor
  );

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      className={clsx(label ? `flex-row items-center justify-between ${paddingClass}` : '')}
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

      {/* 체크박스 아이콘 컨테이너 */}
      <View className={checkboxClass}>
        {/* 체크된 상태일 때만 체크 아이콘 표시 */}
        {checked && (
          <Check size={iconSize} color="white" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CheckBox;
