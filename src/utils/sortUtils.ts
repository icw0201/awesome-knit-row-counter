import { Item, Counter, Project, SortCriteria, SortOrder } from '@storage/types';
import { getStoredItems } from '@storage/storage';

//진행률 계산
export const getProgressPercentage = (item: Item): number => {
  if (item.type === 'counter') {
    // 카운터: endDate가 설정되어 있으면 완료 상태이므로 100% 반환
    const counter = item as Counter;
    const hasEndDate = counter.info?.endDate !== undefined && counter.info.endDate !== '' && counter.info.endDate !== null;
    if (hasEndDate) {
      return 100;
    }

    // count / targetCount * 100으로 계산 (targetCount가 0이면 0 반환)
    if (counter.targetCount > 0) {
      const progress = (counter.count / counter.targetCount) * 100;
      // 100% 이상인 경우 100% 반환
      return progress >= 100 ? 100 : progress;
    }
    return 0;
  } else if (item.type === 'project') {
    // 프로젝트: endDate가 설정되어 있으면 완료 상태이므로 100% 반환
    const project = item as Project;
    const hasEndDate = project.info?.endDate !== undefined && project.info.endDate !== '' && project.info.endDate !== null;
    if (hasEndDate) {
      return 100;
    }

    // 하위 카운터 중 targetCount가 지정된 카운터들의 진행률로 계산
    //   - targetCount가 지정된 카운터들의 count 합 / targetCount 합으로 진행률 계산
    //   - 전체 진행률 = (count 합 / targetCount 합) * 100 * (targetCount 지정된 카운터 수 / 전체 하위 카운터 수)
    const allItems = getStoredItems();
    const childCounters = allItems.filter(
      (i): i is Counter => i.type === 'counter' && project.counterIds.includes(i.id)
    );

    if (childCounters.length > 0) {
      // targetCount가 지정된 카운터들만 필터링
      const countersWithTarget = childCounters.filter((counter) => counter.targetCount > 0);

      if (countersWithTarget.length > 0) {
        // 개별 카운터의 진행률을 100%로 제한한 count 합과 targetCount 합 계산
        const totalCount = countersWithTarget.reduce(
          (sum, counter) => sum + Math.min(counter.count, counter.targetCount),
          0
        );
        const totalTargetCount = countersWithTarget.reduce((sum, counter) => sum + counter.targetCount, 0);

        // targetCount 지정된 카운터들의 진행률 계산 (100% 제한)
        const targetCountProgress = Math.min((totalCount / totalTargetCount) * 100, 100);

        // 전체 진행률 = targetCount 진행률 * (targetCount 지정된 카운터 비율)
        const progress = targetCountProgress * (countersWithTarget.length / childCounters.length);

        // 100% 이상인 경우 100%로 제한
        return progress >= 100 ? 100 : progress;
      }

      // targetCount가 지정된 카운터가 없는 경우 0% 반환
      return 0;
    }
    return 0;
  }
  return 0;
};

// 아이템의 소요시간(초)을 계산합니다.
// - counter: 자신의 elapsedTime 사용
// - project: 하위 카운터들의 elapsedTime 합
export const getElapsedTimeValue = (item: Item): number => {
  if (item.type === 'counter') {
    const counter = item as Counter;
    return counter.elapsedTime ?? 0;
  }

  if (item.type === 'project') {
    const project = item as Project;
    const allItems = getStoredItems();
    const childCounters = allItems.filter(
      (i): i is Counter => i.type === 'counter' && project.counterIds.includes(i.id)
    );

    if (childCounters.length === 0) {
      return 0;
    }

    return childCounters.reduce((sum, counter) => sum + (counter.elapsedTime ?? 0), 0);
  }

  return 0;
};

//아이템이 완료되었는지 확인합니다.
//진행률이 100% 이상이면 완료된 것으로 간주합니다.
export const isItemCompleted = (item: Item): boolean => {
  return getProgressPercentage(item) >= 100;
};

/**
 * 날짜 문자열을 비교 가능한 숫자로 변환합니다.
 * 날짜는 항상 .으로 구분되어 저장됨
 * 예: "2001.07.1" → 20010701, "2001.07.03" → 20010703
 */
