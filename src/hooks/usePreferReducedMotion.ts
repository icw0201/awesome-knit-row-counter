import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * 접근성의 "동작 줄이기"(iOS Reduce Motion, Android에서도 동일 API로 반영) 여부.
 * 시스템 애니메이션을 끈 환경에서 네이티브 Modal fade 등과 충돌할 때 사용한다.
 */
export const usePreferReducedMotion = (): boolean => {
  const [preferReducedMotion, setPreferReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) {
        setPreferReducedMotion(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        setPreferReducedMotion(enabled);
      },
    );
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return preferReducedMotion;
};
