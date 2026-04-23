import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Item, SortCriteria, SortOrder } from './types';
import { getStoredItems } from './storage';
import {
  getAutoPlayElapsedTimeSetting,
  getCustomVoiceCommandInputsSetting,
  getMoveCompletedToBottomSetting,
  getScreenAwakeSetting,
  getSelectedVoiceCommandModeSetting,
  getShowElapsedTimeInListSetting,
  getSoundSetting,
  getSortCriteriaSetting,
  getSortOrderSetting,
  getSubSlideModalsEnabledSetting,
  getTooltipEnabledSetting,
  getVibrationSetting,
  getVoiceCommandsEnabledSetting,
  getVoiceRecognitionPermissionStatusSetting,
  setAutoPlayElapsedTimeSetting,
  setCustomVoiceCommandInputsSetting,
  setMoveCompletedToBottomSetting,
  setScreenAwakeSetting,
  setSelectedVoiceCommandModeSetting,
  setShowElapsedTimeInListSetting,
  setSoundSetting,
  setSortCriteriaSetting,
  setSortOrderSetting,
  storage,
  setSubSlideModalsEnabledSetting,
  setTooltipEnabledSetting,
  setVibrationSetting,
  setVoiceCommandsEnabledSetting,
  setVoiceRecognitionPermissionStatusSetting,
  type CustomVoiceCommandInputsSetting,
  type VoiceCommandSettingMode,
  type VoiceRecognitionPermissionStatus,
} from './settings';
import {
  CURRENT_DATA_VERSION,
  ensureDataMigration,
} from './migration';
import {
  getDismissedOnestoreAppVersion,
  getDismissedOnestoreAt,
  getDismissedStoreVersion,
} from './updatePrompt';

const APP_ID = 'awesome-knit-row-counter';
const BACKUP_FORMAT_VERSION = 1;
const MAX_COUNTER_VALUE = 9999;
const MAX_ELAPSED_TIME_SECONDS = 35999999;
const MAX_TITLE_LENGTH = 15;
const MAX_LONG_TEXT_LENGTH = 500;
const MAX_CUSTOM_VOICE_COMMAND_LENGTH = 2;
const MAX_SECTION_RECORDS = 30;
const EMPTY_SECTION_RECORD_DATE = '00000000';

const STORAGE_KEY = 'knit_items';
const DATA_VERSION_KEY = 'data_version';

const KEY_DISMISSED_STORE_VERSION = 'updatePrompt.dismissedStoreVersion';
const KEY_DISMISSED_ONESTORE_AT = 'updatePrompt.dismissedOnestoreAt';
const KEY_DISMISSED_ONESTORE_APP_VERSION = 'updatePrompt.dismissedOnestoreAppVersion';

const BACKUP_DIRECTORY_NAME = 'backups';
const BACKUP_FILE_PREFIX = 'awesome-knit-row-counter-backup';
const BACKUP_FILE_EXTENSION = '.json';

type Nullable<T> = T | null;

export interface BackupSettingsPayload {
  sound: boolean;
  vibration: boolean;
  screenAwake: boolean;
  sortCriteria: SortCriteria;
  sortOrder: SortOrder;
  moveCompletedToBottom: boolean;
  autoPlayElapsedTime: boolean;
  tooltipEnabled: boolean;
  showElapsedTimeInList: boolean;
  voiceCommandsEnabled: boolean;
  selectedVoiceCommandMode: VoiceCommandSettingMode;
  customVoiceCommandInputs: CustomVoiceCommandInputsSetting;
  subSlideModalsEnabled: boolean;
  voiceRecognitionPermissionStatus: VoiceRecognitionPermissionStatus;
}

export interface BackupUpdatePromptPayload {
  dismissedStoreVersion: Nullable<string>;
  dismissedOnestoreAt: Nullable<number>;
  dismissedOnestoreAppVersion: Nullable<string>;
}

export interface BackupPayload {
  knitItems: Item[];
  settings: BackupSettingsPayload;
  updatePrompt: BackupUpdatePromptPayload;
}

export interface BackupDocument {
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  appId: typeof APP_ID;
  exportedAt: string;
  dataVersion: number;
  payload: BackupPayload;
}

export interface BackupSummary {
  exportedAtLabel: string;
  totalItems: number;
  projectCount: number;
  counterCount: number;
}

/** unknown 값을 plain object 레코드로 좁히는 기본 타입 가드 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

/** unknown 값이 boolean 인지 확인하는 기본 타입 가드 */
const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

/** 문자열 배열인지 확인한다. project.counterIds 같은 필드 검증에 사용한다. */
const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

