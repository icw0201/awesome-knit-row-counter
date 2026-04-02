// src/components/list/ItemRow.tsx
import React from 'react';
import { View } from 'react-native';
import ItemBox from './ItemBox';
import CircleIcon from '@components/common/CircleIcon';
import CheckBox from '@components/common/CheckBox';
import { Item } from '@storage/types';
import { getProgressPercentage, isItemCompleted, getElapsedTimeValue } from '@utils/sortUtils';
import { getShowElapsedTimeInListSetting } from '@storage/settings';
import { formatElapsedTime } from '@utils/timeUtils';

interface ItemRowProps {
  item: Item;
  isEditMode: boolean;
  isSelected: boolean;
  onToggleSelect: (itemId: string) => void;
  onPress: (item: Item) => void;
  onLongPress: (item: Item) => void;
  onCopyPress?: (item: Item) => void;
}

/**
 * 개별 아이템(프로젝트/카운터) 행 컴포넌트
 *
 * Main과 ProjectDetail에서 공통으로 사용되는 아이템 표시 로직
 */
const ItemRow: React.FC<ItemRowProps> = ({
  item,
  isEditMode,
  isSelected,
  onToggleSelect,
  onPress,
  onLongPress,
  onCopyPress,
}) => {
  const getSubtitle = () => {
    return item.type === 'project' ? '프로젝트' : '카운터';
  };

  const getNumber = () => {
    if (item.type === 'project') {
      return item.counterIds?.length ?? 0;
    }
    return item.count;
  };

  const getElapsedTimeText = () => {
    const showElapsed = getShowElapsedTimeInListSetting();
    if (!showElapsed) {
      return undefined;
    }

    const seconds = getElapsedTimeValue(item);
    const { formatted } = formatElapsedTime(seconds);
    return formatted;
  };

  // util 함수를 사용하여 진행률 계산
  const progressValue = getProgressPercentage(item);
  const progressPercentage = progressValue > 0 ? progressValue : undefined;

  // util 함수를 사용하여 완료 상태 확인
  const isCompleted = isItemCompleted(item);

  return (
    <View className="mb-4 flex-row items-center">
      {isEditMode && (
        <View className="mr-2">
          <CheckBox
            checked={isSelected}
            onToggle={() => onToggleSelect(item.id)}
            variant="chunky"
            accessibilityLabel={`${item.title} 선택`}
          />
        </View>
      )}

      <View className="mr-2 flex-1">
        <ItemBox
          title={item.title}
          subtitle={getSubtitle()}
          number={getNumber()}
          elapsedTimeText={getElapsedTimeText()}
          onPress={() => onPress(item)}
          onLongPress={() => onLongPress(item)}
          progressPercentage={progressPercentage}
          isCompleted={isCompleted}
          isEditMode={isEditMode}
        />
      </View>

      {isEditMode && onCopyPress && (
        <View className="ml-2">
          <CircleIcon
            size={48}
            iconName="copy"
            colorStyle="lightest"
            isButton
            onPress={() => onCopyPress(item)}
          />
        </View>
      )}
    </View>
  );
};

export default ItemRow;
