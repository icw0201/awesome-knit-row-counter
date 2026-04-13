// src/storage/settings.ts
import { MMKV } from 'react-native-mmkv';
import { DEFAULT_VOICE_COMMAND_KEYWORDS } from '@constants/voiceCommandKeywords';
import { SortCriteria, SortOrder } from './types';

// MMKV 스토리지 인스턴스 생성
export const storage = new MMKV();

// 설정 키 상수 정의
const KEY_SOUND = 'settings.sound';
const KEY_VIBRATION = 'settings.vibration';
const KEY_SCREEN_AWAKE = 'settings.screenAwake';
const KEY_SORT_CRITERIA = 'settings.sortCriteria';
const KEY_SORT_ORDER = 'settings.sortOrder';
const KEY_MOVE_COMPLETED_TO_BOTTOM = 'settings.moveCompletedToBottom';
const KEY_AUTO_PLAY_ELAPSED_TIME = 'settings.autoPlayElapsedTime';
const KEY_TOOLTIP_ENABLED = 'settings.tooltipEnabled';
const KEY_SHOW_ELAPSED_TIME_IN_LIST = 'settings.showElapsedTimeInList';
const KEY_VOICE_COMMANDS_ENABLED = 'settings.voiceCommandsEnabled';
const KEY_SELECTED_VOICE_COMMAND_MODE = 'settings.selectedVoiceCommandMode';
const KEY_CUSTOM_VOICE_COMMAND_INPUTS = 'settings.customVoiceCommandInputs';
const KEY_SUB_SLIDE_MODALS_ENABLED = 'settings.subSlideModalsEnabled';
const KEY_VOICE_RECOGNITION_PERMISSION_STATUS =
  'settings.voiceRecognitionPermissionStatus';

// 기본값 상수 정의
const DEFAULT_SOUND = true;
const DEFAULT_VIBRATION = true;
const DEFAULT_SCREEN_AWAKE = false;
const DEFAULT_SORT_CRITERIA: SortCriteria = 'created';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';
const DEFAULT_MOVE_COMPLETED_TO_BOTTOM = false;
const DEFAULT_AUTO_PLAY_ELAPSED_TIME = true;
const DEFAULT_TOOLTIP_ENABLED = true;
const DEFAULT_SHOW_ELAPSED_TIME_IN_LIST = false;
const DEFAULT_VOICE_COMMANDS_ENABLED = false;
const DEFAULT_SELECTED_VOICE_COMMAND_MODE: VoiceCommandSettingMode = 'default';
const DEFAULT_SUB_SLIDE_MODALS_ENABLED = true;

export type VoiceCommandSettingMode = 'default' | 'custom';

export interface CustomVoiceCommandInputsSetting {
  mainDecrease: [string, string, string];
  mainIncrease: [string, string, string];
  subDecrease: [string, string, string];
  subIncrease: [string, string, string];
}

export interface EffectiveVoiceCommandSetting {
  mode: VoiceCommandSettingMode;
  customInputs: CustomVoiceCommandInputsSetting;
  addKeywords: string[];
  subtractKeywords: string[];
  subAddKeywords: string[];
  subSubtractKeywords: string[];
  addHint: string;
  subtractHint: string;
  subAddHint: string;
  subSubtractHint: string;
}

const DEFAULT_CUSTOM_VOICE_COMMAND_INPUTS: CustomVoiceCommandInputsSetting = {
  mainDecrease: ['', '', ''],
  mainIncrease: ['', '', ''],
  subDecrease: ['', '', ''],
  subIncrease: ['', '', ''],
};

export type VoiceRecognitionPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied';

const isThreeStringTuple = (value: unknown): value is [string, string, string] => {
  return Array.isArray(value)
    && value.length === 3
    && value.every((item) => typeof item === 'string');
};

const normalizeCustomVoiceCommandInputs = (
  value: unknown
): CustomVoiceCommandInputsSetting => {
  if (typeof value !== 'object' || value == null) {
    return DEFAULT_CUSTOM_VOICE_COMMAND_INPUTS;
  }

  const candidate = value as Partial<Record<keyof CustomVoiceCommandInputsSetting, unknown>>;

  return {
    mainDecrease: isThreeStringTuple(candidate.mainDecrease)
      ? candidate.mainDecrease
      : DEFAULT_CUSTOM_VOICE_COMMAND_INPUTS.mainDecrease,
    mainIncrease: isThreeStringTuple(candidate.mainIncrease)
      ? candidate.mainIncrease
      : DEFAULT_CUSTOM_VOICE_COMMAND_INPUTS.mainIncrease,
    subDecrease: isThreeStringTuple(candidate.subDecrease)
      ? candidate.subDecrease
      : DEFAULT_CUSTOM_VOICE_COMMAND_INPUTS.subDecrease,
    subIncrease: isThreeStringTuple(candidate.subIncrease)
      ? candidate.subIncrease
      : DEFAULT_CUSTOM_VOICE_COMMAND_INPUTS.subIncrease,
  };
};