/** 앱이 생성하는 아이템 ID 형식(proj_/counter_ + timestamp)인지 확인한다. */
const isGeneratedItemId = (value: unknown): value is string => {
  return typeof value === 'string' && /^(proj|counter)_\d+$/.test(value);
};

/** 사용자 지정 음성 명령어 3칸 입력 구조인지 확인한다. */
const isThreeStringTuple = (value: unknown): value is [string, string, string] => {
  return Array.isArray(value)
    && value.length === 3
    && value.every((item) => typeof item === 'string');
};

/** 이모지/조합형 문자를 고려한 글자 수를 계산한다. */
const getCharacterLength = (value: string): number => {
  return Array.from(value).length;
};

/** 앞뒤 공백이 이미 제거된 문자열인지 확인한다. */
const isTrimmedString = (value: string): boolean => {
  return value.trim() === value;
};

/** 필수 문자열 필드가 trim 상태이며 비어 있지 않고 최대 길이 이내인지 확인한다. */
const isTrimmedNonEmptyStringWithinLength = (
  value: unknown,
  maxLength: number
): value is string => {
  return typeof value === 'string'
    && isTrimmedString(value)
    && value.length > 0
    && getCharacterLength(value) <= maxLength;
};

/** 선택 문자열 필드가 trim 상태이며 최대 길이 이내인지 확인한다. */
const isOptionalTrimmedStringWithinLength = (
  value: unknown,
  maxLength: number
): value is string | undefined => {
  return value === undefined
    || (
      typeof value === 'string'
      && isTrimmedString(value)
      && getCharacterLength(value) <= maxLength
    );
};

/** 0 이상의 정수인지 확인한다. */
const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
};

/** 선택 숫자 필드가 없거나 0 이상의 정수인지 확인한다. */
const isOptionalNonNegativeInteger = (value: unknown): value is number | undefined => {
  return value === undefined || isNonNegativeInteger(value);
};

/** 카운터 입력 범위(0~9999)에 들어오는 값인지 확인한다. */
const isCounterValue = (value: unknown): value is number => {
  return isNonNegativeInteger(value) && value <= MAX_COUNTER_VALUE;
};

/** 선택 카운터 값이 없거나 0~9999 범위인지 확인한다. */
const isOptionalCounterValue = (value: unknown): value is number | undefined => {
  return value === undefined || isCounterValue(value);
};

/** elapsedTime 이 앱이 지원하는 초 범위 안에 있는지 확인한다. */
const isElapsedTimeSeconds = (value: unknown): value is number => {
  return isNonNegativeInteger(value) && value <= MAX_ELAPSED_TIME_SECONDS;
};

// 백업에는 레거시 compact(yyyyMMdd)와 UI 입력형(yyyy.mm.dd)이 함께 존재할 수 있다.
// 이 함수는 두 형식을 모두 숫자 파트로 분해하기 위한 공통 파서다.
const parseStoredDateParts = (value: string): [number, number, number] | null => {
  const compactMatch = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return [
      Number(compactMatch[1]),
      Number(compactMatch[2]),
      Number(compactMatch[3]),
    ];
  }

  const dottedMatch = value.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (dottedMatch) {
    return [
      Number(dottedMatch[1]),
      Number(dottedMatch[2]),
      Number(dottedMatch[3]),
    ];
  }

  return null;
};

const isValidStoredDateString = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const parts = parseStoredDateParts(value);
  if (!parts) {
    return false;
  }

  const [year, month, day] = parts;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
};

const isCompactDateString = (value: unknown): value is string => {
  return typeof value === 'string'
    && /^\d{8}$/.test(value)
    && isValidStoredDateString(value);
};

// sectionRecords.date는 사용자가 직접 입력하지 않는다.
// 다만 구버전 마이그레이션에서 날짜를 알 수 없는 기존 기록에 00000000 플레이스홀더를 넣으므로
// 완성형 날짜 외에 이 sentinel 값도 함께 허용한다.
const isSectionRecordDateString = (value: unknown): value is string => {
  return value === EMPTY_SECTION_RECORD_DATE || isCompactDateString(value);
};

// info의 시작일/종료일은 TextInputBox(type='date')의 "부분 입력 상태"도 그대로 저장될 수 있다.
// 그래서 실제 달력 유효성보다, 설정 화면에서 만들 수 있는 문자열 형태를 기준으로 검증한다.
const isInfoDateInputString = (value: unknown): value is string => {
  return typeof value === 'string'
    && isTrimmedString(value)
    && (
      /^\d{1,4}$/.test(value)
      || /^\d{4}\.\d{1,2}$/.test(value)
      || /^\d{4}\.\d{2}\.\d{1,2}$/.test(value)
      || /^\d{8}$/.test(value)
    );
};

