import { useEffect, useLayoutEffect, useState } from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import { getStoredItems, updateItem } from '@storage/storage';
import { Counter, RepeatRule, RuleEndMode } from '@storage/types';

/**
 * 규칙 확인 데이터 타입
 */
export type RuleConfirmData = {
  message: string;
  startNumber: number;
  endNumber: number;
  repeatCount: number;
  endMode: RuleEndMode | null;
  ruleNumber: number;
  color: string; // 색상 (필수)
};

/**
 * Way 설정 화면 전용 훅
 */
export const useWaySetting = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'WaySetting'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { counterId } = route.params;

  const [counter, setCounter] = useState<Counter | null>(null);
  const [mascotIsActive, setMascotIsActive] = useState(false);
  const [wayIsChange, setWayIsChange] = useState(false);
  const [repeatRules, setRepeatRules] = useState<RepeatRule[]>([]);
  const [isAddingNewRule, setIsAddingNewRule] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRuleIndex, setDeleteRuleIndex] = useState<number | null>(null);
  const [deleteRuleMessage, setDeleteRuleMessage] = useState<string>('');

  useEffect(() => {
    if (!counterId) {
      return;
    }
    const found = getStoredItems().find(
      (item): item is Counter => item.id === counterId && item.type === 'counter'
    );
    if (found) {
      setCounter(found);
      setMascotIsActive(found.mascotIsActive ?? false);
      setWayIsChange(found.wayIsChange ?? false);
      setRepeatRules(found.repeatRules ?? []);
    } else {
      setCounter(null);
    }
  }, [counterId]);

  useLayoutEffect(() => {
    if (counter) {
      navigation.setOptions({ title: `"${counter.title}" 어쩌미 알림 단 설정` });
    }
  }, [counter, navigation]);

  const handleToggleMascotIsActive = () => {
    if (!counter) {
      return;
    }
    const newMascotIsActive = !mascotIsActive;
    setMascotIsActive(newMascotIsActive);
    updateItem(counter.id, { mascotIsActive: newMascotIsActive });
  };

  const handleToggleWayIsChange = () => {
    if (!counter) {
      return;
    }
    const newWayIsChange = !wayIsChange;
    setWayIsChange(newWayIsChange);
    updateItem(counter.id, { wayIsChange: newWayIsChange });
  };

  const handleAddRule = () => {
    setIsAddingNewRule(true);
  };

  const handleCancelAddRule = () => {
    setIsAddingNewRule(false);
  };

  const handleRuleConfirm = (index: number | null, data: RuleConfirmData) => {
    if (!counter) {
      return;
    }

    const isNewRule = index === null;

    // 편집 모드일 때 범위 체크
    if (!isNewRule && (index < 0 || index >= repeatRules.length)) {
      return;
    }

    const newRule: RepeatRule = {
      message: data.message,
      startNumber: data.startNumber,
      endNumber: data.endNumber,
      repeatCount: data.repeatCount,
      endMode: data.endMode,
      ruleNumber: data.ruleNumber,
      color: data.color,
    };

    const updatedRules = isNewRule
      ? [...repeatRules, newRule]
      : repeatRules.map((r, i) => (i === index ? newRule : r));

    if (isNewRule) {
      setIsAddingNewRule(false);
    }

    setRepeatRules(updatedRules);
    updateItem(counter.id, { repeatRules: updatedRules });
  };

  const handleRuleDeleteClick = (index: number) => {
    // 범위 체크
    if (index < 0 || index >= repeatRules.length) {
      return;
    }

    const rule = repeatRules[index];
    setDeleteRuleIndex(index);
    setDeleteRuleMessage(rule.message);
    setShowDeleteModal(true);
  };

  /**
   * 삭제 모달 상태 초기화 헬퍼 함수
   */
  const resetDeleteModalState = () => {
    setShowDeleteModal(false);
    setDeleteRuleIndex(null);
    setDeleteRuleMessage('');
  };

  const handleRuleDeleteConfirm = () => {
    if (!counter || deleteRuleIndex === null) {
      return;
    }

    // 범위 체크
    if (deleteRuleIndex < 0 || deleteRuleIndex >= repeatRules.length) {
      resetDeleteModalState();
      return;
    }

    const updatedRules = repeatRules.filter((_, i) => i !== deleteRuleIndex);
    setRepeatRules(updatedRules);
    updateItem(counter.id, { repeatRules: updatedRules });
    resetDeleteModalState();
  };

  const handleCloseDeleteModal = () => {
    resetDeleteModalState();
  };

  return {
    counter,
    mascotIsActive,
    wayIsChange,
    repeatRules,
    isAddingNewRule,
    showDeleteModal,
    deleteRuleMessage,
    handleToggleMascotIsActive,
    handleToggleWayIsChange,
    handleAddRule,
    handleRuleConfirm,
    handleRuleDeleteClick,
    handleRuleDeleteConfirm,
    handleCloseDeleteModal,
    handleCancelAddRule,
  };
};
