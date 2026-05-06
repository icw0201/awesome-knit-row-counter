import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { colorStyles, ColorStyleKey } from '@styles/colorStyles';
import { appTheme } from '@styles/appTheme';

/**
 * RoundedButton 컴포넌트의 Props 인터페이스
 * @param onPress - 버튼 클릭 시 실행될 콜백 함수
 * @param title - 버튼에 표시될 텍스트
 * @param colorStyle - 색상 테마 스타일 키 (기본값: 'default')
 * @param containerClassName - 추가적인 컨테이너 스타일 클래스
 */
interface RoundedButtonProps {
  onPress: () => void;
  title: string;
  colorStyle?: ColorStyleKey;
  containerClassName?: string;
  disabled?: boolean;
}

/**
 * 기본 레이아웃: 중앙 정렬된 제목 표시
 */
const renderDefaultLayout = (title: string, textClassName: string) => (
  <View className="items-center justify-center min-h-16">
    <Text className={twMerge('text-base font-semibold', textClassName)}>{title}</Text>
  </View>
);

/**
 * 둥근 모서리를 가진 버튼 컴포넌트
 * 중앙 정렬된 제목을 표시합니다. disabled일 때는 회색 스타일이며 터치되지 않습니다.
 * rounded는 full로 고정되어 있습니다.
 */
const RoundedButton: React.FC<RoundedButtonProps> = ({
  onPress,
  title,
  colorStyle = 'default',
  containerClassName = '',
  disabled = false,
}) => {
  // 선택된 색상 테마에서 색상 값들을 가져오기
  const {
    containerClassName: themeContainerClassName,
    textClassName,
  } = colorStyles[colorStyle];

  const resolvedContainerClassName = disabled
    ? twMerge(appTheme.tw.bg.lightgray, `border ${appTheme.tw.border.lightgray}`)
    : themeContainerClassName;
  const resolvedTextClassName = disabled
    ? appTheme.tw.text.black
    : textClassName;

  // 박스 뷰 생성 (rounded는 full로 고정)
  const boxView = (
    <View
      className={twMerge(
        'mx-1 py-3 px-8 rounded-full',
        resolvedContainerClassName,
        containerClassName
      )}
    >
      {renderDefaultLayout(title, resolvedTextClassName)}
    </View>
  );

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={disabled ? 1 : 0.2}>
      {boxView}
    </TouchableOpacity>
  );
};

export default RoundedButton;