const parseDateToNumber = (dateStr: string): number => {
  if (!dateStr || dateStr.trim() === '') {
    return 0; // 빈 날짜는 0으로 처리
  }

  // .으로 분리
  const parts = dateStr.trim().split('.').filter(part => part !== '');

  // 각 부분을 숫자로 변환 (빈 문자열이나 NaN이면 0)
  const year = parts.length > 0 ? (parseInt(parts[0], 10) || 0) : 0;
  const month = parts.length > 1 ? (parseInt(parts[1], 10) || 0) : 0;
  const day = parts.length > 2 ? (parseInt(parts[2], 10) || 0) : 0;

  // YYYYMMDD 형식으로 변환 (예: 20010701)
  return year * 10000 + month * 100 + day;
};

//아이템을 정렬 기준에 따라 비교합니다.
const compareItems = (a: Item, b: Item, criteria: SortCriteria, order: SortOrder): number => {
  let aValue: string | number = '';
  let bValue: string | number = '';

  switch (criteria) {
    case 'name':
      aValue = a.title.toLowerCase();
      bValue = b.title.toLowerCase();
      break;

    case 'created':
      // ID에서 타임스탬프 추출 (format: counter_1234567890 or proj_1234567890)
      aValue = parseInt(a.id.split('_')[1] || '0', 10);
      bValue = parseInt(b.id.split('_')[1] || '0', 10);
      break;

    case 'startDate':
      // 날짜 문자열을 숫자로 변환하여 비교
      const aStartDate = a.info?.startDate && a.info.startDate !== '' ? a.info.startDate : '';
      const bStartDate = b.info?.startDate && b.info.startDate !== '' ? b.info.startDate : '';
      aValue = parseDateToNumber(aStartDate);
      bValue = parseDateToNumber(bStartDate);
      break;

    case 'endDate':
      // 날짜 문자열을 숫자로 변환하여 비교
      const aEndDate = a.info?.endDate && a.info.endDate !== '' ? a.info.endDate : '';
      const bEndDate = b.info?.endDate && b.info.endDate !== '' ? b.info.endDate : '';
      aValue = parseDateToNumber(aEndDate);
      bValue = parseDateToNumber(bEndDate);
      break;

    case 'progress':
      aValue = getProgressPercentage(a);
      bValue = getProgressPercentage(b);
      break;

    case 'elapsedTime':
      aValue = getElapsedTimeValue(a);
      bValue = getElapsedTimeValue(b);
      break;
  }

  let comparison = 0;

  if (typeof aValue === 'string' && typeof bValue === 'string') {
    comparison = aValue.localeCompare(bValue);
  } else if (typeof aValue === 'number' && typeof bValue === 'number') {
    comparison = aValue - bValue;
  }

  return order === 'asc' ? comparison : -comparison;
};

/**
 * 아이템 배열을 정렬합니다.
 * @param items 정렬할 아이템 배열
 * @param criteria 정렬 기준
 * @param order 정렬 순서
 * @param moveCompletedToBottom 완성된 편물을 하단으로 이동할지 여부
 * @returns 정렬된 아이템 배열
 */
export const sortItems = (
  items: Item[],
  criteria: SortCriteria,
  order: SortOrder,
  moveCompletedToBottom: boolean
): Item[] => {
  // 완성된 편물을 하단으로 이동하는 경우
  if (moveCompletedToBottom) {
    const completedItems: Item[] = [];
    const incompleteItems: Item[] = [];

    items.forEach((item) => {
      if (isItemCompleted(item)) {
        completedItems.push(item);
      } else {
        incompleteItems.push(item);
      }
    });

    // 각 그룹을 정렬
    const sortedIncomplete = incompleteItems.sort((a, b) => compareItems(a, b, criteria, order));
    const sortedCompleted = completedItems.sort((a, b) => compareItems(a, b, criteria, order));

    return [...sortedIncomplete, ...sortedCompleted];
  }

  // 일반 정렬
  return items.sort((a, b) => compareItems(a, b, criteria, order));
};