const normalizeVoiceCommandKeywordList = (values: readonly string[]): string[] => {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );
};

/**
 * 사운드 설정을 저장합니다.
 * @param value 사운드 활성화 여부
 */
export const setSoundSetting = (value: boolean) => {
  storage.set(KEY_SOUND, JSON.stringify(value));
};

/**
 * 사운드 설정을 가져옵니다.
 * @returns 사운드 활성화 여부 (기본값: true)
 */
export const getSoundSetting = (): boolean => {
  const value = storage.getString(KEY_SOUND);
  return value ? JSON.parse(value) : DEFAULT_SOUND;
};

/**
 * 진동 설정을 저장합니다.
 * @param value 진동 활성화 여부
 */
export const setVibrationSetting = (value: boolean) => {
  storage.set(KEY_VIBRATION, JSON.stringify(value));
};

/**
 * 진동 설정을 가져옵니다.
 * @returns 진동 활성화 여부 (기본값: true)
 */
export const getVibrationSetting = (): boolean => {
  const value = storage.getString(KEY_VIBRATION);
  return value ? JSON.parse(value) : DEFAULT_VIBRATION;
};

/**
 * 화면 켜짐 설정을 저장합니다.
 * @param value 화면 켜짐 유지 여부
 */
export const setScreenAwakeSetting = (value: boolean) => {
  storage.set(KEY_SCREEN_AWAKE, JSON.stringify(value));
};

/**
 * 화면 켜짐 설정을 가져옵니다.
 * @returns 화면 켜짐 유지 여부 (기본값: false)
 */
export const getScreenAwakeSetting = (): boolean => {
  const value = storage.getString(KEY_SCREEN_AWAKE);
  return value ? JSON.parse(value) : DEFAULT_SCREEN_AWAKE;
};

/**
 * screenAwake 설정 변경을 구독합니다. (변경 시점만 알려줌)
 * - 키 문자열/리스너 등록을 이 파일로 숨겨서 사용처를 깔끔하게 유지
 * @returns unsubscribe 함수
 */
export const subscribeScreenAwakeSettingChange = (callback: () => void) => {
  const listener = storage.addOnValueChangedListener((changedKey) => {
    if (changedKey === KEY_SCREEN_AWAKE) {
      callback();
    }
  });

  return () => {
    listener.remove();
  };
};

/**
 * 정렬 기준 설정을 저장합니다.
 * @param value 정렬 기준 ('name' | 'created' | 'startDate' | 'endDate' | 'progress' | 'elapsedTime')
 */
export const setSortCriteriaSetting = (value: SortCriteria) => {
  storage.set(KEY_SORT_CRITERIA, JSON.stringify(value));
};

/**
 * 정렬 기준 설정을 가져옵니다.
 * @returns 정렬 기준 (기본값: 'created')
 */
export const getSortCriteriaSetting = (): SortCriteria => {
  const value = storage.getString(KEY_SORT_CRITERIA);
  return value ? JSON.parse(value) : DEFAULT_SORT_CRITERIA;
};

/**
 * 정렬 순서 설정을 저장합니다.
 * @param value 정렬 순서 ('asc' | 'desc')
 */
export const setSortOrderSetting = (value: SortOrder) => {
  storage.set(KEY_SORT_ORDER, JSON.stringify(value));
};

/**
 * 정렬 순서 설정을 가져옵니다.
 * @returns 정렬 순서 (기본값: 'desc')
 */
export const getSortOrderSetting = (): SortOrder => {
  const value = storage.getString(KEY_SORT_ORDER);
  return value ? JSON.parse(value) : DEFAULT_SORT_ORDER;
};

/**
 * 완성된 편물을 하단으로 이동 설정을 저장합니다.
 * @param value 완성된 편물을 하단으로 이동 여부
 */
export const setMoveCompletedToBottomSetting = (value: boolean) => {
  storage.set(KEY_MOVE_COMPLETED_TO_BOTTOM, JSON.stringify(value));
};

/**
 * 완성된 편물을 하단으로 이동 설정을 가져옵니다.
 * @returns 완성된 편물을 하단으로 이동 여부 (기본값: false)
 */
