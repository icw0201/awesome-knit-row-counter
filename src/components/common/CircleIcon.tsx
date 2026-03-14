import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import clsx from 'clsx';
import { colorStyles, ColorStyleKey } from '@styles/colorStyles';
import { getLucideIcon } from '@utils/iconUtils';

/**
 * CircleIcon 컴포넌트의 Props 인터페이스
 * @param size - 원형 아이콘의 크기 (기본값: 60)
 * @param isButton - 터치 가능한 버튼으로 동작할지 여부 (기본값: false)
 * @param onPress - 버튼 클릭 시 실행될 콜백 함수 (isButton이 true일 때만 사용)
 * @param iconName - 표시할 Lucide 아이콘 이름 (기본값: 'star')
 * @param iconColor - 아이콘 색상 (colorStyle보다 우선순위가 높음)
 * @param colorStyle - 색상 테마 스타일 키 (기본값: 'default')
 * @param containerClassName - 추가적인 컨테이너 스타일 클래스
 */
interface CircleIconProps {
  size?: number;
  isButton?: boolean;
  onPress?: () => void;
  iconName?: string;
  iconColor?: string;
  colorStyle?: ColorStyleKey;
  containerClassName?: string;
}

/**
 * 원형 아이콘 컴포넌트
 * Lucide 아이콘을 사용하여 원형 배경에 아이콘을 표시합니다.
 * isButton이 true일 경우 터치 가능한 버튼으로 동작하며,
 * false일 경우 단순한 표시용 아이콘으로 동작합니다.
 */
const CircleIcon: React.FC<CircleIconProps> = ({
  size = 60,
  isButton = false,
  onPress,
  iconName = 'star',
  iconColor,
  colorStyle = 'default',
  containerClassName = '',
}) => {
  // 선택된 색상 테마에서 컨테이너와 아이콘 색상 가져오기
  const { container, icon } = colorStyles[colorStyle];

  // iconColor가 직접 지정된 경우 우선 사용, 없으면 테마의 아이콘 색상 사용
  const resolvedColor = iconColor ?? icon;

  // 컨테이너의 클래스명 조합 (기본 스타일 + 테마 색상 + 추가 스타일)
  const classNames = clsx('items-center justify-center rounded-full', container, containerClassName);

  // 아이콘 크기는 컨테이너 크기의 절반으로 설정
  const iconSize = size * 0.5;

  // 아이콘 이름을 PascalCase로 변환하고 Lucide 아이콘으로 렌더링
  const IconComponent = getLucideIcon(iconName);

  // 아이콘과 배경을 포함한 기본 컨텐츠
  const content = (
    <View className={classNames} style={{ width: size, height: size }}>
      <IconComponent size={iconSize} color={resolvedColor} />
    </View>
  );

  // isButton이 true면 TouchableOpacity로 감싸서 터치 가능하게, false면 단순 컨텐츠 반환
  if (isButton) {
    return (
      <TouchableOpacity
        onPress={onPress}
        focusable={false}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

export default CircleIcon;
