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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isGeneratedItemId = (value: unknown): value is string => {
  return typeof value === 'string' && /^(proj|counter)_\d+$/.test(value);
};

const isThreeStringTuple = (value: unknown): value is [string, string, string] => {
  return Array.isArray(value)
    && value.length === 3
    && value.every((item) => typeof item === 'string');
};

const getCharacterLength = (value: string): number => {
  return Array.from(value).length;
};

const isTrimmedString = (value: string): boolean => {
  return value.trim() === value;
};

const isTrimmedNonEmptyStringWithinLength = (
  value: unknown,
  maxLength: number
): value is string => {
  return typeof value === 'string'
    && isTrimmedString(value)
    && value.length > 0
    && getCharacterLength(value) <= maxLength;
};

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

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
};

const isOptionalNonNegativeInteger = (value: unknown): value is number | undefined => {
  return value === undefined || isNonNegativeInteger(value);
};

const isCounterValue = (value: unknown): value is number => {
  return isNonNegativeInteger(value) && value <= MAX_COUNTER_VALUE;
};

const isOptionalCounterValue = (value: unknown): value is number | undefined => {
  return value === undefined || isCounterValue(value);
};

const isElapsedTimeSeconds = (value: unknown): value is number => {
  return isNonNegativeInteger(value) && value <= MAX_ELAPSED_TIME_SECONDS;
};

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

const isSectionRecordDateString = (value: unknown): value is string => {
  return value === EMPTY_SECTION_RECORD_DATE || isCompactDateString(value);
};

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

const isTimeString = (value: unknown): value is string => {
  return typeof value === 'string'
    && /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value);
};

const isOptionalString = (value: unknown): value is string | undefined => {
  return value === undefined || typeof value === 'string';
};

const isOptionalBoolean = (value: unknown): value is boolean | undefined => {
  return value === undefined || typeof value === 'boolean';
};

const isWay = (value: unknown): value is 'front' | 'back' => {
  return value === 'front' || value === 'back';
};

const isOptionalWay = (value: unknown): value is 'front' | 'back' | undefined => {
  return value === undefined || isWay(value);
};

const isNullableWay = (value: unknown): value is 'front' | 'back' | null => {
  return value === null || isWay(value);
};

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

const isHexColor = (value: unknown): value is string => {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
};

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

const isProjectItem = (value: Record<string, unknown>): boolean => {
  return isStringArray(value.counterIds)
    && isInfo(value.info)
    && isOptionalNonNegativeInteger(value.updatedAt);
};

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

const isValidVoiceCommandValue = (value: string): boolean => {
  return getCharacterLength(value) <= MAX_CUSTOM_VOICE_COMMAND_LENGTH;
};

const isValidCustomVoiceCommandInputs = (value: CustomVoiceCommandInputsSetting): boolean => {
  return [
    ...value.mainDecrease,
    ...value.mainIncrease,
    ...value.subDecrease,
    ...value.subIncrease,
  ].every((input) => isValidVoiceCommandValue(input));
};

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

const hasValidTitleConstraints = (items: Item[]): boolean => {
  return items.every((item) => isTrimmedNonEmptyStringWithinLength(item.title, MAX_TITLE_LENGTH));
};

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

const isSortCriteria = (value: unknown): value is SortCriteria => {
  return value === 'name'
    || value === 'created'
    || value === 'startDate'
    || value === 'endDate'
    || value === 'progress'
    || value === 'elapsedTime';
};

const isSortOrder = (value: unknown): value is SortOrder => {
  return value === 'asc' || value === 'desc';
};

const isVoiceCommandSettingMode = (value: unknown): value is VoiceCommandSettingMode => {
  return value === 'default' || value === 'custom';
};

const isVoiceRecognitionPermissionStatus = (
  value: unknown
): value is VoiceRecognitionPermissionStatus => {
  return value === 'undetermined' || value === 'granted' || value === 'denied';
};

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

const assertValidBackupPayload = (value: unknown, dataVersion: number): BackupPayload => {
  if (!isRecord(value)) {
    throw new Error('백업 데이터 형식이 올바르지 않습니다.');
  }

  // knitItems는 현재 타입 전체를 무조건 강제하지 않고,
  // 백업 문서의 dataVersion 기준으로 필요한 필드만 검증한다.
  // 이후 restore 단계에서 ensureDataMigration()이 구버전 필드를 보정한다.
  if (!isItemArray(value.knitItems, dataVersion)) {
    throw new Error('카운터 데이터 형식이 올바르지 않습니다.');
  }

  return {
    knitItems: value.knitItems,
    settings: assertValidBackupSettings(value.settings),
    updatePrompt: assertValidBackupUpdatePrompt(value.updatePrompt),
  };
};

const getCurrentDataVersion = (): number => {
  const value = storage.getNumber(DATA_VERSION_KEY);

  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : CURRENT_DATA_VERSION;
};

const getBackupDirectoryUri = (): string => {
  const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!baseDirectory) {
    throw new Error('백업 파일을 생성할 저장 공간을 찾을 수 없습니다.');
  }

  return `${baseDirectory}${BACKUP_DIRECTORY_NAME}/`;
};

const formatTimestampForFileName = (isoString: string): string => {
  return isoString
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '-');
};

export const getBackupFileName = (exportedAt: string): string => {
  return `${BACKUP_FILE_PREFIX}-${formatTimestampForFileName(exportedAt)}${BACKUP_FILE_EXTENSION}`;
};

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

export const serializeBackupDocument = (document: BackupDocument): string => {
  return JSON.stringify(document, null, 2);
};

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