export const getMoveCompletedToBottomSetting = (): boolean => {
  const value = storage.getString(KEY_MOVE_COMPLETED_TO_BOTTOM);
  return value ? JSON.parse(value) : DEFAULT_MOVE_COMPLETED_TO_BOTTOM;
};

/**
 * 카운터 진입시 소요 시간 자동 재생 설정을 저장합니다.
 * @param value 소요 시간 자동 재생 활성화 여부
 */
export const setAutoPlayElapsedTimeSetting = (value: boolean) => {
  storage.set(KEY_AUTO_PLAY_ELAPSED_TIME, JSON.stringify(value));
};

/**
 * 카운터 진입시 소요 시간 자동 재생 설정을 가져옵니다.
 * @returns 소요 시간 자동 재생 활성화 여부 (기본값: true)
 */
export const getAutoPlayElapsedTimeSetting = (): boolean => {
  const value = storage.getString(KEY_AUTO_PLAY_ELAPSED_TIME);
  return value ? JSON.parse(value) : DEFAULT_AUTO_PLAY_ELAPSED_TIME;
};

/**
 * 툴팁 설정을 저장합니다.
 * @param value 툴팁 활성화 여부
 */
export const setTooltipEnabledSetting = (value: boolean) => {
  storage.set(KEY_TOOLTIP_ENABLED, JSON.stringify(value));
};

/**
 * 툴팁 설정을 가져옵니다.
 * @returns 툴팁 활성화 여부 (기본값: true)
 */
export const getTooltipEnabledSetting = (): boolean => {
  const value = storage.getString(KEY_TOOLTIP_ENABLED);
  return value ? JSON.parse(value) : DEFAULT_TOOLTIP_ENABLED;
};

/**
 * 목록에서 소요 시간 표시 설정을 저장합니다.
 * @param value 소요 시간 표시 여부
 */
export const setShowElapsedTimeInListSetting = (value: boolean) => {
  storage.set(KEY_SHOW_ELAPSED_TIME_IN_LIST, JSON.stringify(value));
};

/**
 * 목록에서 소요 시간 표시 설정을 가져옵니다.
 * @returns 소요 시간 표시 여부 (기본값: false)
 */
export const getShowElapsedTimeInListSetting = (): boolean => {
  const value = storage.getString(KEY_SHOW_ELAPSED_TIME_IN_LIST);
  return value ? JSON.parse(value) : DEFAULT_SHOW_ELAPSED_TIME_IN_LIST;
};

/**
 * 음성 인식 단수 증감 기능 활성화 설정을 저장합니다.
 * @param value 음성 인식 단수 증감 기능 활성화 여부
 */
export const setVoiceCommandsEnabledSetting = (value: boolean) => {
  storage.set(KEY_VOICE_COMMANDS_ENABLED, JSON.stringify(value));
};

/**
 * 음성 인식 단수 증감 기능 활성화 설정을 가져옵니다.
 * @returns 음성 인식 단수 증감 기능 활성화 여부 (기본값: false)
 */
export const getVoiceCommandsEnabledSetting = (): boolean => {
  const value = storage.getString(KEY_VOICE_COMMANDS_ENABLED);
  return value ? JSON.parse(value) : DEFAULT_VOICE_COMMANDS_ENABLED;
};

/**
 * 음성 명령어 설정 모드를 저장합니다.
 * @param value 음성 명령어 설정 모드
 */
export const setSelectedVoiceCommandModeSetting = (
  value: VoiceCommandSettingMode
) => {
  storage.set(KEY_SELECTED_VOICE_COMMAND_MODE, value);
};

/**
 * 음성 명령어 설정 모드를 가져옵니다.
 * @returns 음성 명령어 설정 모드 (기본값: 'default')
 */
export const getSelectedVoiceCommandModeSetting = (): VoiceCommandSettingMode => {
  const value = storage.getString(KEY_SELECTED_VOICE_COMMAND_MODE);

  return value === 'custom' || value === 'default'
    ? value
    : DEFAULT_SELECTED_VOICE_COMMAND_MODE;
};

/**
 * 사용자 지정 음성 명령어 입력값을 저장합니다.
 * @param value 사용자 지정 음성 명령어 입력값
 */
export const setCustomVoiceCommandInputsSetting = (
  value: CustomVoiceCommandInputsSetting
) => {
  storage.set(KEY_CUSTOM_VOICE_COMMAND_INPUTS, JSON.stringify(value));
};

/**
 * 사용자 지정 음성 명령어 입력값을 가져옵니다.
 * @returns 사용자 지정 음성 명령어 입력값
 */
