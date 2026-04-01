import { useState, useCallback, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';

import { Item, Counter, Project } from '@storage/types';
import { getStoredItems, getAllProjects, getIndependentCounters } from '@storage/storage';
import {
  getSortCriteriaSetting,
  getSortOrderSetting,
  getMoveCompletedToBottomSetting,
} from '@storage/settings';
import { sortItems } from '@utils/sortUtils';

interface UseItemListProps {
  projectId?: string; // ProjectDetail에서만 사용
  headerSetup: () => void; // 헤더 설정 함수
}

interface UseItemListReturn {
  // 상태
  items: Item[];
  project: Project | null;
  isEditMode: boolean;
  modalVisible: boolean;
  deleteModalVisible: boolean;
  itemsPendingDelete: Item[] | null;
  duplicateModalVisible: boolean;
  pendingItem: Item | null;
  selectedItemIds: string[];

  // 핸들러
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setItemsPendingDelete: React.Dispatch<React.SetStateAction<Item[] | null>>;
  setDuplicateModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingItem: React.Dispatch<React.SetStateAction<Item | null>>;
  setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>;

  // 액션 함수들
  handlePress: (item: Item) => void;
  handleLongPress: (item: Item) => void;
  toggleItemSelection: (itemId: string) => void;
  openBulkDeleteModal: () => void;
  resetModalState: () => void;
  resetDeleteModalState: () => void;
  resetDuplicateModalState: () => void;
}

/**
 * Main과 ProjectDetail에서 공통으로 사용되는 아이템 목록 관리 훅
 */
export const useItemList = ({ projectId, headerSetup }: UseItemListProps): UseItemListReturn => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 상태 정의
  const [items, setItems] = useState<Item[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemsPendingDelete, setItemsPendingDelete] = useState<Item[] | null>(null);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [pendingItem, setPendingItem] = useState<Item | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const selectedItemIdsRef = useRef<string[]>([]);
  selectedItemIdsRef.current = selectedItemIds;

  /**
   * Main 화면용: 저장된 아이템(프로젝트, 카운터) 불러와서 정렬 후 상태에 저장
   */
  const fetchMainItems = useCallback(() => {
    const projects = getAllProjects();
    const independentCounters = getIndependentCounters();

    const allItems = [...projects, ...independentCounters];

    // storage에서 정렬 설정 가져오기
    const criteria = getSortCriteriaSetting();
    const order = getSortOrderSetting();
    const moveCompletedToBottom = getMoveCompletedToBottomSetting();

    // 정렬 적용
    const sorted = sortItems(allItems, criteria, order, moveCompletedToBottom);

    setItems(sorted);
  }, []);

  /**
   * ProjectDetail 화면용: 프로젝트와 하위 카운터들을 불러와서 정렬 후 상태에 저장
   */
  const fetchProjectData = useCallback(() => {
    const allItems = getStoredItems();

    const currentProject = allItems.find(
      (item): item is Project => item.id === projectId && item.type === 'project'
    );

    if (currentProject) {
      setProject(currentProject);

      const countersInProject = allItems.filter(
        (item): item is Counter =>
          item.type === 'counter' && currentProject.counterIds.includes(item.id)
      );

      // storage에서 정렬 설정 가져오기
      const criteria = getSortCriteriaSetting();
      const order = getSortOrderSetting();
      const moveCompletedToBottom = getMoveCompletedToBottomSetting();

      // 정렬 적용
      const sorted = sortItems(countersInProject, criteria, order, moveCompletedToBottom);

      setItems(sorted);
    }
  }, [projectId]);

  /**
   * 데이터 새로고침 함수 (화면 타입에 따라 다름)
   */
  const fetchData = projectId ? fetchProjectData : fetchMainItems;

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }, []);

  /**
   * 아이템 클릭 시 상세 이동, 편집 모드에서는 행 탭으로 선택 토글
   */
  const handlePress = useCallback(
    (item: Item) => {
      if (isEditMode) {
        toggleItemSelection(item.id);
        return;
      }
      if (item.type === 'project') {
        navigation.navigate('ProjectDetail', { projectId: item.id });
      } else {
        navigation.navigate('CounterDetail', { counterId: item.id });
      }
    },
    [isEditMode, navigation, toggleItemSelection]
  );

  /**
   * 아이템 길게 누르기 시 편집 모드 진입
   */
  const handleLongPress = useCallback((_item: Item) => {
    if (!isEditMode) {
      setIsEditMode(true);
    }
  }, [isEditMode]);

  const openBulkDeleteModal = useCallback(() => {
    const ids = selectedItemIdsRef.current;
    if (ids.length === 0) {
      return;
    }
    setItemsPendingDelete(items.filter((i) => ids.includes(i.id)));
    setDeleteModalVisible(true);
  }, [items]);

  /**
   * 모달 상태 초기화 함수들
   */
  const resetModalState = useCallback(() => {
    setModalVisible(false);
  }, []);

  const resetDeleteModalState = useCallback(() => {
    setDeleteModalVisible(false);
    setItemsPendingDelete(null);
  }, []);

  const resetDuplicateModalState = useCallback(() => {
    setDuplicateModalVisible(false);
    setPendingItem(null);
  }, []);

  // 화면이 포커스될 때마다 데이터 새로고침 및 정렬 적용
  useFocusEffect(useCallback(() => {
    fetchData();
  }, [fetchData]));

  // 헤더 설정
  useEffect(() => {
    headerSetup();
  }, [headerSetup]);

  // 뒤로가기 버튼 핸들링 (편집 모드일 때는 편집 모드 해제)
  useEffect(() => {
    const onBackPress = () => {
      if (isEditMode) {
        setIsEditMode(false);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setSelectedItemIds([]);
    }
  }, [isEditMode]);

  // ProjectDetail에서 프로젝트 정보 업데이트
  useEffect(() => {
    if (projectId) {
      const storedItems = getStoredItems();
      const currentProject = storedItems.find((item): item is Project => item.id === projectId && item.type === 'project');
      if (currentProject) {
        setProject(currentProject);
      }
    }
  }, [projectId]);

  return {
    items,
    project,
    isEditMode,
    modalVisible,
    deleteModalVisible,
    itemsPendingDelete,
    duplicateModalVisible,
    pendingItem,
    selectedItemIds,
    setItems,
    setProject,
    setIsEditMode,
    setModalVisible,
    setDeleteModalVisible,
    setItemsPendingDelete,
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
  };
};
