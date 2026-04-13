import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, LayoutChangeEvent } from 'react-native';

import CircleRadioButton from '@components/common/CircleRadioButton';

interface SettingsAccordionProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

/**
 * 설정 화면에서 체크박스와 함께 접고 펼칠 수 있는 아코디언
 */
const SettingsAccordion: React.FC<SettingsAccordionProps> = ({
  label,
  checked,
  onToggle,
  children,
}) => {
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const hasInitializedAnimation = useRef(false);

  useEffect(() => {
    if (contentHeight === null) {
      return;
    }

    if (!hasInitializedAnimation.current) {
      animation.setValue(checked ? 1 : 0);
      hasInitializedAnimation.current = true;
      return;
    }

    Animated.timing(animation, {
      toValue: checked ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animation, checked, contentHeight]);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    if (nextHeight > 0 && nextHeight !== contentHeight) {
      setContentHeight(nextHeight);
    }
  }, [contentHeight]);

  const animatedContainerStyle = useMemo(() => ({
    height: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, contentHeight ?? 0],
    }),
    opacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  }), [animation, contentHeight]);

  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <View className="bg-transparent">
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.7}
        className="flex-row items-center justify-between px-4 py-3"
        accessible={true}
        accessibilityRole="radio"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
      >
        <Text className="shrink flex-1 text-base text-black" numberOfLines={2}>
          {label}
        </Text>
        <CircleRadioButton
          selected={checked}
          onPress={handleToggle}
          selectedBorderClassName="border-red-orange-400"
          selectedFillClassName="bg-red-orange-400"
        />
      </TouchableOpacity>

      {contentHeight === null && (
        <View
          className="absolute left-0 right-0 opacity-0"
          pointerEvents="none"
          onLayout={handleContentLayout}
        >
          <View className="bg-transparent px-4 pt-2">
            {children}
          </View>
        </View>
      )}

      <Animated.View
        className="overflow-hidden"
        style={animatedContainerStyle}
        pointerEvents={checked ? 'auto' : 'none'}
      >
        <View
          className="bg-transparent px-4 pt-2"
          onLayout={handleContentLayout}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

export default SettingsAccordion;
