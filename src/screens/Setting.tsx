// src/screens/Settings.tsx
import React, { useCallback, useRef } from 'react';
import { ScrollView, TextInput as RNTextInput, findNodeHandle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsCheckBoxes, SettingsLinks, SettingsVersion } from '@components/settings';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';

/**
 * 설정 화면 컴포넌트
 * 앱의 다양한 설정을 관리하고, 리뷰/문의 링크를 제공합니다.
 */
const Settings = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  const handleVoiceInputFocus = useCallback((input: RNTextInput | null) => {
    const inputHandle = input ? findNodeHandle(input) : null;

    if (!scrollViewRef.current || inputHandle == null) {
      return;
    }

    requestAnimationFrame(() => {
      (
        scrollViewRef.current as ScrollView & {
          scrollResponderScrollNativeHandleToKeyboard?: (
            nodeHandle: number,
            additionalOffset?: number,
            preventNegativeScrollOffset?: boolean
          ) => void;
        }
      ).scrollResponderScrollNativeHandleToKeyboard?.(
        inputHandle,
        120,
        true
      );
    });
  }, []);

  return (
    <SafeAreaView style={screenStyles.flex1} edges={safeAreaEdges}>
      {/* 설정 옵션들 */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={screenStyles.scrollViewContentCentered}
      >
        <SettingsCheckBoxes onVoiceInputFocus={handleVoiceInputFocus} />

        <SettingsLinks />

        <SettingsVersion version="1.4.3" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
