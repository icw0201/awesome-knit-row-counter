import { RepeatRule } from '@storage/types';
import { RED_ORANGE_SWATCHES } from '@constants/colors';

/**
 * 규칙이 적용되는 단인지 확인하는 함수
 * @param count 확인할 단수
 * @param rule 반복 규칙
 * @returns 규칙이 적용되는 단이면 true, 아니면 false
 */
export const isRuleApplied = (count: number, rule: RepeatRule): boolean => {
  const { startNumber, endNumber, repeatCount = 0, ruleNumber } = rule;

  // 규칙이 입력되지 않았으면 false
  if (ruleNumber === 0) {
    return false;
  }

  if (startNumber > 0 && endNumber > 0) {
    // 시작단과 종료단 둘 다 있는 경우: 시작단 포함, ruleNumber 간격으로 적용
    let current = startNumber;
    while (current <= endNumber) {
      if (current === count) {
        return true;
      }
      current += ruleNumber;
    }
  } else if (startNumber > 0 && repeatCount > 0) {
    // 시작단과 반복 횟수가 있는 경우: 시작단 포함, repeatCount 횟수만큼 적용
    let current = startNumber;
    for (let i = 0; i < repeatCount; i++) {
      if (current === count) {
        return true;
      }
      current += ruleNumber;
    }
  } else if (startNumber > 0) {
    // 시작단만 있는 경우: 시작단 포함, ruleNumber 간격으로 적용
    if (count >= startNumber) {
      return (count - startNumber) % ruleNumber === 0;
    }
  } else if (endNumber > 0) {
    // 종료단만 있는 경우: ruleNumber부터 종료단까지
    let current = ruleNumber;
    while (current <= endNumber) {
      if (current === count) {
        return true;
      }
      current += ruleNumber;
    }
  } else if (repeatCount > 0) {
    // 반복 횟수만 있는 경우: ruleNumber부터 repeatCount 횟수만큼 적용
    let current = ruleNumber;
    for (let i = 0; i < repeatCount; i++) {
      if (current === count) {
        return true;
      }
      current += ruleNumber;
    }
  }

  return false;
};

/**
 * 규칙 미리보기 계산 (시작단 포함)
 * 규칙이 적용되는 단들의 배열을 반환합니다.
 * @param startNumber 시작단
 * @param endNumber 종료단
 * @param ruleNumber 룰넘버 (몇 단마다)
 * @param maxCount 최대 반환 개수 (기본값: 5)
 * @param repeatCount 반복 횟수
 * @returns 규칙이 적용되는 단들의 배열
 */
export const calculateRulePreview = (
  startNumber: number,
  endNumber: number,
  ruleNumber: number,
  maxCount: number = 5,
  repeatCount: number = 0
): number[] => {
  // 규칙이 입력되지 않았으면 빈 배열 반환
  if (ruleNumber === 0) {
    return [];
  }

  const results: number[] = [];

  if (startNumber > 0 && endNumber > 0) {
    // 시작단과 종료단 둘 다 있는 경우: 시작단 포함, ruleNumber 간격으로 적용
    let current = startNumber;
    while (current <= endNumber && results.length < maxCount) {
      results.push(current);
      current += ruleNumber;
    }
  } else if (startNumber > 0 && repeatCount > 0) {
    // 시작단과 반복 횟수가 있는 경우: 시작단 포함, repeatCount 횟수만큼 적용
    let current = startNumber;
    for (let i = 0; i < repeatCount && results.length < maxCount; i++) {
      results.push(current);
      current += ruleNumber;
    }
  } else if (startNumber > 0) {
    // 시작단만 있는 경우: 시작단 포함, ruleNumber 간격으로 적용
    let current = startNumber;
    for (let i = 0; i < maxCount; i++) {
      results.push(current);
      current += ruleNumber;
    }
  } else if (endNumber > 0) {
    // 종료단만 있는 경우: ruleNumber부터 종료단까지
    let current = ruleNumber;
    while (current <= endNumber && results.length < maxCount) {
      results.push(current);
      current += ruleNumber;
    }
  } else if (repeatCount > 0) {
    // 반복 횟수만 있는 경우: ruleNumber부터 repeatCount 횟수만큼 적용
    let current = ruleNumber;
    for (let i = 0; i < repeatCount && results.length < maxCount; i++) {
      results.push(current);
      current += ruleNumber;
    }
  }

  return results;
};

/**
 * 규칙 반복 횟수 계산
 * 종료단이 있는 경우 전체 몇 회 반복되는지 반환합니다.
 * @param startNumber 시작단
 * @param endNumber 종료단
 * @param ruleNumber 룰넘버 (몇 단마다)
 * @param repeatCount 반복 횟수
 * @returns 반복 횟수, 종료단과 반복 횟수가 모두 없으면 null
 */
export const calculateRuleRepeatCount = (
  startNumber: number,
  endNumber: number,
  ruleNumber: number,
  repeatCount: number = 0
): number | null => {
  if (repeatCount > 0) {
    return repeatCount;
  }

  if (endNumber <= 0) {
    return null;
  }

  if (startNumber > 0) {
    return Math.floor((endNumber - startNumber) / ruleNumber) + 1;
  }

  return Math.floor(endNumber / ruleNumber);
};

/** 색상 우선순위: 2단계씩 건너뛰며 (1,3,5,7,9,11 → 2, 4,6,8,10) */
// 100번 컬러(index 1)는 배경색과 동일하여 제거
const COLOR_PRIORITY_INDICES = [0, 2, 4, 6, 8, 10, 3, 5, 7, 9];

/**
 * 신규 규칙 카드의 기본 색상 반환
 * 기존 규칙과 겹치지 않는 red-orange 색상을 우선순위에 따라 선택, 모두 사용 중이면 첫 번째 색상 반환
 */
export const getDefaultColorForNewRule = (existingRules: RepeatRule[]): string => {
  const usedColors = new Set(existingRules.map((r) => r.color));
  const available = COLOR_PRIORITY_INDICES.find(
    (i) => RED_ORANGE_SWATCHES[i] && !usedColors.has(RED_ORANGE_SWATCHES[i])
  );
  if (available !== undefined) {
    return RED_ORANGE_SWATCHES[available];
  }
  // 모두 사용 중이면 우선순위 순서대로 순환
  const cycleIndex = existingRules.length % COLOR_PRIORITY_INDICES.length;
  return RED_ORANGE_SWATCHES[COLOR_PRIORITY_INDICES[cycleIndex]];
};

/** hex 색상이 진하면 true (텍스트 흰색 권장) */
export const isDarkColor = (hex: string): boolean => {
  const match = hex.replace(/^#/, '').match(/.{2}/g);
  if (!match) {
    return false;
  }
  const [r, g, b] = match.map((x) => parseInt(x, 16) / 255);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 0.5;
};
