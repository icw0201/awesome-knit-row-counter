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

const isThreeStringTuple = (value: unknown): value is [string, string, string] => {
  return Array.isArray(value)
    && value.length === 3
    && value.every((item) => typeof item === 'string');
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
    && isThreeStringTuple(value.subIncrease);
};

const isItemArray = (value: unknown): value is Item[] => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.title !== 'string') {
      return false;
    }

    if (item.type === 'project') {
      return isStringArray(item.counterIds);
    }

    if (item.type === 'counter') {
      return typeof item.count === 'number';
    }

    return false;
  });
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
      || typeof dismissedStoreVersion === 'string'
    )
    || !(
      dismissedOnestoreAt === null
      || typeof dismissedOnestoreAt === 'number'
    )
    || !(
      dismissedOnestoreAppVersion === null
      || typeof dismissedOnestoreAppVersion === 'string'
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

const assertValidBackupPayload = (value: unknown): BackupPayload => {
  if (!isRecord(value)) {
    throw new Error('백업 데이터 형식이 올바르지 않습니다.');
  }

  if (!isItemArray(value.knitItems)) {
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
    payload: assertValidBackupPayload(parsed.payload),
  };
};

const setOptionalStringValue = (key: string, value: Nullable<string>) => {
  if (typeof value === 'string' && value.length > 0) {
    storage.set(key, value);
    return;
  }

  storage.delete(key);
};

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
