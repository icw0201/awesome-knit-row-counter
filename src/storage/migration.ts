// src/storage/migration.ts
import { MMKV } from 'react-native-mmkv';
import { Item } from './types';

// MMKV 스토리지 인스턴스
const storage = new MMKV();
const STORAGE_KEY = 'knit_items';
const DATA_VERSION_KEY = 'data_version';

// 데이터 버전 관리
export const CURRENT_DATA_VERSION = 5; // sectionRecords 보정 + repeatRules에 endMode 추가

/**
 * 버전 1: 기존 'active' 상태를 'auto'로 마이그레이션
 * @param items 마이그레이션할 아이템 배열
 * @returns 마이그레이션된 아이템 배열
 */
const migrateV1_ActiveToAuto = (items: Item[]): Item[] => {
  return items.map((item) => {
    if (item.type === 'counter' && (item as any).activateMode === 'active') {
      return { ...item, activateMode: 'auto' as const };
    }
    return item;
  });
};

/**
 * 버전 2: activateMode를 wayIsChange와 mascotIsActive로 마이그레이션
 * inactive → wayIsChange: false, mascotIsActive: false
 * auto → wayIsChange: true, mascotIsActive: true
 * @param items 마이그레이션할 아이템 배열
 * @returns 마이그레이션된 아이템 배열
 */
const migrateV2_ActivateModeToWayIsChangeAndMascotIsActive = (items: Item[]): Item[] => {
  return items.map((item) => {
    if (item.type === 'counter' && (item as any).activateMode !== undefined) {
      const { activateMode, ...rest } = item as any;

      // activateMode에 따른 매핑
      const wayIsChange = activateMode === 'auto';
      const mascotIsActive = activateMode === 'auto';

      return { ...rest, wayIsChange, mascotIsActive };
    }
    return item;
  });
};

/**
 * 버전 3: 새로 추가된 프로퍼티들에 기본값 설정
 * - targetCount: 0 (목표 없음)
 * - elapsedTime: 0 (초 단위, 0 ~ 359999)
 * - timerIsActive: false
 * - timerIsPlaying: false (V4에서 추가)
 * - subCount, subRule, subRuleIsActive, subModalIsOpen (보조 카운터 필드)
 * - repeatRules (반복 규칙 필드 - V4에서 배열로 변경됨)
 * - way (V4에서 info.way에서 counter.way로 이동)
 * - sectionRecords, sectionModalIsOpen (구간 기록 필드)
 * @param items 마이그레이션할 아이템 배열
 * @returns 마이그레이션된 아이템 배열
 */
const migrateV3_AddNewProperties = (items: Item[]): Item[] => {
  return items.map((item) => {
    if (item.type === 'counter') {
      const counter = item as any;
      // 이전 버전의 불필요한 필드 제거 (activateMode는 V2에서 제거되어야 하지만 안전을 위해)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { activateMode, ...rest } = counter;

      // 새로 추가된 프로퍼티들의 기본값 설정
      return {
        ...rest,
        // 타이머 및 목표 관련 프로퍼티
        targetCount: counter.targetCount ?? 0,
        elapsedTime: counter.elapsedTime ?? 0,
        timerIsActive: counter.timerIsActive ?? false,
        timerIsPlaying: counter.timerIsPlaying ?? false,

        // 보조 카운터 필드들 (필수 프로퍼티)
        subCount: counter.subCount ?? 0,
        subRule: counter.subRule ?? 0,
        subRuleIsActive: counter.subRuleIsActive ?? false,
        subModalIsOpen: counter.subModalIsOpen ?? false,

        // 마스코트 반복 규칙 필드들 (필수 프로퍼티)
        repeatRules: counter.repeatRules ?? [],

        // 구간 기록 필드들 (필수 프로퍼티)
        sectionRecords: counter.sectionRecords ?? [],
        sectionModalIsOpen: counter.sectionModalIsOpen ?? false,
      };
    }
    return item;
  });
};


/**
 * 버전 4: 반복 규칙을 배열로 변경, way를 Counter로 이동, RepeatRule에 color 필드 추가 (필수)
 * 1. 기존: repeatRuleIsActive, repeatRuleNumber, repeatRuleStartNumber, repeatRuleEndNumber
 *    신규: repeatRules: RepeatRule[] (color 필드 포함, 필수)
 * 2. way를 info.way에서 counter.way로 이동
 * 3. 이전 버전에서는 항상 초기값이었으므로 빈 배열 반환
 * @param items 마이그레이션할 아이템 배열
 * @returns 마이그레이션된 아이템 배열
 */
