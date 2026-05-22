import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import clsx from 'clsx';
import { colorStyles } from '@styles/colorStyles';
import { getLucideIcon } from '@utils/iconUtils';

interface IconBoxProps {
  onPress: () => void;
  title: string;
  iconName: string;
  disabled?: boolean;
}

const IconBox: React.FC<IconBoxProps> = ({
  onPress,
  title,
  iconName,
  disabled,
}) => {
  const {
    containerClassName,
    textClassName,
    iconColor,
  } = colorStyles.light;
  const IconComponent = getLucideIcon(iconName);

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <View
        className={clsx(
          'rounded-2xl p-4 m-1.5',
          containerClassName
        )}
      >
        <View className="flex-row items-center justify-between py-3">
          <Text className={clsx('text-base font-semibold', textClassName)}>{title}</Text>
          <IconComponent size={20} color={iconColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default IconBox;
