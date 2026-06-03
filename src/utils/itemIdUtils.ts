export type ItemIdPrefix = 'proj' | 'counter';

/**
 * 현재 예약된 ID 집합을 기준으로, 주어진 seed 이상에서 충돌하지 않는 다음 item ID를 만든다.
 * 기존 정책인 `prefix_timestamp` 형식은 유지하고, 충돌 시 숫자만 1씩 증가시켜 회피한다.
 */
export const createUniqueItemId = (
  prefix: ItemIdPrefix,
  reservedIds: Set<string>,
  seed: number = Date.now()
): string => {
  let nextSeed = Math.max(0, Math.trunc(seed));

  while (reservedIds.has(`${prefix}_${nextSeed}`)) {
    nextSeed += 1;
  }

  const generatedId = `${prefix}_${nextSeed}`;
  reservedIds.add(generatedId);
  return generatedId;
};
