import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import clsx from 'clsx';
import { colorStyles } from '@styles/colorStyles';
import { getLucideIcon } from '@utils/iconUtils';

interface IconBoxProps {
  onPress: () => void;
  title: string;
  iconName: string;
  /** 그룹 컨테이너 안에 넣을 때: 단일 카드 둥근 박스 대신 줄만 */
  grouped?: boolean;
  /** `grouped`일 때 마지막 행이면 하단 구분선 생략 */
  groupedIsLast?: boolean;
  disabled?: boolean;
  /** 기본 카드 하단 바깥 `mb-4` 생략 (스택 후 래퍼에서 간격 맞출 때) */
  omitTrailingMargin?: boolean;
}

const IconBox: React.FC<IconBoxProps> = ({
  onPress,
  title,
  iconName,
  grouped,
  groupedIsLast,
  disabled,
  omitTrailingMargin,
}) => {
  const {
    containerClassName,
    textClassName,
    iconColor,
  } = colorStyles.light;
  const IconComponent = getLucideIcon(iconName);

  const rowInner = (
    <>
      <Text className={clsx('text-base font-semibold', textClassName)}>{title}</Text>
      <IconComponent size={20} color={iconColor} />
    </>
  );

  if (grouped) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
        <View
          className={clsx(
            'flex-row items-center justify-between px-4 py-3',
            !groupedIsLast && 'border-b border-lightgray'
          )}
        >
          {rowInner}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <View
        className={clsx(
          'rounded-2xl p-4',
          !omitTrailingMargin && 'mb-4',
          containerClassName
        )}
      >
        <View className="flex-row items-center justify-between py-3">
          {rowInner}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default IconBox;
