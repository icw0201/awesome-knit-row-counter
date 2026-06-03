// src/storage/storage.ts
import { MMKV } from 'react-native-mmkv';
import { Item, Counter, Project } from './types';
import { ensureDataMigration } from './migration';

// MMKV 스토리지 인스턴스 생성
const storage = new MMKV();
const STORAGE_KEY = 'knit_items';

/**
 * 모든 항목을 불러옵니다.
 * 마이그레이션은 앱 시작 시 한 번만 실행됩니다.
 * @returns 저장된 모든 Item 배열
 */
export const getStoredItems = (): Item[] => {
  // 마이그레이션 확인 (한 번만)
  ensureDataMigration();

  const json = storage.getString(STORAGE_KEY);
  const items = json ? JSON.parse(json) : [];

  return items;
};

/**
 * 모든 항목을 저장합니다.
 * @param items 저장할 Item 배열
 */
const setStoredItems = (items: Item[]) => {
  storage.set(STORAGE_KEY, JSON.stringify(items));
};

/**
 * 여러 항목을 한 번에 뒤에 추가합니다.
 * @param newItems 추가할 Item 배열
 */
export const appendImportedItems = (newItems: Item[]) => {
  if (newItems.length === 0) {
    return;
  }

  const existing = getStoredItems();
  setStoredItems([...existing, ...newItems]);
};

/**
 * 새로운 항목을 추가합니다.
 * @param newItem 추가할 새로운 Item
 */
export const addItem = (newItem: Item) => {
  const existing = getStoredItems();
  const now = Date.now();
  const withTs = { ...(newItem as any), updatedAt: now } as Item;
  setStoredItems([...existing, withTs]);
};

/**
 * ID로 항목을 삭제합니다.
 * @param id 삭제할 항목의 ID
 */
export const removeItem = (id: string) => {
  const items = getStoredItems();
  const filteredItems = items.filter((item) => item.id !== id);
  setStoredItems(filteredItems);
};

/**
 * 항목을 수정합니다. ID가 일치하는 항목의 필드를 병합합니다.
 * @param id 수정할 항목의 ID
 * @param updatedFields 업데이트할 필드들
 */
export const updateItem = (id: string, updatedFields: Record<string, any>) => {
  const items = getStoredItems();

  const now = Date.now();
  const updatedItems = items.map((item) => {
    if (item.id !== id) {
      return item;
    }
    const merged = { ...item, ...updatedFields } as Item;
    // updatedAt 타임스탬프 자동 갱신
    (merged as any).updatedAt = now;
    return merged;
  });
  setStoredItems(updatedItems);
};

/**
 * 특정 프로젝트에서 카운터를 제거합니다.
 * @param projectId 프로젝트 ID
 * @param counterId 제거할 카운터 ID
 */
export const removeCounterFromProject = (projectId: string, counterId: string) => {
  const allItems = getStoredItems();

  // 프로젝트 찾기
  const project = allItems.find((item): item is Project =>
    item.id === projectId && item.type === 'project'
  );

  if (!project) {
    return;
  }

  // 프로젝트에서 카운터 ID 제거
  const updatedProject: Project = {
    ...project,
    counterIds: project.counterIds.filter((id) => id !== counterId),
  };

  // 카운터와 프로젝트를 제거하고 업데이트된 프로젝트 추가
  const updatedItems = allItems
    .filter(item => item.id !== counterId && item.id !== projectId)
    .concat(updatedProject);

  setStoredItems(updatedItems);
};

/**
 * 모든 프로젝트를 가져옵니다.
 * @returns Project 배열
 */
export const getAllProjects = (): Project[] => {
  const items = getStoredItems();
  const projects = items.filter((item): item is Project => item.type === 'project');
  return projects;
};

/**
 * 독립 카운터(프로젝트에 소속되지 않은)를 가져옵니다.
 * @returns 독립적인 Counter 배열
 */
export const getIndependentCounters = (): Counter[] => {
  const items = getStoredItems();
  const counters = items.filter((item): item is Counter => item.type === 'counter');
  const independentCounters = counters.filter((counter) => !counter.parentProjectId);
  return independentCounters;
};

/**
 * 모든 프로젝트 데이터를 삭제합니다.
 */
export const clearAllProjectData = () => {
  storage.delete(STORAGE_KEY);
};
