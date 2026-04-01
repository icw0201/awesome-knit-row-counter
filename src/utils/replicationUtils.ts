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

/**
 * Main 화면 이름 충돌 검사와 동일 스코프의 기존 제목들로 다음 복제본 제목 제안 (최대 15자)
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

  const nextN = maxN < 1 ? 2 : maxN + 1;
  const candidate = `${stem} (${nextN})`;
  return candidate.length > TITLE_MAX_LENGTH ? candidate.slice(0, TITLE_MAX_LENGTH) : candidate;
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
    repeatRules: source.repeatRules.map((r) => ({ ...r })),
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