const migrateV4_RepeatRulesToArrayAndMoveWay = (items: Item[]): Item[] => {
  return items.map((item) => {
    if (item.type === 'counter') {
      const counter = item as any;
      // 이전 버전의 불필요한 필드 제거 (repeatRuleIsActive, repeatRuleNumber 등)
      const rest = { ...counter };
      delete rest.repeatRuleIsActive;
      delete rest.repeatRuleNumber;
      delete rest.repeatRuleStartNumber;
      delete rest.repeatRuleEndNumber;

      const info = rest.info;
      delete rest.info;

      // 1. 반복 규칙을 배열로 변환
      // 이전 버전에서는 항상 초기값이었으므로 빈 배열 반환
      const repeatRules: any[] = [];

      // 2. way를 info에서 counter로 이동
      const way = info?.way;
      const updatedInfo = info ? { ...info } : undefined;
      if (updatedInfo && 'way' in updatedInfo) {
        delete updatedInfo.way;
      }

      return {
        ...rest,
        repeatRules,
        way,
        info: updatedInfo,
      };
    }
    return item;
  });
};

/**
 * 버전 5: sectionRecords에 date 필드 추가, 최대 30개 유지,
 * repeatRules에 현재 사용 중인 종료 방식(endMode) 추가
 * 기존 기록은 정확한 날짜 정보가 없으므로 0으로 채운 기본값을 사용하고,
 * endMode는 기존 배포 버전에 반복 횟수 지정이 없었으므로 종료단이 있으면 'endNumber',
 * 없으면 null로 채웁니다.
 * @param items 마이그레이션할 아이템 배열
 * @returns 마이그레이션된 아이템 배열
 */
const MAX_SECTION_RECORDS = 30;
const EMPTY_SECTION_RECORD_DATE = '00000000';

const migrateV5_AddSectionRecordDateAndExpandLimit = (items: Item[]): Item[] => {
  return items.map((item) => {
    if (item.type !== 'counter') {
      return item;
    }

    const counter = item as any;
    const sectionRecords = Array.isArray(counter.sectionRecords) ? counter.sectionRecords : [];
    const repeatRules = Array.isArray(counter.repeatRules) ? counter.repeatRules : [];

    return {
      ...counter,
      sectionRecords: sectionRecords
        .map((record: any) => ({
          ...record,
          date: typeof record?.date === 'string' && /^\d{8}$/.test(record.date) ? record.date : EMPTY_SECTION_RECORD_DATE,
        }))
        .slice(0, MAX_SECTION_RECORDS),
      repeatRules: repeatRules.map((rule: any) => ({
        ...rule,
        endMode:
          rule?.endMode === 'endNumber' || rule?.endMode === 'repeatCount'
            ? rule.endMode
            : (rule?.endNumber ?? 0) > 0
              ? 'endNumber'
              : null,
      })),
    };
  });
};

/**
 * 마이그레이션 실행
 * @param items 마이그레이션할 아이템 배열
 * @param fromVersion 시작 버전
 * @param toVersion 목표 버전
 * @returns 마이그레이션된 아이템 배열
 */
const runMigrations = (items: Item[], fromVersion: number, toVersion: number): Item[] => {
  let migratedItems = items;

  // 버전별 마이그레이션 실행
  if (fromVersion < 1 && toVersion >= 1) {
    migratedItems = migrateV1_ActiveToAuto(migratedItems);
  }

  if (fromVersion < 2 && toVersion >= 2) {
    migratedItems = migrateV2_ActivateModeToWayIsChangeAndMascotIsActive(migratedItems);
  }

  if (fromVersion < 3 && toVersion >= 3) {
    migratedItems = migrateV3_AddNewProperties(migratedItems);
  }

  if (fromVersion < 4 && toVersion >= 4) {
    migratedItems = migrateV3_AddNewProperties(migratedItems); // 기본값 설정
    migratedItems = migrateV4_RepeatRulesToArrayAndMoveWay(migratedItems); // repeatRules 배열, way 이동, color 필드 추가
  }

  if (fromVersion < 5 && toVersion >= 5) {
    migratedItems = migrateV5_AddSectionRecordDateAndExpandLimit(migratedItems);
  }

  return migratedItems;
};

/**
 * 데이터 버전 확인 및 마이그레이션 실행
 * 앱 시작 시 한 번만 실행되도록 최적화
 */
export const ensureDataMigration = (): void => {
  const currentVersion = storage.getNumber(DATA_VERSION_KEY) || 0;

  if (currentVersion >= CURRENT_DATA_VERSION) {
    return; // 이미 최신 버전
  }

  // 마이그레이션 실행
  const json = storage.getString(STORAGE_KEY);
  if (json) {
    const items = JSON.parse(json);
    const migratedItems = runMigrations(items, currentVersion, CURRENT_DATA_VERSION);

    // 변경사항이 있으면 저장
    if (JSON.stringify(migratedItems) !== JSON.stringify(items)) {
      storage.set(STORAGE_KEY, JSON.stringify(migratedItems));
    }
  }

  // 버전 업데이트
  storage.set(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
};

