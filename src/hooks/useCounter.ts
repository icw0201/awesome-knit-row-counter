// src/hooks/useCounter.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Platform, Vibration, AppState } from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import Sound from 'react-native-sound';

import { getStoredItems, updateItem } from '@storage/storage';
import { Way, Counter, SectionRecord, EditLogType } from '@storage/types';
import { getSoundSetting, getVibrationSetting, getAutoPlayElapsedTimeSetting } from '@storage/settings';
import { getCurrentTime } from '@utils/timeUtils';

interface UseCounterProps {
  counterId: string;
}

interface UseCounterReturn {
  // 상태
  counter: Counter | null;
  wayIsChange: boolean;
  mascotIsActive: boolean;
  way: Way;
  currentCount: string;
  currentTargetCount: string;
  activeModal: 'reset' | 'edit' | 'limit' | 'rule' | 'subReset' | 'subEdit' | 'subLimit' | 'targetCount' | 'timerReset' | null;
  errorModalVisible: boolean;
  errorMessage: string;

  // 보조 카운터 상태
  subCount: number;
  subRule: number;
  subRuleIsActive: boolean;
  subModalIsOpen: boolean;

  // 액션 함수들
  handleAdd: (inputSource?: 'voice') => void;
  handleSubtract: (inputSource?: 'voice') => void;
  handleEditOpen: () => void;
  handleEditConfirm: (value: string) => void;
  handleResetConfirm: () => void;
  handleClose: () => void;
  handleTargetCountOpen: () => void;
  handleTargetCountConfirm: (value: string) => void;
  toggleMascotIsActive: () => void;
  toggleWay: () => void;
  toggleTimerIsActive: () => void;
  toggleTimerIsPlaying: () => void;
  handleTimerResetConfirm: () => void;
  showErrorModal: (message: string) => void;
  setErrorModalVisible: (visible: boolean) => void;
  setActiveModal: (modal: 'reset' | 'edit' | 'limit' | 'rule' | 'subReset' | 'subEdit' | 'subLimit' | 'targetCount' | 'timerReset' | null) => void;

  // 보조 카운터 액션 함수들
  handleSubAdd: (inputSource?: 'voice') => void;
  handleSubSubtract: (inputSource?: 'voice') => void;
  handleSubReset: () => void;
  handleSubEdit: () => void;
  handleSubRule: () => void;
  handleSubResetConfirm: () => void;
  handleSubEditConfirm: (value: string) => void;
  handleSubRuleConfirm: (rule: number, isRuleActive: boolean) => void;
  handleSubModalToggle: () => void;

  // 구간 기록 모달 액션 함수
  handleSectionModalToggle: () => void;
  handleSectionUndo: () => void;

}

/**
 * 카운터 관련 비즈니스 로직을 관리하는 커스텀 훅
 *
 * 주요 기능:
 * - 카운터 값 증가/감소
 * - 보조 카운터 값 증가/감소
 * - 활성화 모드 전환
 * - 방향 전환
 * - 사운드 및 진동 피드백
 * - 모달 상태 관리
 * - 에러 처리
 */
