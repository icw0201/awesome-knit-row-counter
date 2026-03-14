import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import { getStoredItems, updateItem } from '@storage/storage';

/**
 * InfoScreen 화면 전용 훅
 * 아이템 정보 편집 및 저장 로직을 관리합니다.
 */
export const useItemInfo = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { itemId } = route.params as { itemId: string };

  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gauge, setGauge] = useState('');
  const [yarn, setYarn] = useState('');
  const [needle, setNeedle] = useState('');
  const [notes, setNotes] = useState('');
  const [isRootLevelItem, setIsRootLevelItem] = useState(false);
  const [itemType, setItemType] = useState<'project' | 'counter'>('counter');

  // 초기값 저장 (변경사항 비교용)
  const initialValuesRef = useRef({
    title: '',
    startDate: '',
    endDate: '',
    gauge: '',
    yarn: '',
    needle: '',
    notes: '',
  });

  // 저장 확인 모달 상태
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  // 제목 필수 에러 모달 상태
  const [showTitleErrorModal, setShowTitleErrorModal] = useState(false);
  // 저장하지 않고 뒤로가기 허용 플래그
  const shouldAllowBackWithoutSaveRef = useRef(false);

  /**
   * 저장된 아이템 정보를 불러와서 폼 상태를 초기화합니다.
   * 네비게이션 타이틀도 아이템 제목으로 설정합니다.
   */
  const loadItemInfo = useCallback(() => {
    const allItems = getStoredItems();
    const item = allItems.find((i) => i.id === itemId);

    if (!item) {
      return;
    }

    setItemType(item.type);
    setIsRootLevelItem(item.type === 'project' || (item.type === 'counter' && !item.parentProjectId));

    // 네비게이션 타이틀 설정
    navigation.setOptions({ title: `"${item.title}" 정보` });

    // 제목 설정
    const titleValue = item.title;
    setTitle(titleValue);

    // 정보 필드 초기화 (기본값: 빈 문자열)
    const info = item.info ?? {};
    const startDateValue = info.startDate ?? '';
    const endDateValue = info.endDate ?? '';
    const gaugeValue = info.gauge ?? '';
    const yarnValue = info.yarn ?? '';
    const needleValue = info.needle ?? '';
    const notesValue = info.notes ?? '';

    setStartDate(startDateValue);
    setEndDate(endDateValue);
    setGauge(gaugeValue);
    setYarn(yarnValue);
    setNeedle(needleValue);
    setNotes(notesValue);

    // 초기값 저장
    initialValuesRef.current = {
      title: titleValue,
      startDate: startDateValue,
      endDate: endDateValue,
      gauge: gaugeValue,
      yarn: yarnValue,
      needle: needleValue,
      notes: notesValue,
    };
  }, [itemId, navigation]);

  // 컴포넌트 마운트 시 아이템 정보 로드
  useEffect(() => {
    loadItemInfo();
  }, [loadItemInfo]);

  /**
   * 현재 값과 초기값을 비교하여 변경사항이 있는지 확인
   */
  const hasChanges = useCallback(() => {
    const current = {
      title: title.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      gauge: gauge.trim(),
      yarn: yarn.trim(),
      needle: needle.trim(),
      notes: notes.trim(),
    };

    const initial = initialValuesRef.current;

    return (
      current.title !== initial.title ||
      current.startDate !== initial.startDate ||
      current.endDate !== initial.endDate ||
      current.gauge !== initial.gauge ||
      current.yarn !== initial.yarn ||
      current.needle !== initial.needle ||
      current.notes !== initial.notes
    );
  }, [title, startDate, endDate, gauge, yarn, needle, notes]);

  /**
   * 뒤로가기 이벤트 처리
   * 변경사항이 있으면 확인 모달을 표시하고, 없으면 바로 뒤로가기
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // 뒤로가기 허용 플래그가 설정되어 있으면 그대로 진행하고 플래그 리셋
      if (shouldAllowBackWithoutSaveRef.current) {
        shouldAllowBackWithoutSaveRef.current = false;
        return;
      }

      // 변경사항이 없으면 그대로 진행
      if (!hasChanges()) {
        return;
      }

      // 제목이 비어있으면 저장할 수 없으므로 모달을 표시하지 않고 그대로 진행
      if (!title.trim()) {
        return;
      }

      // 기본 동작 방지
      e.preventDefault();

      // 확인 모달 표시
      setShowSaveConfirmModal(true);
    });

    return unsubscribe;
  }, [navigation, hasChanges, title]);

  /**
   * 폼 데이터를 저장합니다.
   * 제목이 비어있으면 저장하지 않습니다.
   */
  const saveData = useCallback(() => {
    if (!title.trim()) {
      return;
    }

    // 아이템 정보 업데이트
    updateItem(itemId, {
      title: title.trim(),
      info: {
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        gauge: gauge.trim(),
        yarn: yarn.trim(),
        needle: needle.trim(),
        notes: notes.trim(),
      },
    });

    // 초기값 업데이트
    initialValuesRef.current = {
      title: title.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      gauge: gauge.trim(),
      yarn: yarn.trim(),
      needle: needle.trim(),
      notes: notes.trim(),
    };
  }, [title, startDate, endDate, gauge, yarn, needle, notes, itemId]);

  /**
   * 폼 데이터를 저장하고 이전 화면으로 돌아갑니다.
   * 제목이 비어있으면 에러 모달을 표시합니다.
   */
  const handleSave = useCallback(() => {
    // 제목이 비어있으면 에러 모달 표시
    if (!title.trim()) {
      setShowTitleErrorModal(true);
      return;
    }
    saveData();
    // 이전 화면으로 이동
    navigation.goBack();
  }, [title, saveData, navigation]);

  /**
   * 저장 확인 모달에서 확인 버튼 클릭 시
   */
  const handleSaveConfirm = () => {
    saveData();
    shouldAllowBackWithoutSaveRef.current = true;
  };

  /**
   * 저장 확인 모달 닫기 핸들러
   */
  const handleModalClose = useCallback(() => {
    setShowSaveConfirmModal(false);
    // 취소 버튼 클릭 시: 저장하지 않고 뒤로가기 허용 플래그 설정
    shouldAllowBackWithoutSaveRef.current = true;
    // 모달이 완전히 닫힌 후 뒤로가기 실행
    setTimeout(() => {
      navigation.goBack();
    }, 200);
  }, [navigation]);

  /**
   * 취소 버튼 클릭 핸들러
   */
  const handleCancel = useCallback(() => {
    if (hasChanges()) {
      setShowSaveConfirmModal(true);
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  /**
   * 저장 버튼의 활성화 상태를 결정합니다.
   * 제목이 비어있으면 비활성화됩니다.
   */
  const isSaveButtonActive = title.trim().length > 0;

  return {
    // 폼 상태
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    gauge,
    setGauge,
    yarn,
    setYarn,
    needle,
    setNeedle,
    notes,
    setNotes,
    isRootLevelItem,
    itemType,
    // 모달 상태
    showSaveConfirmModal,
    showTitleErrorModal,
    setShowTitleErrorModal,
    // 핸들러
    handleSave,
    handleSaveConfirm,
    handleModalClose,
    handleCancel,
    // 상태
    isSaveButtonActive,
  };
};

