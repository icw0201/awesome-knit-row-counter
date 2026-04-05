import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, TouchableOpacity } from 'react-native';
import CheckBox from '@components/common/CheckBox';
import { usePreferReducedMotion } from '@hooks/usePreferReducedMotion';
import {
  getSortCriteriaSetting,
  setSortCriteriaSetting,
  getSortOrderSetting,
  setSortOrderSetting,
  getMoveCompletedToBottomSetting,
  setMoveCompletedToBottomSetting,
  getShowElapsedTimeInListSetting,
  setShowElapsedTimeInListSetting,
} from '@storage/settings';
import {
  SORT_CRITERIA_MAP,
  SORT_CRITERIA_REVERSE_MAP,
  SORT_ORDER_MAP,
  SORT_ORDER_REVERSE_MAP,
  SORT_CRITERIA_OPTIONS,
  SORT_ORDER_OPTIONS,
} from '@constants/sortConfig';

interface SortDropdownProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  // storage에서 초기값 가져오기
  const [selectedSortBy, setSelectedSortBy] = useState<string>(() => {
    const criteria = getSortCriteriaSetting();
    return SORT_CRITERIA_REVERSE_MAP[criteria] || '생성일';
  });
  const [selectedOrder, setSelectedOrder] = useState<string>(() => {
    const order = getSortOrderSetting();
    return SORT_ORDER_REVERSE_MAP[order] || '내림차순';
  });
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    return getMoveCompletedToBottomSetting();
  });
  const [showElapsedTimeInList, setShowElapsedTimeInList] = useState<boolean>(() => {
    return getShowElapsedTimeInListSetting();
  });

  const preferReducedMotion = usePreferReducedMotion();

  // visible이 true가 될 때마다 storage에서 최신 값 가져오기
  useEffect(() => {
    if (visible) {
      const criteria = getSortCriteriaSetting();
      const order = getSortOrderSetting();
      const moveCompleted = getMoveCompletedToBottomSetting();
      const showElapsedTime = getShowElapsedTimeInListSetting();
      setSelectedSortBy(SORT_CRITERIA_REVERSE_MAP[criteria] || '생성일');
      setSelectedOrder(SORT_ORDER_REVERSE_MAP[order] || '내림차순');
      setHideCompleted(moveCompleted);
      setShowElapsedTimeInList(showElapsedTime);
    }
  }, [visible]);


  const handleSortBySelect = (option: string) => {
    setSelectedSortBy(option);
    // storage에 저장
    const criteria = SORT_CRITERIA_MAP[option];
    if (criteria) {
      setSortCriteriaSetting(criteria);
      onSelect(`sortBy:${option}`);
    }
  };

  const handleOrderSelect = (option: string) => {
    setSelectedOrder(option);
    // storage에 저장
    const order = SORT_ORDER_MAP[option];
    if (order) {
      setSortOrderSetting(order);
      onSelect(`order:${option}`);
    }
  };

  const handleHideCompletedToggle = () => {
    const newValue = !hideCompleted;
    setHideCompleted(newValue);
    // storage에 저장
    setMoveCompletedToBottomSetting(newValue);
    // 정렬 변경 알림
    onSelect('moveCompletedToBottom');
  };

  const handleShowElapsedTimeInListToggle = () => {
    const newValue = !showElapsedTimeInList;
    setShowElapsedTimeInList(newValue);
    setShowElapsedTimeInListSetting(newValue);
    onSelect('showElapsedTimeInList');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={preferReducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <Pressable className="flex-1" onPress={onClose}>
        <Pressable
          className="absolute right-3 top-16 bg-white rounded-2xl w-40 p-4 shadow-lg"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-s font-bold text-black mb-2">정렬</Text>

          {/* 구분선 */}
          <View className="border-b border-lightgray -mx-4 mb-2" />

          {/* 정렬 기준 옵션들 */}
          <View>
            {SORT_CRITERIA_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => handleSortBySelect(option)}
              >
                {selectedSortBy === option ? (
                  <View className="bg-red-orange-50 -mx-2 py-2 rounded">
                    <Text className="text-xs text-black px-2">
                      {option}
                    </Text>
                  </View>
                ) : (
                  <View className="py-2">
                    <Text className="text-xs text-black">
                      {option}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 구분선 */}
          <View className="border-b border-lightgray -mx-4 my-2" />

          {/* 정렬 순서 옵션들 */}
          <View>
            {SORT_ORDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => handleOrderSelect(option)}
              >
                {selectedOrder === option ? (
                  <View className="bg-red-orange-50 -mx-2 py-2 rounded">
                    <Text className="text-xs text-black px-2">
                      {option}
                    </Text>
                  </View>
                ) : (
                  <View className="py-2">
                    <Text className="text-xs text-black">
                      {option}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 구분선 */}
          <View className="border-b border-lightgray -mx-4 my-2" />

          {/* 체크박스 - 완성 편물 아래로 */}
          <View className="-ml-3">
            <CheckBox
                label="완성 편물 아래로"
                checked={hideCompleted}
                onToggle={handleHideCompletedToggle}
                size="xs"
            />
          </View>

          {/* 구분선 */}
          <View className="border-b border-lightgray -mx-4 my-2" />

          {/* 체크박스 - 목록에서 소요 시간 표시 */}
          <View className="-ml-3">
            <CheckBox
                label="소요시간 표시"
                checked={showElapsedTimeInList}
                onToggle={handleShowElapsedTimeInListToggle}
                size="xs"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default SortDropdown;
