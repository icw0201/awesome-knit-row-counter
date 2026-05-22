import { useEffect, useState } from 'react';
import { subscribeSelectedColorThemeSettingChange } from '@storage/settings';

/**
 * 앱 전역에서 선택된 색상 테마 변경을 감지해 리렌더를 유도합니다.
 * - 현재 테마 값은 appTheme/getAppTheme가 MMKV에서 직접 읽고,
 *   이 훅은 변경 시점에 루트 트리를 다시 그리도록만 담당합니다.
 */
export function useAppThemeSync() {
  const [, setThemeVersion] = useState(0);

  useEffect(() => {
    return subscribeSelectedColorThemeSettingChange(() => {
      setThemeVersion((prev) => prev + 1);
    });
  }, []);
}
