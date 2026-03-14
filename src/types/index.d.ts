// Shared types here

/// <reference types="nativewind/types" />

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module 'react-native-keyevent' {
  export type HardwareKeyEvent = {
    action: number;
    keyCode: number;
    pressedKey: string;
    characters?: string;
  };

  export interface HardwareKeyEventModule {
    onKeyDownListener(callback: (event: HardwareKeyEvent) => void): void;
    onKeyUpListener(callback: (event: HardwareKeyEvent) => void): void;
    onKeyMultipleListener(callback: (event: HardwareKeyEvent) => void): void;
    removeKeyDownListener(): void;
    removeKeyUpListener(): void;
    removeKeyMultipleListener(): void;
  }

  const KeyEvent: HardwareKeyEventModule;
  export default KeyEvent;
}

declare global {
  var _REACT_NATIVE_NEW_ARCH_ENABLED: boolean;
}