const isOptionalInfoDateInputString = (value: unknown): value is string | undefined => {
  return value === undefined
    || value === ''
    || isInfoDateInputString(value);
};

/** section record 의 시각 문자열이 HH:MM:SS 형식인지 확인한다. */
const isTimeString = (value: unknown): value is string => {
  return typeof value === 'string'
    && /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value);
};

/** 선택 문자열 필드가 없거나 문자열인지 확인한다. */
const isOptionalString = (value: unknown): value is string | undefined => {
  return value === undefined || typeof value === 'string';
};

/** 선택 boolean 필드가 없거나 boolean 인지 확인한다. */
const isOptionalBoolean = (value: unknown): value is boolean | undefined => {
  return value === undefined || typeof value === 'boolean';
};

/** way 값이 front/back 중 하나인지 확인한다. */
const isWay = (value: unknown): value is 'front' | 'back' => {
  return value === 'front' || value === 'back';
};

/** 선택 way 필드가 없거나 front/back 인지 확인한다. */
const isOptionalWay = (value: unknown): value is 'front' | 'back' | undefined => {
  return value === undefined || isWay(value);
};

/** nullable way 필드가 null 또는 front/back 인지 확인한다. */
const isNullableWay = (value: unknown): value is 'front' | 'back' | null => {
  return value === null || isWay(value);
};

/** 구간 기록의 editContent 가 앱이 사용하는 허용 값인지 확인한다. */
const isEditLogType = (value: unknown): boolean => {
  return value === 'count_increase'
    || value === 'count_decrease'
    || value === 'count_reset'
    || value === 'count_edit'
    || value === 'sub_count_increase'
    || value === 'sub_count_decrease'
    || value === 'sub_count_reset'
    || value === 'sub_count_edit'
    || value === 'sub_rule_activate'
    || value === 'sub_rule_deactivate'
    || value === 'way_change_front'
    || value === 'way_change_back';
};

/** 반복 규칙 색상이 #RRGGBB 형식인지 확인한다. */
const isHexColor = (value: unknown): value is string => {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
};

/** info 객체 전체가 설정 화면에서 저장 가능한 형태인지 확인한다. */
const isInfo = (value: unknown): boolean => {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return isOptionalInfoDateInputString(value.startDate)
    && isOptionalInfoDateInputString(value.endDate)
    && isOptionalTrimmedStringWithinLength(value.gauge, MAX_LONG_TEXT_LENGTH)
    && isOptionalTrimmedStringWithinLength(value.yarn, MAX_LONG_TEXT_LENGTH)
    && isOptionalTrimmedStringWithinLength(value.needle, MAX_LONG_TEXT_LENGTH)
    && isOptionalTrimmedStringWithinLength(value.notes, MAX_LONG_TEXT_LENGTH);
};

// repeatRules는 단순 타입 체크만 하면 앱 내부 계산에서 무한 루프나 잘못된 미리보기를 만들 수 있다.
// 따라서 UI에서 저장 가능한 조합(endMode/start/end/repeatCount/ruleNumber)까지 함께 검사한다.
const isRepeatRule = (value: unknown, dataVersion: number): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const hasBaseShape = isTrimmedNonEmptyStringWithinLength(value.message, MAX_TITLE_LENGTH)
    && isNonNegativeInteger(value.endNumber)
    && isNonNegativeInteger(value.ruleNumber)
    && isHexColor(value.color)
    && isOptionalNonNegativeInteger(value.repeatCount);

  if (!hasBaseShape) {
    return false;
  }

  const ruleNumber = value.ruleNumber as number;
  const repeatCount = value.repeatCount as number | undefined;
  const startNumber = value.startNumber as number | null | undefined;
  const endNumber = value.endNumber as number;
  const endMode = value.endMode;

  if (dataVersion >= 5) {
    const isValidEndMode = endMode === 'endNumber'
      || endMode === 'repeatCount'
      || endMode === null;

    if (!(isNonNegativeInteger(startNumber) || startNumber === null) || !isValidEndMode) {
      return false;
    }
  } else if (
    !(
      startNumber === undefined
      || startNumber === null
      || isNonNegativeInteger(startNumber)
    )
  ) {
    return false;
  }

  if (ruleNumber <= 0) {
    return false;
  }

  if (endMode === 'repeatCount' && (repeatCount === undefined || repeatCount <= 0)) {
    return false;
  }

  if (endMode === null && startNumber == null) {
    return false;
  }

  if (endMode === 'endNumber' && startNumber !== null && startNumber !== undefined) {
    return startNumber <= endNumber;
  }

  return true;
};

