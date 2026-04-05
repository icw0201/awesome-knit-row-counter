import { useCallback, useEffect, useRef, useState } from 'react';

export type TimedHighlightAction = 'add' | 'subtract';

type UseTimedHighlightReturn = {
  highlightedAction: TimedHighlightAction | null;
  flashHighlight: (action: TimedHighlightAction) => void;
};

/**
 * 지정한 액션 하이라이트를 일정 시간만 유지한다.
 * 연속 입력 시 이전 타이머를 취소하고 다시 시작한다.
 */
export const useTimedHighlight = (
  durationMs = 100
): UseTimedHighlightReturn => {
  const [highlightedAction, setHighlightedAction] =
    useState<TimedHighlightAction | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashHighlight = useCallback(
    (action: TimedHighlightAction) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setHighlightedAction(action);
      timeoutRef.current = setTimeout(() => {
        setHighlightedAction(null);
        timeoutRef.current = null;
      }, durationMs);
    },
    [durationMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    highlightedAction,
    flashHighlight,
  };
};