export const useCounter = ({ counterId }: UseCounterProps): UseCounterReturn => {
  // 화면 포커스 상태 확인
  const isFocused = useIsFocused();

  // 카운터 데이터 상태
  const [counter, setCounter] = useState<Counter | null>(null);

  // 모달 상태 관리
  const [activeModal, setActiveModal] = useState<'reset' | 'edit' | 'limit' | 'rule' | 'subReset' | 'subEdit' | 'subLimit' | 'targetCount' | 'timerReset' | null>(null);
  const [currentCount, setCurrentCount] = useState('');
  const [currentTargetCount, setCurrentTargetCount] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 사운드 관련
  const clickSoundRef = useRef<Sound | null>(null);

  // 설정 상태
  const [soundSetting, setSoundSettingState] = useState(true);
  const [vibrationSetting, setVibrationSettingState] = useState(true);

  // 카운터 동작 상태
  const [wayIsChange, setWayIsChange] = useState<boolean>(false);
  const [mascotIsActive, setMascotIsActive] = useState<boolean>(false);
  const [way, setWay] = useState<Way>('front');

  /**
   * 카운터 데이터 로드
   */
  const loadCounterData = useCallback(() => {
    const allItems = getStoredItems();
    const latest = allItems.find(
      (item): item is Counter => item.id === counterId && item.type === 'counter'
    );

    if (latest) {
      setCounter(latest);
      setWayIsChange(latest.wayIsChange ?? false);
      setMascotIsActive(latest.mascotIsActive ?? false);
      setWay(latest.way ?? 'front');
      setCurrentCount(String(latest.count));
    }
  }, [counterId]);

  /**
   * 설정값 로드
   */
  const loadSettings = useCallback(() => {
    setSoundSettingState(getSoundSetting());
    setVibrationSettingState(getVibrationSetting());
  }, []);

  /**
   * 카운터 데이터 초기화
   */
  useEffect(() => {
    loadSettings();
    loadCounterData();
  }, [loadSettings, loadCounterData]);

  /**
   * 화면에 포커스될 때마다 설정 및 카운터 메타데이터(제목 등) 다시 로드
   * count 값은 로드하지 않아 롤백 방지
   */
  useFocusEffect(
    useCallback(() => {
      loadSettings();
      // 카운터 제목 등 메타데이터만 업데이트 (count는 보존)
      const allItems = getStoredItems();
      const latest = allItems.find(
        (item): item is Counter => item.id === counterId && item.type === 'counter'
      );

      if (latest) {
        // title, info, mascotIsActive, wayIsChange, repeatRules 등 메타데이터 업데이트(헤더/표시용), 조작 가능한 필드들은 유지
        setCounter(prevCounter => {
          if (!prevCounter) {
            return latest;
          }
          return {
            ...prevCounter,
            title: latest.title,
            info: latest.info,
            mascotIsActive: latest.mascotIsActive ?? false,
            wayIsChange: latest.wayIsChange ?? false,
            repeatRules: latest.repeatRules ?? [],
          };
        });
        setWay(latest.way ?? 'front');
        setMascotIsActive(latest.mascotIsActive ?? false);
        setWayIsChange(latest.wayIsChange ?? false);

        // 카운터 진입 시 타이머 재생 상태 설정
        // 카운터가 활성화된 상태 & 설정에서 자동재생 켜짐 -> true, 꺼짐 -> false
        if (latest.timerIsActive) {
          const autoPlaySetting = getAutoPlayElapsedTimeSetting();
          const shouldPlay = autoPlaySetting;
          if (latest.timerIsPlaying !== shouldPlay) {
            updateItem(latest.id, { timerIsPlaying: shouldPlay });
            setCounter(prev => {
              if (!prev) {
                return prev;
              }
              return { ...prev, timerIsPlaying: shouldPlay };
            });
          }
        }
      }
    }, [counterId, loadSettings]) // counter 의존성 제거
  );

  /**
   * AppState 기반 데이터 동기화
   *
   * 동작 방식:
   * 1. background 진입 시: 현재 메모리의 카운터 상태를 MMKV에 저장 (방어적 저장)
   * 2. active 복귀 시: MMKV의 데이터와 메모리 상태를 updatedAt 타임스탬프로 비교
   *    - persisted.updatedAt > memory.updatedAt: MMKV 데이터가 더 최신 → 메모리를 MMKV 데이터로 교체
   *    - persisted.updatedAt < memory.updatedAt: 메모리가 더 최신 → MMKV에 메모리 데이터 저장
   *    - updatedAt이 같으면: 변경 없음
   *
   * 참고: counter 상태 변경 시 activateMode, way 등은 별도 useEffect에서 자동 동기화됨
   */
  useEffect(() => {
    const handleAppStateChange = (nextState: string) => {
      if (!counter) {
        return;
      }

      // 백그라운드 진입: MMKV에서 최신 데이터를 읽어서 저장 (다른 화면에서 변경된 내용 보존)
      if (nextState === 'background') {
        const items = getStoredItems();
        const persisted = items.find(
          (item): item is Counter => item.id === counterId && item.type === 'counter'
        );
        if (persisted) {
          // MMKV의 최신 데이터를 사용 (다른 화면에서 변경된 내용 포함)
          const memoryTimestamp = counter.updatedAt ?? 0;
          const persistedTimestamp = persisted.updatedAt ?? 0;
          if (persistedTimestamp >= memoryTimestamp) {
            // MMKV 데이터가 더 최신이거나 같으면 MMKV 데이터를 저장 (이미 저장되어 있지만 확실히 하기 위해)
            updateItem(counter.id, persisted);
          } else {
            // 메모리가 더 최신이면 메모리 데이터를 저장
            updateItem(counter.id, counter);
          }
        } else {
          // MMKV에 없으면 메모리 상태를 저장
          updateItem(counter.id, counter);
        }
        return;
      }

      // 포그라운드 복귀: MMKV와 메모리 상태 비교 후 최신 데이터 선택
      if (nextState === 'active') {
        const items = getStoredItems();
        const persisted = items.find(
          (item): item is Counter => item.id === counterId && item.type === 'counter'
        );
        if (!persisted) {
          return;
        }

        const memoryTimestamp = counter.updatedAt ?? 0;
        const persistedTimestamp = persisted.updatedAt ?? 0;

        if (persistedTimestamp > memoryTimestamp) {
          // MMKV 데이터가 더 최신: 메모리를 MMKV 데이터로 교체
          setCounter(persisted);
          setCurrentCount(String(persisted.count));
        } else if (persistedTimestamp < memoryTimestamp) {
          // 메모리가 더 최신: MMKV에 메모리 데이터 저장
          updateItem(counter.id, counter);
        }
        // updatedAt이 같으면 변경 없음
      }
    };

    // AppState 변경 이벤트 리스너 등록
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    // 컴포넌트 언마운트 시 리스너 정리
    return () => subscription.remove();
  }, [counter, counterId]);


  /**
   * 사운드 파일 로드 및 초기화
   */
  useEffect(() => {
    // Android: res/raw에 있는 파일명을 사용 (확장자는 있어도 되고, 내부에서 소문자/확장자 제거 처리)
    // iOS: 앱 번들에 파일을 포함시킨 뒤 파일명으로 로드해야 합니다.
    const filename = Platform.OS === 'android'
      ? 'src_assets_sounds_click_cut.mp3'
      : 'click_cut.mp3';

    const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        setErrorMessage('사운드 로드 실패:\n' + error.message);
        setErrorModalVisible(true);
        return;
      }
      sound.setVolume(1.0);
      clickSoundRef.current = sound;
    });

    return () => {
      clickSoundRef.current?.release();
    };
  }, []);

  /**
   * 카운터 상태 동기화
   */
  useEffect(() => {
    if (counter?.wayIsChange !== undefined) {
      setWayIsChange(counter.wayIsChange);
    }
    if (counter?.mascotIsActive !== undefined) {
      setMascotIsActive(counter.mascotIsActive);
    }
    if (counter?.way) {
      setWay(counter.way);
    }
  }, [counter]);

  /**
   * 타이머 재생 중 소요 시간 증가
   * timerIsActive가 true이고 timerIsPlaying이 true일 때만 동작
   * 화면에 포커스가 있을 때만 동작 (다른 화면으로 이동하면 일시정지)
   */
  useEffect(() => {
    if (!counter || !counter.timerIsActive || !counter.timerIsPlaying || !isFocused) {
      return;
    }

    const intervalId = setInterval(() => {
      // 최신 counter 값을 가져오기 위해 함수형 업데이트 사용
      setCounter(prev => {
        if (!prev || !prev.timerIsActive || !prev.timerIsPlaying || !isFocused) {
          return prev;
        }

        // 최대값: 9999시간 59분 59초 = 35999999초
        const MAX_ELAPSED_TIME = 35999999;
        const newElapsedTime = Math.min(prev.elapsedTime + 1, MAX_ELAPSED_TIME);
        updateItem(prev.id, { elapsedTime: newElapsedTime });
        return { ...prev, elapsedTime: newElapsedTime };
      });
    }, 1000); // 1초마다 실행

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counter?.timerIsActive, counter?.timerIsPlaying, counter?.id, isFocused]);

  /**
   * 에러 모달 표시
   */
  const showErrorModal = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  }, []);

  /**
   * 클릭 사운드 재생
   */
  const playSound = useCallback(() => {
    if (!soundSetting) {
      return;
    }

    const sound = clickSoundRef.current;
    if (!sound) {
      return;
    }

    const duplicate = sound;
    duplicate.play((success) => {
      if (!success) {
        showErrorModal('사운드 재생 실패');
      }
    });
  }, [soundSetting, showErrorModal]);

  /**
   * 햅틱 피드백 트리거
   */
  const triggerHaptics = useCallback(() => {
    if (!vibrationSetting) {
      return;
    }

    if (Platform.OS === 'android') {
      Vibration.vibrate(50);
    } else {
      HapticFeedback.trigger('impactLight');
    }
  }, [vibrationSetting]);

  /**
   * wayIsChange가 활성화되어 있을 때 방향을 자동으로 반전시킵니다.
   */
  const getReversedWayIfWayIsChange = useCallback((): Way | null => {
    if (wayIsChange) {
      return way === 'front' ? 'back' : 'front';
    }
    return null;
  }, [wayIsChange, way]);

  /**
   * mascotIsActive 토글
   */
  const toggleMascotIsActive = useCallback(() => {
    const newMascotIsActive = !mascotIsActive;

    setMascotIsActive(newMascotIsActive);

    if (counter) {
      updateItem(counter.id, {
        mascotIsActive: newMascotIsActive,
      });
      setCounter({
        ...counter,
        mascotIsActive: newMascotIsActive,
      });
    }
  }, [mascotIsActive, counter]);

  /**
   * 타이머 활성화 토글 함수
   */
  const toggleTimerIsActive = useCallback(() => {
    if (!counter) {
      return;
    }

    const newTimerIsActive = !counter.timerIsActive;
    // 타이머 활성화 시 설정의 "타이머 자동 재생" 설정값을 따름, 비활성화 시는 기존 값 유지
    let newTimerIsPlaying = counter.timerIsPlaying;
    if (newTimerIsActive) {
      const autoPlaySetting = getAutoPlayElapsedTimeSetting();
      newTimerIsPlaying = autoPlaySetting;
    }
    updateItem(counter.id, { timerIsActive: newTimerIsActive, timerIsPlaying: newTimerIsPlaying });
    setCounter({ ...counter, timerIsActive: newTimerIsActive, timerIsPlaying: newTimerIsPlaying });
  }, [counter]);

  /**
   * 타이머 재생 상태 토글 함수
   */
  const toggleTimerIsPlaying = useCallback(() => {
    if (!counter) {
      return;
    }

    const newTimerIsPlaying = !counter.timerIsPlaying;
    updateItem(counter.id, { timerIsPlaying: newTimerIsPlaying });
    setCounter({ ...counter, timerIsPlaying: newTimerIsPlaying });
  }, [counter]);

  /**
   * 타이머 초기화 확인 시 elapsedTime을 0으로 리셋
   */
  const handleTimerResetConfirm = useCallback(() => {
    if (!counter) {
      return;
    }
    updateItem(counter.id, { elapsedTime: 0 });
    setCounter({ ...counter, elapsedTime: 0 });
  }, [counter]);

  /**
   * 구간 기록 추가 (최신 3개만 유지)
   * 실행 취소를 위해 이전 상태 정보도 함께 저장
   */
  const addSectionRecord = useCallback((
    editContent: EditLogType,
    editedCount: number,
    editedMainCount?: number,
    inputSource?: 'voice'
  ): SectionRecord[] => {
    if (!counter) {
      return [];
    }

    const newRecord: SectionRecord = {
      time: getCurrentTime(),
      editedCount,
      editedMainCount,
      editContent,
      inputSource,
      // 실행 취소를 위한 이전 상태 저장
      previousCount: counter.count,
      previousSubCount: counter.subCount,
      previousWay: counter.way,
      previousSubRuleIsActive: counter.subRuleIsActive,
    };
    const currentRecords = counter?.sectionRecords ?? [];
    // 최신 기록을 앞에 추가하고 최신 3개만 유지
    return [newRecord, ...currentRecords].slice(0, 3);
  }, [counter]);

  /**
   * 방향 토글 (wayIsChange가 true일 때만 동작)
   */
  const toggleWay = useCallback(() => {
    if (!wayIsChange) {
      return; // wayIsChange가 false면 방향 토글하지 않음
    }

    const newWay = way === 'front' ? 'back' : 'front';
    setWay(newWay);

    if (counter) {
      // way 변경 시 구간 기록 추가 (editedCount: front=0, back=1)
      const editContent = newWay === 'front' ? 'way_change_front' : 'way_change_back';
      const updatedSectionRecords = addSectionRecord(editContent, newWay === 'front' ? 0 : 1);

      updateItem(counter.id, { way: newWay as Way, sectionRecords: updatedSectionRecords });
      setCounter({ ...counter, way: newWay as Way, sectionRecords: updatedSectionRecords });
    }
  }, [way, counter, wayIsChange, addSectionRecord]);

  /**
   * 숫자 증가 처리
   */
  const handleAdd = useCallback((inputSource?: 'voice') => {
    if (!counter) {
      return;
    }

    const newCount = counter.count + 1;
    if (newCount > 9999) {
      setActiveModal('limit');
      return;
    }

    const newWay = getReversedWayIfWayIsChange();
    const updatedSectionRecords = addSectionRecord('count_increase', newCount, newCount, inputSource);

    const updateData: any = { count: newCount, sectionRecords: updatedSectionRecords };
    if (newWay) {
      updateData.way = newWay as Way;
    }
    updateItem(counter.id, updateData);
    setCounter({ ...counter, count: newCount, way: newWay ?? counter.way, sectionRecords: updatedSectionRecords });

    triggerHaptics();
    playSound();
  }, [counter, getReversedWayIfWayIsChange, triggerHaptics, playSound, addSectionRecord]);

  /**
   * 숫자 감소 처리
   */
  const handleSubtract = useCallback((inputSource?: 'voice') => {
    if (!counter) {
      return;
    }

    const newCount = counter.count - 1;
    if (newCount < 0) {
      setActiveModal('limit');
      return;
    }

    const newWay = getReversedWayIfWayIsChange();
    const updatedSectionRecords = addSectionRecord('count_decrease', newCount, newCount, inputSource);

    const updateData: any = { count: newCount, sectionRecords: updatedSectionRecords };
    if (newWay) {
      updateData.way = newWay as Way;
    }
    updateItem(counter.id, updateData);
    setCounter({ ...counter, count: newCount, way: newWay ?? counter.way, sectionRecords: updatedSectionRecords });

    triggerHaptics();
    playSound();
  }, [counter, getReversedWayIfWayIsChange, triggerHaptics, playSound, addSectionRecord]);

  /**
   * 편집 모달 열기
   */
  const handleEditOpen = useCallback(() => {
    setCurrentCount(counter ? String(counter.count) : '');
    setActiveModal('edit');
  }, [counter]);

  /**
   * 모달 닫기 및 편집 상태 초기화
   */
  const handleClose = useCallback(() => {
    setActiveModal(null);
    setCurrentCount(counter ? String(counter.count) : '');
    setCurrentTargetCount(counter ? String(counter.targetCount || '') : '');
  }, [counter]);

  /**
   * 편집 모달에서 확인 시 카운트 업데이트
   */
  const handleEditConfirm = useCallback((value: string) => {
    if (!counter) {
      return;
    }

    const newValue = parseInt(value, 10);
    if (isNaN(newValue)) {
      return;
    }

    // 변화가 없는 경우 구간 기록 저장하지 않음
    if (newValue === counter.count) {
      handleClose();
      return;
    }

    const updatedSectionRecords = addSectionRecord('count_edit', counter.subCount, newValue);
    const diff = Math.abs(counter.count - newValue);
    const newWay = wayIsChange && diff % 2 === 1
      ? way === 'front' ? 'back' : 'front'
      : way;

    updateItem(counter.id, { count: newValue, way: newWay as Way, sectionRecords: updatedSectionRecords });
    setCounter({ ...counter, count: newValue, way: newWay as Way, sectionRecords: updatedSectionRecords });
    handleClose();
  }, [counter, wayIsChange, way, addSectionRecord, handleClose]);

  /**
   * 초기화 모달에서 확인 시 카운트를 0으로 리셋
   */
  const handleResetConfirm = useCallback(() => {
    if (!counter) {
      return;
    }

    // 이미 0인 경우 구간 기록 저장하지 않음
    if (counter.count === 0) {
      handleClose();
      return;
    }

    const updatedSectionRecords = addSectionRecord('count_reset', counter.subCount, 0);
    const diff = Math.abs(counter.count - 0);
    const newWay = wayIsChange && diff % 2 === 1
      ? way === 'front' ? 'back' : 'front'
      : way;

    updateItem(counter.id, { count: 0, way: newWay as Way, sectionRecords: updatedSectionRecords });
    setCounter({ ...counter, count: 0, way: newWay as Way, sectionRecords: updatedSectionRecords });
    handleClose();
  }, [counter, wayIsChange, way, addSectionRecord, handleClose]);

  /**
   * 목표 단수 편집 모달 열기
   */
  const handleTargetCountOpen = useCallback(() => {
    setCurrentTargetCount(counter ? String(counter.targetCount || '') : '');
    setActiveModal('targetCount');
  }, [counter]);

  /**
   * 목표 단수 편집 모달에서 확인 시 목표 단수 업데이트
   */
  const handleTargetCountConfirm = useCallback((value: string) => {
    if (!counter) {
      return;
    }

    const newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 0) {
      return;
    }

    updateItem(counter.id, { targetCount: newValue });
    setCounter({ ...counter, targetCount: newValue });
    handleClose();
  }, [counter, handleClose]);

  // 보조 카운터 액션 함수들
  const handleSubAdd = useCallback(async (inputSource?: 'voice') => {
    if (!counter) {
      return;
    }

    // 범위 체크: 9999 초과 시 경고 모달 표시
    if (counter.subCount >= 9999) {
      setActiveModal('subLimit');
      return;
    }

    playSound();
    triggerHaptics();

    let newSubCount = counter.subCount + 1;
    let newMainCount = counter.count;

    // 규칙이 활성화되어 있고 규칙 값 이상이 되면 자동 리셋
    if (counter.subRuleIsActive && newSubCount >= counter.subRule) {
      newSubCount = 0;
      newMainCount = counter.count + 1;

      // 본 카운터가 9999를 넘으면 리밋 모달 표시하고 증가하지 않음
      if (newMainCount > 9999) {
        setActiveModal('limit');
        return;
      }
    }

    // way 변경 로직 적용 (본 카운터가 증가할 때)
    const newWay = newMainCount > counter.count ? getReversedWayIfWayIsChange() : null;

    const updatedSectionRecords = addSectionRecord('sub_count_increase', newSubCount, newMainCount, inputSource);
    const updatedCounter = {
      ...counter,
      subCount: newSubCount,
      count: newMainCount,
      way: newWay ?? counter.way,
      sectionRecords: updatedSectionRecords,
    };

    await updateItem(counter.id, updatedCounter);
    setCounter(updatedCounter);
  }, [counter, playSound, triggerHaptics, getReversedWayIfWayIsChange, addSectionRecord]);

  const handleSubSubtract = useCallback(async (inputSource?: 'voice') => {
    if (!counter) {
      return;
    }

    // 범위 체크: 0 미만 시 경고 모달 표시
    if (counter.subCount <= 0) {
      setActiveModal('subLimit');
      return;
    }

    playSound();
    triggerHaptics();

    const newSubCount = counter.subCount - 1;
    const updatedSectionRecords = addSectionRecord('sub_count_decrease', newSubCount, counter.count, inputSource);

    const updatedCounter = {
      ...counter,
      subCount: newSubCount,
      sectionRecords: updatedSectionRecords,
    };

    await updateItem(counter.id, updatedCounter);
    setCounter(updatedCounter);
  }, [counter, playSound, triggerHaptics, addSectionRecord]);

  const handleSubReset = useCallback(() => {
    setActiveModal('subReset');
  }, []);

  const handleSubEdit = useCallback(() => {
    setActiveModal('subEdit');
  }, []);

  const handleSubRule = useCallback(() => {
    setActiveModal('rule');
  }, []);

  // 보조 카운터 초기화 확인
  const handleSubResetConfirm = useCallback(() => {
    if (!counter) {
      return;
    }

    // 이미 0인 경우 구간 기록 저장하지 않음
    if (counter.subCount === 0) {
      handleClose();
      return;
    }

    const updatedSectionRecords = addSectionRecord('sub_count_reset', 0, counter.count);
    const updatedCounter = {
      ...counter,
      subCount: 0,
      sectionRecords: updatedSectionRecords,
    };

    updateItem(counter.id, updatedCounter);
    setCounter(updatedCounter);
    handleClose();
  }, [counter, handleClose, addSectionRecord]);

  // 보조 카운터 편집 확인
  const handleSubEditConfirm = useCallback((value: string) => {
    if (!counter) {
      return;
    }

    const newValue = parseInt(value, 10);

    let newSubCount = newValue;
    let newMainCount = counter.count;

    // 규칙이 활성화되어 있고 규칙 값 이상이 되면 자동 리셋
    if (counter.subRuleIsActive && newSubCount >= counter.subRule) {
      newSubCount = 0;
      newMainCount = counter.count + 1;

      // 본 카운터가 9999를 넘으면 리밋 모달 표시하고 증가하지 않음
      if (newMainCount > 9999) {
        // 현재 모달을 먼저 닫고, 그 다음에 리밋 모달 표시
        handleClose();
        setTimeout(() => {
          setActiveModal('limit');
        }, 100); // 모달 닫기 애니메이션 후에 리밋 모달 표시
        return;
      }
    }

    // 변화가 없는 경우 구간 기록 저장하지 않음
    if (newSubCount === counter.subCount && newMainCount === counter.count) {
      handleClose();
      return;
    }

    // way 변경 로직 적용 (본 카운터가 증가할 때)
    const newWay = newMainCount > counter.count ? getReversedWayIfWayIsChange() : null;

    const updatedSectionRecords = addSectionRecord('sub_count_edit', newSubCount, newMainCount);
    const updatedCounter = {
      ...counter,
      subCount: newSubCount,
      count: newMainCount,
      way: newWay ?? counter.way,
      sectionRecords: updatedSectionRecords,
    };

    updateItem(counter.id, updatedCounter);
    setCounter(updatedCounter);
    handleClose();
  }, [counter, handleClose, getReversedWayIfWayIsChange, addSectionRecord]);

  // 보조 카운터 규칙 확인
  const handleSubRuleConfirm = useCallback((rule: number, isRuleActive: boolean) => {
    if (!counter) {
      return;
    }

    // 규칙이 활성화되려고 하는데 값이 0이면 에러
    if (isRuleActive && rule <= 0) {
      showErrorModal('규칙 값은 1 이상이어야 합니다.');
      return;
    }

    let newSubCount = counter.subCount;
    let newMainCount = counter.count;

    // 규칙을 활성화할 때 기존 보조 카운터 값이 규칙 값 이상이면 자동 리셋
    if (isRuleActive && counter.subCount >= rule) {
      newSubCount = 0;
      newMainCount = counter.count + 1;
    }

    // 변화가 없는 경우 구간 기록 저장하지 않음 (이미 활성화/비활성화 상태인 경우)
    if (isRuleActive === counter.subRuleIsActive && rule === counter.subRule) {
      handleClose();
      return;
    }

    // way 변경 로직 적용 (본 카운터가 증가할 때)
    const newWay = newMainCount > counter.count ? getReversedWayIfWayIsChange() : null;

    // 규칙 활성화/비활성화에 따라 구간 기록 추가
    // 단수/코수가 바뀌는 경우에만 숫자 정보 전달 (표시 형식이 달라짐)
    const hasCountChange = newSubCount !== counter.subCount || newMainCount !== counter.count;
    const updatedSectionRecords = isRuleActive
      ? addSectionRecord('sub_rule_activate', hasCountChange ? newSubCount : counter.subCount, hasCountChange ? newMainCount : undefined)
      : addSectionRecord('sub_rule_deactivate', counter.subCount, counter.count);

    const updatedCounter = {
      ...counter,
      subRule: rule,
      subRuleIsActive: isRuleActive,
      subCount: newSubCount,
      count: newMainCount,
      way: newWay ?? counter.way,
      sectionRecords: updatedSectionRecords,
    };

    updateItem(counter.id, updatedCounter);
    setCounter(updatedCounter);
    handleClose();
  }, [counter, handleClose, showErrorModal, addSectionRecord, getReversedWayIfWayIsChange]);

  // 보조 카운터 모달 토글
  const handleSubModalToggle = useCallback(async () => {
    if (!counter) {
      return;
    }

    const updatedCounter = {
      ...counter,
      subModalIsOpen: !counter.subModalIsOpen,
    };

    await updateItem(counter.id, updatedCounter);
    setCounter(updatedCounter);
  }, [counter]);

  // 구간 기록 모달 토글
  const handleSectionModalToggle = useCallback(async () => {
    if (!counter) {
      return;
    }

    const updatedCounter = {
      ...counter,
      sectionModalIsOpen: !counter.sectionModalIsOpen,
    };

    await updateItem(counter.id, updatedCounter);
    setCounter(updatedCounter);
  }, [counter]);

  // 구간 기록 실행 취소 (최신 기록 제거 및 이전 상태로 복원)
  const handleSectionUndo = useCallback(async () => {
    if (!counter || !counter.sectionRecords || counter.sectionRecords.length === 0) {
      return;
    }

    // 최신 기록 가져오기 (첫 번째 항목)
    const latestRecord = counter.sectionRecords[0];

    // 이전 상태로 복원
    const restoredCount = latestRecord.previousCount ?? counter.count;
    const restoredSubCount = latestRecord.previousSubCount ?? counter.subCount;
    const restoredWay = latestRecord.previousWay ?? counter.way;
    const restoredSubRuleIsActive = latestRecord.previousSubRuleIsActive ?? counter.subRuleIsActive;

    // 최신 기록 제거 (첫 번째 항목 제거)
    const updatedSectionRecords = counter.sectionRecords.slice(1);

    // 카운터 상태 업데이트
    const updatedCounter = {
      ...counter,
      count: restoredCount,
      subCount: restoredSubCount,
      way: restoredWay ?? counter.way,
      subRuleIsActive: restoredSubRuleIsActive,
      sectionRecords: updatedSectionRecords,
    };

    await updateItem(counter.id, updatedCounter);
    setCounter(updatedCounter);

    // way 상태도 업데이트
    if (restoredWay) {
      setWay(restoredWay);
    }
  }, [counter, setWay]);

  return {
    // 상태
    counter,
    wayIsChange,
    mascotIsActive,
    way,
    currentCount,
    currentTargetCount,
    activeModal,
    errorModalVisible,
    errorMessage,

    // 보조 카운터 상태
    subCount: counter?.subCount ?? 0,
    subRule: counter?.subRule ?? 0,
    subRuleIsActive: counter?.subRuleIsActive ?? false,
    subModalIsOpen: counter?.subModalIsOpen ?? false,

    // 액션 함수들
    handleAdd,
    handleSubtract,
    handleEditOpen,
    handleEditConfirm,
    handleResetConfirm,
    handleClose,
    handleTargetCountOpen,
    handleTargetCountConfirm,
    toggleMascotIsActive,
    toggleWay,
    toggleTimerIsActive,
    toggleTimerIsPlaying,
    handleTimerResetConfirm,
    showErrorModal,
    setErrorModalVisible,
    setActiveModal,

    // 보조 카운터 액션 함수들
    handleSubAdd,
    handleSubSubtract,
    handleSubReset,
    handleSubEdit,
    handleSubRule,
    handleSubResetConfirm,
    handleSubEditConfirm,
    handleSubRuleConfirm,
    handleSubModalToggle,

    // 구간 기록 모달 액션 함수
    handleSectionModalToggle,
    handleSectionUndo,

    // 패딩 탑 애니메이션
  };
};