// sectionRecords는 사용자가 직접 편집하지 않지만, 복원 후 즉시 화면 표시와 실행 취소 로직에 사용된다.
// 그래서 날짜/시간 형식, 카운터 범위, 일부 editContent에서의 editedMainCount 필수 여부까지 검증한다.
const isSectionRecord = (value: unknown, dataVersion: number): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const hasBaseShape = isTimeString(value.time)
    && isCounterValue(value.editedCount)
    && isEditLogType(value.editContent)
    && isOptionalCounterValue(value.editedMainCount)
    && isOptionalString(value.voiceCommand)
    && isOptionalCounterValue(value.previousCount)
    && isOptionalCounterValue(value.previousSubCount)
    && isOptionalBoolean(value.previousSubRuleIsActive)
    && (value.previousWay === undefined || isNullableWay(value.previousWay));

  if (!hasBaseShape) {
    return false;
  }

  const requiresEditedMainCount = value.editContent === 'count_increase'
    || value.editContent === 'count_decrease'
    || value.editContent === 'count_edit'
    || value.editContent === 'sub_count_increase'
    || value.editContent === 'sub_count_decrease'
    || value.editContent === 'sub_count_edit'
    || value.editContent === 'sub_rule_deactivate';

  if (requiresEditedMainCount && value.editedMainCount === undefined) {
    return false;
  }

  if (dataVersion >= 5) {
    return isSectionRecordDateString(value.date);
  }

  return value.date === undefined || isSectionRecordDateString(value.date);
};

/** project 아이템이 복원 가능한 기본 구조를 갖는지 확인한다. */
const isProjectItem = (value: Record<string, unknown>): boolean => {
  return isStringArray(value.counterIds)
    && isInfo(value.info)
    && isOptionalNonNegativeInteger(value.updatedAt);
};

/** counter 아이템이 현재/구버전 dataVersion 기준으로 유효한지 확인한다. */
const isCounterItem = (value: Record<string, unknown>, dataVersion: number): boolean => {
  if (
    !isCounterValue(value.count)
    || !isInfo(value.info)
    || !(value.parentProjectId === undefined || value.parentProjectId === null || typeof value.parentProjectId === 'string')
    || !isOptionalWay(value.way)
    || !isOptionalNonNegativeInteger(value.updatedAt)
  ) {
    return false;
  }

  if (dataVersion >= 2) {
    if (typeof value.mascotIsActive !== 'boolean' || typeof value.wayIsChange !== 'boolean') {
      return false;
    }
  }

  if (dataVersion >= 3) {
    if (
      !isNonNegativeInteger(value.targetCount)
      || !isCounterValue(value.targetCount)
      || !isElapsedTimeSeconds(value.elapsedTime)
      || typeof value.timerIsActive !== 'boolean'
      || typeof value.timerIsPlaying !== 'boolean'
      || !isCounterValue(value.subCount)
      || !isNonNegativeInteger(value.subRule)
      || typeof value.subRuleIsActive !== 'boolean'
      || typeof value.subModalIsOpen !== 'boolean'
      || !Array.isArray(value.repeatRules)
      || !Array.isArray(value.sectionRecords)
      || value.sectionRecords.length > MAX_SECTION_RECORDS
      || typeof value.sectionModalIsOpen !== 'boolean'
    ) {
      return false;
    }
  }

  if (dataVersion >= 4 && Array.isArray(value.repeatRules)) {
    if (!value.repeatRules.every((rule) => isRepeatRule(rule, dataVersion))) {
      return false;
    }
  }

  if (dataVersion >= 3 && Array.isArray(value.sectionRecords)) {
    if (!value.sectionRecords.every((record) => isSectionRecord(record, dataVersion))) {
      return false;
    }
  }

  return true;
};

/** 저장 기준 커스텀 음성 명령어 한 칸이 2글자 이내인지 확인한다. */
const isValidVoiceCommandValue = (value: string): boolean => {
  return getCharacterLength(value) <= MAX_CUSTOM_VOICE_COMMAND_LENGTH;
};

// 음성 명령 입력 UI는 조합형 한글 입력을 위해 잠시 3글자까지 가질 수 있지만,
// 실제 저장값(settings.ts)은 2글자로 정규화되므로 백업도 저장 기준에 맞춰 검사한다.
const isValidCustomVoiceCommandInputs = (value: CustomVoiceCommandInputsSetting): boolean => {
  return [
    ...value.mainDecrease,
    ...value.mainIncrease,
    ...value.subDecrease,
    ...value.subIncrease,
  ].every((input) => isValidVoiceCommandValue(input));
};

