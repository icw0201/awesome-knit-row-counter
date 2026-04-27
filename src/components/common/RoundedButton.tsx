import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import clsx from 'clsx';
import { colorStyles, ColorStyleKey } from '@styles/colorStyles';

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
}

/**
 * 기본 레이아웃: 중앙 정렬된 제목 표시
 */
const renderDefaultLayout = (title: string, textColor: string) => (
  <View className="items-center justify-center min-h-16">
    <Text className={clsx('text-base font-semibold', textColor)}>{title}</Text>
  </View>
);

/**
 * 둥근 모서리를 가진 버튼 컴포넌트
 * 중앙 정렬된 제목을 표시하며, 항상 터치 가능한 버튼으로 동작합니다.
 * rounded는 full로 고정되어 있습니다.
 */
const RoundedButton: React.FC<RoundedButtonProps> = ({
  onPress,
  title,
  colorStyle = 'default',
  containerClassName = '',
}) => {
  // 선택된 색상 테마에서 색상 값들을 가져오기
  const {
    containerClassName: themeContainerClassName,
    textClassName,
  } = colorStyles[colorStyle];

  // 박스 뷰 생성 (rounded는 full로 고정)
  const boxView = (
    <View className={clsx('mx-1 py-3 px-8 rounded-full', themeContainerClassName, containerClassName)}>
      {renderDefaultLayout(title, textClassName)}
    </View>
  );

  // 항상 TouchableOpacity로 감싸서 버튼으로 동작
  return (
    <TouchableOpacity onPress={onPress}>
      {boxView}
    </TouchableOpacity>
  );
};

export default RoundedButton;