export const getCustomVoiceCommandInputsSetting =
  (): CustomVoiceCommandInputsSetting => {
    const value = storage.getString(KEY_CUSTOM_VOICE_COMMAND_INPUTS);

    if (!value) {
      return DEFAULT_CUSTOM_VOICE_COMMAND_INPUTS;
    }

    try {
      return normalizeCustomVoiceCommandInputs(JSON.parse(value));
    } catch {
      return DEFAULT_CUSTOM_VOICE_COMMAND_INPUTS;
    }
  };

/**
 * 현재 적용 중인 음성 명령어 설정을 가져옵니다.
 * - 기본 설정 선택 시: 기본 키워드/표시 문구 반환
 * - 사용자 설정 선택 시: 사용자 입력값 기반 키워드/표시 문구 반환
 */
export const getEffectiveVoiceCommandSetting = (): EffectiveVoiceCommandSetting => {
  const mode = getSelectedVoiceCommandModeSetting();
  const customInputs = getCustomVoiceCommandInputsSetting();

  if (mode === 'custom') {
    const addKeywords = normalizeVoiceCommandKeywordList(customInputs.mainIncrease);
    const subtractKeywords = normalizeVoiceCommandKeywordList(customInputs.mainDecrease);
    const subAddKeywords = normalizeVoiceCommandKeywordList(customInputs.subIncrease);
    const subSubtractKeywords = normalizeVoiceCommandKeywordList(customInputs.subDecrease);

    return {
      mode,
      customInputs,
      addKeywords,
      subtractKeywords,
      subAddKeywords,
      subSubtractKeywords,
      addHint: customInputs.mainIncrease[0] ?? '',
      subtractHint: customInputs.mainDecrease[0] ?? '',
      subAddHint: customInputs.subIncrease[0] ?? '',
      subSubtractHint: customInputs.subDecrease[0] ?? '',
    };
  }

  return {
    mode,
    customInputs,
    addKeywords: [...DEFAULT_VOICE_COMMAND_KEYWORDS.add],
    subtractKeywords: [...DEFAULT_VOICE_COMMAND_KEYWORDS.subtract],
    subAddKeywords: [...DEFAULT_VOICE_COMMAND_KEYWORDS.subAdd],
    subSubtractKeywords: [...DEFAULT_VOICE_COMMAND_KEYWORDS.subSubtract],
    addHint: DEFAULT_VOICE_COMMAND_KEYWORDS.add[0],
    subtractHint: DEFAULT_VOICE_COMMAND_KEYWORDS.subtract[0],
    subAddHint: DEFAULT_VOICE_COMMAND_KEYWORDS.subAdd[0],
    subSubtractHint: DEFAULT_VOICE_COMMAND_KEYWORDS.subSubtract[0],
  };
};

/**
 * CounterDetail의 슬라이드 모달 표시 설정을 저장합니다.
 * @param value 슬라이드 모달 표시 여부
 */
export const setSubSlideModalsEnabledSetting = (value: boolean) => {
  storage.set(KEY_SUB_SLIDE_MODALS_ENABLED, JSON.stringify(value));
};

/**
 * CounterDetail의 슬라이드 모달 표시 설정을 가져옵니다.
 * @returns 슬라이드 모달 표시 여부 (기본값: true)
 */
export const getSubSlideModalsEnabledSetting = (): boolean => {
  const value = storage.getString(KEY_SUB_SLIDE_MODALS_ENABLED);
  return value ? JSON.parse(value) : DEFAULT_SUB_SLIDE_MODALS_ENABLED;
};

/**
 * 슬라이드 모달 표시 설정 변경을 구독합니다.
 * @returns unsubscribe 함수
 */
export const subscribeSubSlideModalsEnabledSettingChange = (
  callback: () => void
) => {
  const listener = storage.addOnValueChangedListener((changedKey) => {
    if (changedKey === KEY_SUB_SLIDE_MODALS_ENABLED) {
      callback();
    }
  });

  return () => {
    listener.remove();
  };
};

/**
 * 음성 인식 권한 상태를 저장합니다.
 * @param value 권한 상태
 */
export const setVoiceRecognitionPermissionStatusSetting = (
  value: VoiceRecognitionPermissionStatus
) => {
  storage.set(KEY_VOICE_RECOGNITION_PERMISSION_STATUS, value);
};

/**
 * 음성 인식 권한 상태를 가져옵니다.
 * @returns 권한 상태 (기본값: 'undetermined')
 */
export const getVoiceRecognitionPermissionStatusSetting =
  (): VoiceRecognitionPermissionStatus => {
    const value = storage.getString(KEY_VOICE_RECOGNITION_PERMISSION_STATUS);

    if (value === 'granted' || value === 'denied' || value === 'undetermined') {
      return value;
    }

    return 'undetermined';
  };