/** 아이템 ID가 중복되지 않는지 확인한다. */
const hasUniqueIds = (items: Item[]): boolean => {
  const ids = new Set<string>();

  for (const item of items) {
    if (ids.has(item.id)) {
      return false;
    }

    ids.add(item.id);
  }

  return true;
};

// 제목 중복은 앱에서 경고 후 허용할 수 있으므로, 백업 검증에서는 길이/trim만 강제한다.
// 대신 복원 후 구조가 깨지지 않도록 프로젝트-카운터 참조 무결성은 엄격하게 본다.
const hasValidTitleConstraints = (items: Item[]): boolean => {
  return items.every((item) => isTrimmedNonEmptyStringWithinLength(item.title, MAX_TITLE_LENGTH));
};

// 프로젝트와 카운터의 연결은 양방향으로 유지되어야 한다.
// - project.counterIds에 있는 카운터는 반드시 그 project를 parentProjectId로 가져야 함
// - parentProjectId가 있는 카운터는 반드시 부모 project.counterIds에도 포함되어야 함
// 이 검사가 없으면 복원 후 목록/상세 화면에서 유령 항목이나 누락이 생길 수 있다.
const hasValidProjectCounterReferences = (items: Item[]): boolean => {
  const projects = items.filter((item): item is Extract<Item, { type: 'project' }> => item.type === 'project');
  const counters = items.filter((item): item is Extract<Item, { type: 'counter' }> => item.type === 'counter');
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const counterMap = new Map(counters.map((counter) => [counter.id, counter]));

  for (const project of projects) {
    const counterIdSet = new Set<string>();

    for (const counterId of project.counterIds) {
      if (counterIdSet.has(counterId)) {
        return false;
      }

      counterIdSet.add(counterId);

      const counter = counterMap.get(counterId);
      if (!counter || counter.parentProjectId !== project.id) {
        return false;
      }
    }
  }

  for (const counter of counters) {
    if (counter.parentProjectId == null) {
      continue;
    }

    const parentProject = projectMap.get(counter.parentProjectId);
    if (!parentProject) {
      return false;
    }

    if (!parentProject.counterIds.includes(counter.id)) {
      return false;
    }
  }

  return true;
};

const hasValidItemSemantics = (items: Item[]): boolean => {
  return hasUniqueIds(items)
    && hasValidTitleConstraints(items)
    && hasValidProjectCounterReferences(items);
};

/** 정렬 기준 설정이 앱에서 허용하는 enum 값인지 확인한다. */
const isSortCriteria = (value: unknown): value is SortCriteria => {
  return value === 'name'
    || value === 'created'
    || value === 'startDate'
    || value === 'endDate'
    || value === 'progress'
    || value === 'elapsedTime';
};

/** 정렬 순서 설정이 asc/desc 중 하나인지 확인한다. */
const isSortOrder = (value: unknown): value is SortOrder => {
  return value === 'asc' || value === 'desc';
};

/** 음성 명령 모드가 default/custom 중 하나인지 확인한다. */
const isVoiceCommandSettingMode = (value: unknown): value is VoiceCommandSettingMode => {
  return value === 'default' || value === 'custom';
};

/** 음성 인식 권한 상태가 저장 가능한 enum 값인지 확인한다. */
const isVoiceRecognitionPermissionStatus = (
  value: unknown
): value is VoiceRecognitionPermissionStatus => {
  return value === 'undetermined' || value === 'granted' || value === 'denied';
};

/** 사용자 지정 음성 명령어 설정 전체 구조와 저장 길이 제약을 함께 확인한다. */
const isCustomVoiceCommandInputsSetting = (
  value: unknown
): value is CustomVoiceCommandInputsSetting => {
  if (!isRecord(value)) {
    return false;
  }

  return isThreeStringTuple(value.mainDecrease)
    && isThreeStringTuple(value.mainIncrease)
    && isThreeStringTuple(value.subDecrease)
    && isThreeStringTuple(value.subIncrease)
    && isValidCustomVoiceCommandInputs({
      mainDecrease: value.mainDecrease,
      mainIncrease: value.mainIncrease,
      subDecrease: value.subDecrease,
      subIncrease: value.subIncrease,
    });
};

