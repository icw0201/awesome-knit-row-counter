import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Easing, LayoutChangeEvent } from 'react-native';

import CheckBox from '@components/common/CheckBox';

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
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
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
      outputRange: [0, contentHeight],
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
      <CheckBox
        label={label}
        checked={checked}
        onToggle={handleToggle}
      />

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
