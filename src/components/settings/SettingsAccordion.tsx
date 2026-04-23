import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, LayoutChangeEvent } from 'react-native';

import CircleRadioButton from '@components/common/CircleRadioButton';
import { appTheme } from '@styles/appTheme';

/**
 * 설정 화면에서 쓰는 접이(아코디언) 블록입니다.
 *
 * 전체 흐름:
 * 1) 헤더: 라벨 + 라디오 버튼. 누르면 `onToggle`로 선택이 바뀌고, 그에 맞게 본문을 펼치거나 접습니다.
 * 2) 높이 측정: 애니메이션에 정확한 `height`가 필요합니다. `contentHeight`가 아직 없을 때는
 *    화면에 보이지 않는(offscreen) 측정용 뷰에서 `children`을 한 번 그려 `onLayout`으로 높이를 얻습니다.
 * 3) 애니메이션: 측정이 끝나면 `Animated.Value`로 높이와 투명도를 보간해 접기/펼치기를 처리합니다.
 *    최초 1회는 깜빡임을 줄이려 애니메이션 없이 `checked`에 맞는 값으로 즉시 세팅합니다.
 */
interface SettingsAccordionProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

/**
 * 설정 화면에서 라디오 버튼과 함께 접고 펼칠 수 있는 아코디언
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

  // 높이가 준비되기 전/후 + checked 변화에 따라 애니메이션 또는 즉시 값 적용
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

  // 펼침 진행도(0~1) → 실제 높이·투명도로 매핑
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
        <Text className={`shrink flex-1 text-base ${appTheme.tw.text.black}`} numberOfLines={2}>
          {label}
        </Text>
        <CircleRadioButton
          selected={checked}
          onPress={handleToggle}
          selectedBorderClassName={appTheme.tw.border.primary['400']}
          selectedFillClassName={appTheme.tw.bg.primary['400']}
        />
      </TouchableOpacity>

      {/* 측정 전: 숨김 레이어로 children 높이만 먼저 얻기 */}
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

      {/* 본문: 측정된 높이 기준으로 접기/펼치기 */}
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