/** knitItems 배열 전체가 아이템 타입/버전/참조 규칙까지 만족하는지 확인한다. */
const isItemArray = (value: unknown, dataVersion: number): value is Item[] => {
  if (!Array.isArray(value)) {
    return false;
  }

  const allItemsAreValid = value.every((item) => {
    if (!isRecord(item) || !isGeneratedItemId(item.id) || typeof item.title !== 'string') {
      return false;
    }

    if (item.type === 'project') {
      return isProjectItem(item);
    }

    if (item.type === 'counter') {
      return isCounterItem(item, dataVersion);
    }

    return false;
  });

  return allItemsAreValid && hasValidItemSemantics(value);
};

/** settings payload 전체가 앱이 저장하는 설정 구조와 일치하는지 검증한다. */
const assertValidBackupSettings = (value: unknown): BackupSettingsPayload => {
  if (!isRecord(value)) {
    throw new Error('설정 데이터 형식이 올바르지 않습니다.');
  }

  if (
    !isBoolean(value.sound)
    || !isBoolean(value.vibration)
    || !isBoolean(value.screenAwake)
    || !isSortCriteria(value.sortCriteria)
    || !isSortOrder(value.sortOrder)
    || !isBoolean(value.moveCompletedToBottom)
    || !isBoolean(value.autoPlayElapsedTime)
    || !isBoolean(value.tooltipEnabled)
    || !isBoolean(value.showElapsedTimeInList)
    || !isBoolean(value.voiceCommandsEnabled)
    || !isVoiceCommandSettingMode(value.selectedVoiceCommandMode)
    || !isCustomVoiceCommandInputsSetting(value.customVoiceCommandInputs)
    || !isBoolean(value.subSlideModalsEnabled)
    || !isVoiceRecognitionPermissionStatus(value.voiceRecognitionPermissionStatus)
  ) {
    throw new Error('설정 데이터 형식이 올바르지 않습니다.');
  }

  return {
    sound: value.sound,
    vibration: value.vibration,
    screenAwake: value.screenAwake,
    sortCriteria: value.sortCriteria,
    sortOrder: value.sortOrder,
    moveCompletedToBottom: value.moveCompletedToBottom,
    autoPlayElapsedTime: value.autoPlayElapsedTime,
    tooltipEnabled: value.tooltipEnabled,
    showElapsedTimeInList: value.showElapsedTimeInList,
    voiceCommandsEnabled: value.voiceCommandsEnabled,
    selectedVoiceCommandMode: value.selectedVoiceCommandMode,
    customVoiceCommandInputs: value.customVoiceCommandInputs,
    subSlideModalsEnabled: value.subSlideModalsEnabled,
    voiceRecognitionPermissionStatus: value.voiceRecognitionPermissionStatus,
  };
};

/** update prompt 관련 선택 저장값이 복원 가능한 형태인지 검증한다. */
const assertValidBackupUpdatePrompt = (value: unknown): BackupUpdatePromptPayload => {
  if (!isRecord(value)) {
    throw new Error('업데이트 알림 데이터 형식이 올바르지 않습니다.');
  }

  const {
    dismissedStoreVersion,
    dismissedOnestoreAt,
    dismissedOnestoreAppVersion,
  } = value;

  if (
    !(
      dismissedStoreVersion === null
      || isTrimmedNonEmptyStringWithinLength(dismissedStoreVersion, MAX_LONG_TEXT_LENGTH)
    )
    || !(
      dismissedOnestoreAt === null
      || (isNonNegativeInteger(dismissedOnestoreAt) && dismissedOnestoreAt > 0)
    )
    || !(
      dismissedOnestoreAppVersion === null
      || isTrimmedNonEmptyStringWithinLength(dismissedOnestoreAppVersion, MAX_LONG_TEXT_LENGTH)
    )
  ) {
    throw new Error('업데이트 알림 데이터 형식이 올바르지 않습니다.');
  }

  return {
    dismissedStoreVersion,
    dismissedOnestoreAt,
    dismissedOnestoreAppVersion,
  };
};

/** backup payload 본문(knitItems/settings/updatePrompt)을 한 번에 검증한다. */
const assertValidBackupPayload = (value: unknown, dataVersion: number): BackupPayload => {
  if (!isRecord(value)) {
    throw new Error('백업 데이터 형식이 올바르지 않습니다.');
  }

  // knitItems는 "최신 타입 그대로"를 무조건 요구하지 않는다.
  // 백업 문서의 dataVersion을 기준으로 해당 버전에서 있어야 하는 필드만 확인하고,
  // 부족한 필드는 restore 이후 ensureDataMigration()이 보정한다.
  if (!isItemArray(value.knitItems, dataVersion)) {
    throw new Error('카운터 데이터 형식이 올바르지 않습니다.');
  }

  return {
    knitItems: value.knitItems,
    settings: assertValidBackupSettings(value.settings),
    updatePrompt: assertValidBackupUpdatePrompt(value.updatePrompt),
  };
};

