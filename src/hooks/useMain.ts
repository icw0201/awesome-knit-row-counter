import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import { getHeaderRightWithEditAndSettings } from '@navigation/HeaderOptions';

import { Item } from '@storage/types';
import { addItem, removeItem, getStoredItems } from '@storage/storage';
import {
  getSortCriteriaSetting,
  getSortOrderSetting,
  getMoveCompletedToBottomSetting,
} from '@storage/settings';
import { sortItems } from '@utils/sortUtils';
import { useItemList } from './useItemList';

/**
 * Main 화면 전용 훅
 */
export const useMain = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // 정렬 드롭다운 표시 여부 상태
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);

  // useItemList 훅 사용
  const {
    items,
    isEditMode,
    modalVisible,
    deleteModalVisible,
    itemsPendingDelete,
    duplicateModalVisible,
    pendingItem,
    selectedItemIds,
    setItems,
    setIsEditMode,
    setModalVisible,
    setDuplicateModalVisible,
    setPendingItem,
    setSelectedItemIds,
    handlePress,
    handleLongPress,
    toggleItemSelection,
    openBulkDeleteModal,
    resetModalState,
    resetDeleteModalState,
    resetDuplicateModalState,
  } = useItemList({
    headerSetup: () => {
      navigation.setOptions({
        headerRight: () =>
          getHeaderRightWithEditAndSettings(
            navigation,
            () => setIsEditMode((prev) => !prev),
            () => setSortDropdownVisible(true)
          ),
      });
    },
  });

  /**
   * 아이템 생성 함수
   */
  const createNewItem = useCallback((type: string, title: string): Item => {
    const timestamp = Date.now();

    if (type === 'project') {
      return {
        id: `proj_${timestamp}`,
        type: 'project',
        title,
        counterIds: [],
      };
    }

    return {
      id: `counter_${timestamp}`,
      type: 'counter',
      title,
      count: 0,
      targetCount: 0,
      elapsedTime: 0,
      timerIsActive: false,
      timerIsPlaying: false,
      parentProjectId: null,
      subCount: 0,
      subRule: 0,
      subRuleIsActive: false,
      subModalIsOpen: false,
      // 마스코트 반복 규칙 기본값
      mascotIsActive: false,
      wayIsChange: true,
      repeatRules: [],
      // 구간 기록 기본값 (빈 배열)
      sectionRecords: [],
      sectionModalIsOpen: false,
    };
  }, []);

  /**
   * 중복 이름 체크 함수
   */
  const checkDuplicateName = useCallback((newItem: Item): boolean => {
    const allItems = getStoredItems();

    return allItems.some((item) =>
      item.title === newItem.title &&
      item.type === newItem.type &&
      ((item.type === 'counter' && item.parentProjectId === null) ||
       item.type === 'project')
    );
  }, []);

  /**
   * 아이템 생성 완료 처리 (실제 저장 및 상태 초기화)
   */
  const completeItemCreation = useCallback((item: Item) => {
    addItem(item);
    resetModalState();
    setItems(prev => [item, ...prev]);
  }, [resetModalState, setItems]);

  /**
   * 프로젝트/카운터 생성 모달에서 확인 시 아이템 생성 및 중복 체크
   */
  const handleCreateItemConfirm = useCallback((name: string, type: 'project' | 'counter') => {
    const newItem = createNewItem(type, name);

    if (checkDuplicateName(newItem)) {
      setPendingItem(newItem);
      setDuplicateModalVisible(true);
      return false;
    }

    completeItemCreation(newItem);
    return true;
  }, [createNewItem, checkDuplicateName, completeItemCreation, setPendingItem, setDuplicateModalVisible]);

  /**
   * 삭제 모달 설명 텍스트 생성
   */
  const getDeleteDescription = useCallback(() => {
    const pending = itemsPendingDelete;
    if (!pending?.length) {
      return '';
    }

    if (pending.length === 1) {
      const item = pending[0];
      const isProject = item.type === 'project';
      const count = isProject ? item.counterIds.length : 0;

      return isProject
        ? `"${item.title}" 프로젝트를 삭제하면 하위 카운터 ${count}개도 함께 삭제됩니다. 진행하시겠습니까?`
        : `"${item.title}" 카운터를 삭제하시겠습니까?`;
    }

    const hasProject = pending.some((i) => i.type === 'project');
    const n = pending.length;
    let msg = `선택한 ${n}개 항목을 삭제하시겠습니까?`;
    if (hasProject) {
      msg += ' 프로젝트를 삭제하면 하위 카운터도 함께 삭제됩니다.';
    }
    return msg;
  }, [itemsPendingDelete]);

  /**
   * 삭제 확인 시 실제 삭제 처리
   */
  const handleDeleteConfirm = useCallback(() => {
    const pending = itemsPendingDelete;
    if (!pending?.length) {
      return;
    }

    const removedIds = new Set<string>();

    pending.forEach((itemToDelete) => {
      if (itemToDelete.type === 'project') {
        const { counterIds } = itemToDelete;
        counterIds.forEach((id) => {
          removeItem(id);
          removedIds.add(id);
        });
      }
      removeItem(itemToDelete.id);
      removedIds.add(itemToDelete.id);
    });

    resetDeleteModalState();
    setSelectedItemIds([]);

    const nextItems = items.filter((item) => !removedIds.has(item.id));
    setItems(nextItems);
    if (nextItems.length === 0) {
      setIsEditMode(false);
    }
  }, [itemsPendingDelete, items, resetDeleteModalState, setItems, setIsEditMode, setSelectedItemIds]);

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
    isEditMode,
    modalVisible,
    deleteModalVisible,
    itemsPendingDelete,
    duplicateModalVisible,
    pendingItem,
    selectedItemIds,
    sortDropdownVisible,

    // 상태 설정 함수들
    setModalVisible,
    setSortDropdownVisible,

    // 액션 함수들
    handlePress,
    handleLongPress,
    toggleItemSelection,
    openBulkDeleteModal,
    handleCreateItemConfirm,
    handleDeleteConfirm,
    resetModalState,
    resetDeleteModalState,
    resetDuplicateModalState,
    completeItemCreation,
    getDeleteDescription,
    handleSortSelect,
  };
};
