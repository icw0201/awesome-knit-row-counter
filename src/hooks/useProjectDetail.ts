import { useCallback, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { getHeaderRightWithInfoEditAndSettings } from '@navigation/HeaderOptions';

import { Counter, Project } from '@storage/types';
import { addItem, removeCounterFromProject, updateItem, getStoredItems } from '@storage/storage';
import {
  getSortCriteriaSetting,
  getSortOrderSetting,
  getMoveCompletedToBottomSetting,
} from '@storage/settings';
import { sortItems } from '@utils/sortUtils';
import { useItemList } from './useItemList';

/**
 * ProjectDetail 화면 전용 훅
 */
export const useProjectDetail = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProjectDetail'>>();
  const { projectId } = route.params;
  // 정렬 드롭다운 표시 여부 상태
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);

  // useItemList 훅 사용
  const {
    items,
    project,
    isEditMode,
    modalVisible,
    deleteModalVisible,
    itemToDelete,
    duplicateModalVisible,
    pendingItem,
    setItems,
    setProject,
    setIsEditMode,
    setModalVisible,
    setDuplicateModalVisible,
    setPendingItem,
    handlePress,
    handleLongPress,
    handleDelete,
    resetModalState,
    resetDeleteModalState,
    resetDuplicateModalState,
  } = useItemList({
    projectId,
    headerSetup: () => {
      navigation.setOptions({
        title: project?.title ?? '',
        headerRight: () =>
          getHeaderRightWithInfoEditAndSettings(
            navigation,
            () => navigation.navigate('InfoScreen', { itemId: project?.id ?? '' }),
            () => setIsEditMode((prev) => !prev),
            () => setSortDropdownVisible(true)
          ),
      });
    },
  });

  /**
   * 새 카운터 생성 함수
   */
  const createNewCounter = useCallback((title: string): Counter => {
    const timestamp = Date.now();
    return {
      id: `counter_${timestamp}`,
      type: 'counter',
      title,
      count: 0,
      targetCount: 0,
      elapsedTime: 0,
      timerIsActive: false,
      timerIsPlaying: false,
      parentProjectId: project?.id ?? '',
      subCount: 0,
      subRule: 0,
      subRuleIsActive: false,
      subModalIsOpen: false,
      // 마스코트 반복 규칙 기본값
      mascotIsActive: false,
      wayIsChange: true,
      repeatRules: [],
      // 구간 기록 기본값
      sectionRecords: [],
      sectionModalIsOpen: false,
    };
  }, [project?.id]);

  /**
   * 프로젝트 내에서 중복 이름 체크 함수
   */
  const checkDuplicateName = useCallback((newCounter: Counter): boolean => {
    const allItems = getStoredItems();
    const sameProjectCounters = allItems.filter(
      (item): item is Counter =>
        item.type === 'counter' &&
        item.parentProjectId === project?.id
    );

    return sameProjectCounters.some(
      (counter) => counter.title === newCounter.title
    );
  }, [project?.id]);

  /**
   * 카운터 생성 완료 처리 (실제 저장 및 상태 업데이트)
   */
  const completeCounterCreation = useCallback((newCounter: Counter) => {
    // 카운터 저장
    addItem(newCounter);

    // 저장소에서 최신 프로젝트 정보 가져오기 (메모리 상태가 아닌 실제 저장소 데이터)
    const allItems = getStoredItems();
    const latestProject = allItems.find(
      (item): item is Project => item.id === projectId && item.type === 'project'
    );

    if (latestProject) {
      const updatedCounterIds = [newCounter.id, ...latestProject.counterIds];

      const updatedProject: Partial<Project> = {
        counterIds: updatedCounterIds,
      };

      updateItem(latestProject.id, updatedProject);

      // 로컬 상태도 업데이트
      setProject({
        ...latestProject,
        counterIds: updatedCounterIds,
      });
    }

    // UI 상태 업데이트
    setItems((prev) => [newCounter, ...prev]);

    resetModalState();
  }, [projectId, setItems, setProject, resetModalState]);

  /**
   * 카운터 생성 모달에서 확인 시 카운터 생성 및 중복 체크
   */
  const handleCreateCounterConfirm = useCallback((name?: string) => {
    if (!name?.trim()) {
      return false;
    }

    const newCounter = createNewCounter(name);

    if (checkDuplicateName(newCounter)) {
      setPendingItem(newCounter);
      setDuplicateModalVisible(true);
      return false;
    }

    completeCounterCreation(newCounter);
    return true;
  }, [createNewCounter, checkDuplicateName, completeCounterCreation, setPendingItem, setDuplicateModalVisible]);

  /**
   * 삭제 확인 시 실제 삭제 처리
   */
  const handleDeleteConfirm = useCallback(() => {
    if (!itemToDelete || itemToDelete.type !== 'counter') {
      return;
    }

    if (project) {
      removeCounterFromProject(project.id, itemToDelete.id);
    }

    const nextItems = items.filter((i) => i.id !== itemToDelete.id);
    setItems(nextItems);
    resetDeleteModalState();
    // 삭제 후 목록이 비면 편집할 항목이 없으므로 edit 모드 자동 해제
    if (nextItems.length === 0) {
      setIsEditMode(false);
    }
  }, [itemToDelete, project, items, setItems, resetDeleteModalState, setIsEditMode]);

  const handleSortSelect = useCallback((_option: string) => {
    // 정렬 설정이 storage에 저장되었으므로, 현재 items를 다시 정렬하여 즉시 반영
    setItems((prevItems) => {
      if (prevItems.length === 0) {
        return prevItems;
      }

      const criteria = getSortCriteriaSetting();
      const order = getSortOrderSetting();
      const moveCompletedToBottom = getMoveCompletedToBottomSetting();

      return sortItems([...prevItems], criteria, order, moveCompletedToBottom);
    });
  }, [setItems]);

  return {
    // 상태
    items,
    project,
    isEditMode,
    modalVisible,
    deleteModalVisible,
    itemToDelete,
    duplicateModalVisible,
    pendingItem,
    sortDropdownVisible,

    // 상태 설정 함수들
    setModalVisible,
    setSortDropdownVisible,

    // 액션 함수들
    handlePress,
    handleLongPress,
    handleDelete,
    handleCreateCounterConfirm,
    handleDeleteConfirm,
    resetModalState,
    resetDeleteModalState,
    resetDuplicateModalState,
    completeCounterCreation,
    handleSortSelect,
  };
};