/** 현재 MMKV의 데이터 버전을 읽고, 없으면 최신 버전을 기본값으로 사용한다. */
const getCurrentDataVersion = (): number => {
  const value = storage.getNumber(DATA_VERSION_KEY);

  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : CURRENT_DATA_VERSION;
};

/** 임시 백업 파일을 생성할 디렉터리 URI를 계산한다. */
const getBackupDirectoryUri = (): string => {
  const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!baseDirectory) {
    throw new Error('백업 파일을 생성할 저장 공간을 찾을 수 없습니다.');
  }

  return `${baseDirectory}${BACKUP_DIRECTORY_NAME}/`;
};

/** ISO 시각 문자열을 파일명에 안전한 timestamp 형태로 변환한다. */
const formatTimestampForFileName = (isoString: string): string => {
  return isoString
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '-');
};

/** exportedAt 시각을 기반으로 백업 파일명을 만든다. */
export const getBackupFileName = (exportedAt: string): string => {
  return `${BACKUP_FILE_PREFIX}-${formatTimestampForFileName(exportedAt)}${BACKUP_FILE_EXTENSION}`;
};

/** 현재 앱 데이터와 설정을 읽어 백업 문서 객체를 만든다. */
export const createBackupDocument = (): BackupDocument => {
  const knitItems = getStoredItems();
  const exportedAt = new Date().toISOString();

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    appId: APP_ID,
    exportedAt,
    dataVersion: getCurrentDataVersion(),
    payload: {
      knitItems,
      settings: {
        sound: getSoundSetting(),
        vibration: getVibrationSetting(),
        screenAwake: getScreenAwakeSetting(),
        sortCriteria: getSortCriteriaSetting(),
        sortOrder: getSortOrderSetting(),
        moveCompletedToBottom: getMoveCompletedToBottomSetting(),
        autoPlayElapsedTime: getAutoPlayElapsedTimeSetting(),
        tooltipEnabled: getTooltipEnabledSetting(),
        showElapsedTimeInList: getShowElapsedTimeInListSetting(),
        voiceCommandsEnabled: getVoiceCommandsEnabledSetting(),
        selectedVoiceCommandMode: getSelectedVoiceCommandModeSetting(),
        customVoiceCommandInputs: getCustomVoiceCommandInputsSetting(),
        subSlideModalsEnabled: getSubSlideModalsEnabledSetting(),
        voiceRecognitionPermissionStatus: getVoiceRecognitionPermissionStatusSetting(),
      },
      updatePrompt: {
        dismissedStoreVersion: getDismissedStoreVersion() ?? null,
        dismissedOnestoreAt: getDismissedOnestoreAt() ?? null,
        dismissedOnestoreAppVersion: getDismissedOnestoreAppVersion() ?? null,
      },
    },
  };
};

/** 백업 문서 객체를 JSON 문자열로 직렬화한다. */
export const serializeBackupDocument = (document: BackupDocument): string => {
  return JSON.stringify(document, null, 2);
};

/** 백업 JSON 문자열을 파싱하고 복원 가능한 문서 구조인지 검증한다. */
export const parseBackupDocument = (json: string): BackupDocument => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('백업 파일을 읽지 못했습니다. JSON 형식을 확인해 주세요.');
  }

  if (!isRecord(parsed)) {
    throw new Error('백업 파일 형식이 올바르지 않습니다.');
  }

  if (parsed.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error('지원하지 않는 백업 파일 버전입니다.');
  }

  if (parsed.appId !== APP_ID) {
    throw new Error('이 앱에서 생성한 백업 파일이 아닙니다.');
  }

  if (
    typeof parsed.exportedAt !== 'string'
    || Number.isNaN(Date.parse(parsed.exportedAt))
  ) {
    throw new Error('백업 생성 시각 형식이 올바르지 않습니다.');
  }

  if (
    typeof parsed.dataVersion !== 'number'
    || !Number.isFinite(parsed.dataVersion)
    || parsed.dataVersion < 0
  ) {
    throw new Error('데이터 버전 정보가 올바르지 않습니다.');
  }

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    appId: APP_ID,
    exportedAt: parsed.exportedAt,
    dataVersion: parsed.dataVersion,
    payload: assertValidBackupPayload(parsed.payload, parsed.dataVersion),
  };
};

