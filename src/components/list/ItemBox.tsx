// src/components/list/ItemBox.tsx
import React from 'react';
import { Text, TouchableOpacity, View, Image } from 'react-native';
import clsx from 'clsx';
import { completeImage } from '@assets/images';
import { colorStyles } from '@styles/colorStyles';
import { appTheme } from '@styles/appTheme';

interface ItemBoxProps {
  title: string;
  subtitle?: string;
  number?: number;
  elapsedTimeText?: string;
  onPress: () => void;
  onLongPress?: () => void;
  progressPercentage?: number;
  isCompleted?: boolean;
  isEditMode?: boolean;
}

/**
 * ItemRow에서 사용하는 박스 컴포넌트
 * 제목과 숫자를 좌우로 배치하는 박스 컴포넌트로 프로그레스 바 기능 포함
 */
const ItemBox: React.FC<ItemBoxProps> = ({
  title,
  subtitle,
  number,
  elapsedTimeText,
  onPress,
  onLongPress,
  progressPercentage,
  isCompleted = false,
  isEditMode = false,
}) => {
  const {
    containerClassName,
    textClassName,
    subtextClassName,
  } = colorStyles.default;
  const hasProgress = progressPercentage !== undefined && progressPercentage !== null;
  const hasElapsedTime = !!elapsedTimeText;

  const boxView = (
    <View className={clsx(
      containerClassName,
      isEditMode && `${appTheme.tw.bg.primary['300']} border ${appTheme.tw.border.white}`,
      'rounded-xl',
      'relative overflow-hidden'
    )}>
      {/* 완료 상태일 때 전체 배경 채우기 */}
      {isCompleted ? (
        <View
          className={isEditMode
            ? `absolute left-0 top-0 bottom-0 right-0 ${appTheme.tw.bg.primary['100']}`
            : `absolute left-0 top-0 bottom-0 right-0 ${appTheme.tw.bg.primary['400']}`}
          pointerEvents="none"
        />
      ) : (
        /* 미완료 상태일 때만 프로그레스 바 표시 */
        hasProgress && progressPercentage > 0 && (
          <View
            className={isEditMode
              ? `absolute left-0 top-0 bottom-0 ${appTheme.tw.bg.primary['100']} ${progressPercentage >= 100 ? 'right-0' : ''}`
              : `absolute left-0 top-0 bottom-0 ${appTheme.tw.bg.primary['200']} ${progressPercentage >= 100 ? 'right-0' : ''}`}
            style={progressPercentage >= 100 ? undefined : { width: `${progressPercentage}%` }}
            pointerEvents="none"
          />
        )
      )}
      {/* 콘텐츠 - 프로그레스 바 위에 표시 (패딩 포함) */}
      <View className="relative z-10 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex flex-col">
            {subtitle && (
              <Text className={clsx('text-xs', isEditMode ? appTheme.tw.text.darkgray : (isCompleted ? 'text-white' : subtextClassName))}>
                {subtitle}
              </Text>
            )}
            <Text className={clsx('text-lg font-semibold', isEditMode ? appTheme.tw.text.black : textClassName)}>{title}</Text>
          </View>
          {number !== undefined && (
            <View className="relative items-end justify-center">
              {isCompleted && (
                <Image
                  source={completeImage}
                  className="absolute h-20 w-20 right-10 top-1/2 -mt-11"
                  resizeMode="cover"
                  style={{
                    tintColor: isEditMode
                      ? appTheme.colors.primary['400']
                      : appTheme.colors.primary['100'],
                  }}
                />
              )}
              <View className="items-end justify-center h-10">
                {hasElapsedTime ? (
                  <>
                    <Text className={clsx('text-2xl font-bold', textClassName)}>{number}</Text>
                    <Text className={clsx('text-xs font-bold', textClassName)}>
                      {elapsedTimeText}
                    </Text>
                  </>
                ) : (
                  <Text className={clsx('text-2xl font-bold', textClassName)}>{number}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
      {boxView}
    </TouchableOpacity>
  );
};

export default ItemBox;

