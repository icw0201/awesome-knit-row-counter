import { useCallback, useMemo, useState } from 'react';
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
import {
  suggestDuplicateTitle,
  cloneCounterForReplication,
  buildReplicatedProjectBundle,
  ReplicatedProjectBundle,
} from '@utils/replicationUtils';
import { useItemList } from './useItemList';

/**
 * Main 화면 전용 훅
 */
export const useMain = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // 정렬 드롭다운 표시 여부 상태
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  // --- 복제(편집 모드 복사 버튼) 모달 상태 ---
  const [replicateModalVisible, setReplicateModalVisible] = useState(false);
  /** 복제 대상 원본 아이템(프로젝트 또는 독립 카운터) */
  const [itemToReplicate, setItemToReplicate] = useState<Item | null>(null);
  /** 복제 모달 입력창 초기값: suggestDuplicateTitle 로 계산한 "이름 (2)" 형태 */
  const [replicateInitialName, setReplicateInitialName] = useState('');
  /** 프로젝트 복제 시 이름 충돌로 중복 확인 모달을 열 때, 저장 대기 중인 프로젝트+하위 카운터 묶음 */
  const [pendingProjectReplicate, setPendingProjectReplicate] = useState<ReplicatedProjectBundle | null>(null);

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
   * Main 화면에서 제목이 겹치면 안 되는 항목들의 title 목록.
   * checkDuplicateName 과 동일 스코프(프로젝트 + parent 가 없는 카운터) — 복제 시 suggestDuplicateTitle 에 넘김.
   */
  const getMainDuplicateTitleScope = useCallback((): string[] => {
    const allItems = getStoredItems();
    const titles: string[] = [];
    for (const i of allItems) {
      if (i.type === 'project') {
        titles.push(i.title);
      }
      if (i.type === 'counter' && i.parentProjectId == null) {
        titles.push(i.title);
      }
    }
    return titles;
  }, []);

  /** 복제 모달 닫기 + 소스/초기이름 상태 정리 */
  const resetReplicateModalState = useCallback(() => {
    setReplicateModalVisible(false);
    setItemToReplicate(null);
    setReplicateInitialName('');
  }, []);

  /** 편집 모드에서 복사 아이콘 탭: 제안 이름 채우고 복제 모달 오픈 */
  const handleCopyPress = useCallback(
    (item: Item) => {
      const suggested = suggestDuplicateTitle(item.title, getMainDuplicateTitleScope());
      setReplicateInitialName(suggested);
      setItemToReplicate(item);
      setReplicateModalVisible(true);
    },
    [getMainDuplicateTitleScope]
  );

  /** 프로젝트 복제본: 하위 카운터들을 스토리지에 추가한 뒤 프로젝트 추가, Main 리스트에는 프로젝트만 맨 앞에 반영 */
  const persistReplicatedProjectBundle = useCallback(
    (bundle: ReplicatedProjectBundle) => {
      bundle.counters.forEach((c) => addItem(c));
      addItem(bundle.project);
      setItems((prev) => [bundle.project, ...prev]);
    },
    [setItems]
  );

  /**
   * 복제 모달에서 확인: 독립 카운터는 clone 후 즉시 저장 또는 중복 시 pendingItem 으로 이중 모달.
   * 프로젝트는 번들 생성 후 즉시 저장하거나, 제목 충돌 시 pendingProjectReplicate 로 이중 모달.
   * 중복 분기에서는 return false 만 하고 복제 모달은 유지(ProjectCreateModal 과 동일하게 중복 확인이 위에 겹침).
   */
  const handleReplicateConfirm = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!itemToReplicate || !trimmed) {
        return false;
      }

      if (itemToReplicate.type === 'counter') {
        const newId = `counter_${Date.now()}`;
        const cloned = cloneCounterForReplication(itemToReplicate, trimmed, newId, null);
        if (checkDuplicateName(cloned)) {
          setPendingItem(cloned);
          setPendingProjectReplicate(null);
          setDuplicateModalVisible(true);
          return false;
        }
        addItem(cloned);
        setItems((prev) => [cloned, ...prev]);
        resetReplicateModalState();
        return true;
      }

      if (itemToReplicate.type === 'project') {
        const bundle = buildReplicatedProjectBundle(itemToReplicate, trimmed, getStoredItems());
        if (checkDuplicateName(bundle.project)) {
          setPendingProjectReplicate(bundle);
          setPendingItem(null);
          setDuplicateModalVisible(true);
          return false;
        }
        persistReplicatedProjectBundle(bundle);
        resetReplicateModalState();
        return true;
      }

      return true;
    },
    [
      itemToReplicate,
      checkDuplicateName,
      setPendingItem,
      setPendingProjectReplicate,
      setDuplicateModalVisible,
      setItems,
      persistReplicatedProjectBundle,
      resetReplicateModalState,
    ]
  );

  /** 중복 이름 ConfirmModal 닫을 때: useItemList 쪽 pendingItem 초기화 + 프로젝트 복제 대기 묶음도 제거 */
  const handleDuplicateModalClose = useCallback(() => {
    resetDuplicateModalState();
    setPendingProjectReplicate(null);
  }, [resetDuplicateModalState]);

  /** 중복 이름 모달에서 확인: 프로젝트 번들이면 일괄 저장, 아니면(카운터/일반 생성) completeItemCreation. 복제 모달이 열린 채였다면 함께 닫음 */
  const handleDuplicateConfirm = useCallback(() => {
    if (pendingProjectReplicate) {
      persistReplicatedProjectBundle(pendingProjectReplicate);
      setPendingProjectReplicate(null);
      resetReplicateModalState();
      return;
    }
    if (pendingItem) {
      completeItemCreation(pendingItem);
      resetReplicateModalState();
    }
  }, [pendingProjectReplicate, pendingItem, persistReplicatedProjectBundle, completeItemCreation, resetReplicateModalState]);

  /** 중복 이름 모달 본문: 프로젝트 복제 대기 / 프로젝트 생성 / 카운터 에 맞게 문구 분기 */
  const duplicateModalDescription = useMemo(() => {
    if (pendingProjectReplicate) {
      return '같은 이름의 프로젝트가 이미 존재합니다. 복제하시겠습니까?';
    }
    if (pendingItem?.type === 'project') {
      return '같은 이름을 가진 프로젝트가 이미 존재합니다. 생성하시겠습니까?';
    }
    return '같은 이름을 가진 카운터가 이미 존재합니다. 생성하시겠습니까?';
  }, [pendingProjectReplicate, pendingItem]);

  /** 중복 모달 확인 버튼: 프로젝트 복제 충돌 분기일 때만 "복제" */
  const duplicateConfirmText = pendingProjectReplicate ? '복제' : '생성';

  /** 복제 모달 제목·placeholder: 원본이 프로젝트인지 카운터인지에 따라 */
  const replicateModalTitle =
    itemToReplicate?.type === 'project' ? '프로젝트 복제하기' : '카운터 복제하기';
  const replicatePlaceholder =
    itemToReplicate?.type === 'project' ? '프로젝트 이름을 입력하세요' : '카운터 이름을 입력하세요';

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
        ? `"${item.title}" 프로젝트를 삭제하시겠습니까? 하위 카운터 ${count}개도 함께 삭제됩니다.`
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

    replicateModalVisible,
    replicateModalTitle,
    replicateInitialName,
    replicatePlaceholder,
    resetReplicateModalState,
    handleCopyPress,
    handleReplicateConfirm,
    handleDuplicateModalClose,
    handleDuplicateConfirm,
    duplicateModalDescription,
    duplicateConfirmText,
  };
};
