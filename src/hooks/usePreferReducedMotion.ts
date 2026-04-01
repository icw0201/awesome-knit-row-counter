import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** 접근성 "동작 줄이기" — Modal 네이티브 fade와 맞출 때 사용 */
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
      setPreferReducedMotion,
    );
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return preferReducedMotion;
};