/** 선택 문자열 값을 저장하고, 비어 있으면 해당 키를 제거한다. */
const setOptionalStringValue = (key: string, value: Nullable<string>) => {
  if (typeof value === 'string' && value.length > 0) {
    storage.set(key, value);
    return;
  }

  storage.delete(key);
};

/**
 * 선택적 숫자 값을 저장합니다.
 * 이 헬퍼를 사용하는 값은 현재 0을 "저장된 값 없음"으로 취급하므로,
 * 0 이하이거나 유한수가 아니면 키를 제거합니다.
 * 예: dismissedOnestoreAt 는 양수 타임스탬프일 때만 유효합니다.
 */
const setOptionalNumberValue = (key: string, value: Nullable<number>) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    storage.set(key, value);
    return;
  }

  storage.delete(key);
};

/** 검증이 끝난 백업 문서를 현재 로컬 스토리지 상태로 복원한다. */
export const restoreBackupDocument = (document: BackupDocument) => {
  storage.set(STORAGE_KEY, JSON.stringify(document.payload.knitItems));
  storage.set(DATA_VERSION_KEY, document.dataVersion);

  setSoundSetting(document.payload.settings.sound);
  setVibrationSetting(document.payload.settings.vibration);
  setScreenAwakeSetting(document.payload.settings.screenAwake);
  setSortCriteriaSetting(document.payload.settings.sortCriteria);
  setSortOrderSetting(document.payload.settings.sortOrder);
  setMoveCompletedToBottomSetting(document.payload.settings.moveCompletedToBottom);
  setAutoPlayElapsedTimeSetting(document.payload.settings.autoPlayElapsedTime);
  setTooltipEnabledSetting(document.payload.settings.tooltipEnabled);
  setShowElapsedTimeInListSetting(document.payload.settings.showElapsedTimeInList);
  setVoiceCommandsEnabledSetting(document.payload.settings.voiceCommandsEnabled);
  setSelectedVoiceCommandModeSetting(document.payload.settings.selectedVoiceCommandMode);
  setCustomVoiceCommandInputsSetting(document.payload.settings.customVoiceCommandInputs);
  setSubSlideModalsEnabledSetting(document.payload.settings.subSlideModalsEnabled);
  setVoiceRecognitionPermissionStatusSetting(
    document.payload.settings.voiceRecognitionPermissionStatus
  );

  setOptionalStringValue(
    KEY_DISMISSED_STORE_VERSION,
    document.payload.updatePrompt.dismissedStoreVersion
  );
  setOptionalNumberValue(
    KEY_DISMISSED_ONESTORE_AT,
    document.payload.updatePrompt.dismissedOnestoreAt
  );
  setOptionalStringValue(
    KEY_DISMISSED_ONESTORE_APP_VERSION,
    document.payload.updatePrompt.dismissedOnestoreAppVersion
  );

  ensureDataMigration();
};

/** 현재 데이터를 임시 JSON 파일로 내보내고 공유 가능한 파일 정보를 반환한다. */
export const exportBackupToTemporaryFile = async (): Promise<{
  fileName: string;
  fileUri: string;
  document: BackupDocument;
}> => {
  const document = createBackupDocument();
  const json = serializeBackupDocument(document);
  const directoryUri = getBackupDirectoryUri();
  const fileName = getBackupFileName(document.exportedAt);
  const fileUri = `${directoryUri}${fileName}`;

  await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return {
    fileName,
    fileUri,
    document,
  };
};

/** 생성된 백업 파일을 플랫폼 공유 시트로 전달한다. */
export const shareBackupFile = async (fileUri: string) => {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('이 기기에서는 백업 파일 공유 기능을 사용할 수 없습니다.');
  }

  await Sharing.shareAsync(fileUri, {
    dialogTitle: '백업 파일 내보내기',
    mimeType: 'application/json',
    UTI: 'public.json',
  });
};

/** 문서 선택기에서 JSON 백업 파일을 고른 뒤 파싱된 문서를 반환한다. */
export const pickBackupDocument = async (): Promise<BackupDocument | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const [asset] = result.assets;
  const contents = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return parseBackupDocument(contents);
};

/** 백업 확인 모달에 보여줄 항목 수/시각 요약 정보를 만든다. */
export const getBackupSummary = (document: BackupDocument): BackupSummary => {
  const totalItems = document.payload.knitItems.length;
  const projectCount = document.payload.knitItems.filter(
    (item) => item.type === 'project'
  ).length;
  const counterCount = document.payload.knitItems.filter(
    (item) => item.type === 'counter'
  ).length;

  return {
    exportedAtLabel: new Date(document.exportedAt).toLocaleString('ko-KR'),
    totalItems,
    projectCount,
    counterCount,
  };
};
