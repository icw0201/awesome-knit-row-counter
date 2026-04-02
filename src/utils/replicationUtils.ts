import { Counter, Item, Project } from '@storage/types';

const TITLE_MAX_LENGTH = 15;

/**
 * 끝의 ` (숫자)` 접미사를 제거한 stem 반환
 */
export function stripNumericSuffix(title: string): string {
  const trimmed = title.trim();
  const m = trimmed.match(/^(.*) \((\d+)\)$/);
  return m ? m[1].trimEnd() : trimmed;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** UTF-16 slice 대신 코드 포인트 단위로 자름(이모지 서로게이트 쌍 중간 절단 방지) */
function truncateToMaxCodePoints(str: string, maxCodePoints: number): string {
  if (maxCodePoints <= 0) {
    return '';
  }
  const points = Array.from(str);
  if (points.length <= maxCodePoints) {
    return str;
  }
  return points.slice(0, maxCodePoints).join('');
}

/** `stem` + ` (${n})` 형태로 합치되, 전체 길이가 maxLen 이하가 되도록 stem만 잘라 접미사는 항상 보존 */
function buildNumberedTitle(stem: string, n: number, maxLen: number): string {
  const suffix = ` (${n})`;
  if (suffix.length >= maxLen) {
    return suffix.slice(0, maxLen);
  }
  const maxStemLen = maxLen - suffix.length;
  const stemCp = Array.from(stem).length;
  const trimmedStem = stemCp > maxStemLen ? truncateToMaxCodePoints(stem, maxStemLen) : stem;
  return trimmedStem + suffix;
}

/**
 * Main 화면 이름 충돌 검사와 동일 스코프의 기존 제목들로 다음 복제본 제목 제안 (최대 15자)
 * 긴 stem 은 ` (N)` 접미사가 잘리지 않도록 stem 만 축약하고, 동일 문자열이 있으면 N 을 올려 반복
 */
export function suggestDuplicateTitle(originalTitle: string, existingTitles: string[]): string {
  const stem = stripNumericSuffix(originalTitle);
  const escaped = escapeRegExp(stem);
  const numbered = new RegExp(`^${escaped} \\((\\d+)\\)$`);

  let maxN = 0;
  const stemAlone = existingTitles.some((t) => t.trim() === stem);
  if (stemAlone) {
    maxN = Math.max(maxN, 1);
  }
  for (const t of existingTitles) {
    const m = t.trim().match(numbered);
    if (m) {
      maxN = Math.max(maxN, parseInt(m[1], 10));
    }
  }

  const existingSet = new Set(existingTitles.map((t) => t.trim()));
  let n = maxN < 1 ? 2 : maxN + 1;
  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = buildNumberedTitle(stem, n, TITLE_MAX_LENGTH);
    if (!existingSet.has(candidate)) {
      return candidate;
    }
    n += 1;
  }

  return buildNumberedTitle(stem, n, TITLE_MAX_LENGTH);
}

/**
 * 경과 시간·구간 기록만 초기화하고 나머지 상태(타이머 on/off·재생 여부 등)는 유지한 카운터 복제본
 */
export function cloneCounterForReplication(
  source: Counter,
  newTitle: string,
  newId: string,
  parentProjectId: string | null
): Counter {
  return {
    ...source,
    id: newId,
    type: 'counter',
    title: newTitle,
    parentProjectId,
    elapsedTime: 0,
    sectionRecords: [],
    repeatRules: (source.repeatRules ?? []).map((r) => ({ ...r })),
    info: source.info ? { ...source.info } : undefined,
  };
}

export type ReplicatedProjectBundle = {
  project: Project;
  counters: Counter[];
};

/** id의 counter_${ts} 또는 updatedAt으로 생성 시각 추정 */
function getCounterCreatedTimestamp(counter: Counter): number {
  const m = counter.id.match(/^counter_(\d+)$/);
  if (m) {
    return parseInt(m[1], 10);
  }
  return counter.updatedAt ?? 0;
}

/**
 * 프로젝트와 하위 카운터를 새 id로 복제 (경과 시간·구간 기록만 초기화)
 * 새 counter id의 숫자는 원본 생성 순서(오래된 것이 더 작은 타임스탬프)를 유지하고,
 * project.counterIds 배열 순서는 원본과 동일하게 둔다.
 */
export function buildReplicatedProjectBundle(
  source: Project,
  newTitle: string,
  allItems: Item[]
): ReplicatedProjectBundle {
  const baseTs = Date.now();
  const newProjectId = `proj_${baseTs}`;

  const resolved: Counter[] = [];
  for (const oldId of source.counterIds) {
    const old = allItems.find((x): x is Counter => x.id === oldId && x.type === 'counter');
    if (old) {
      resolved.push(old);
    }
  }

  const byCreatedAsc = [...resolved].sort((a, b) => {
    const ta = getCounterCreatedTimestamp(a);
    const tb = getCounterCreatedTimestamp(b);
    if (ta !== tb) {
      return ta - tb;
    }
    return a.id.localeCompare(b.id);
  });

  const oldIdToNewId = new Map<string, string>();
  let offset = 0;
  for (const old of byCreatedAsc) {
    offset += 1;
    oldIdToNewId.set(old.id, `counter_${baseTs + offset}`);
  }

  const counters: Counter[] = [];
  for (const oldId of source.counterIds) {
    const old = allItems.find((x): x is Counter => x.id === oldId && x.type === 'counter');
    if (!old) {
      continue;
    }
    const newCounterId = oldIdToNewId.get(old.id);
    if (!newCounterId) {
      continue;
    }
    counters.push(cloneCounterForReplication(old, old.title, newCounterId, newProjectId));
  }

  const project: Project = {
    id: newProjectId,
    type: 'project',
    title: newTitle,
    counterIds: counters.map((c) => c.id),
    info: source.info ? { ...source.info } : undefined,
  };

  return { project, counters };
}
