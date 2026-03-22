
// ===== 기본 타입들 =====

/* 어쩌미 way 상태 */
export type Way = 'front' | 'back';

// 활성화 모드 타입 (마이그레이션용 - 더 이상 사용하지 않음)
export type ActivateMode = 'inactive' | 'auto';

// 정렬 기준 타입
export type SortCriteria = 'name' | 'created' | 'startDate' | 'endDate' | 'progress' | 'elapsedTime';

// 정렬 순서 타입
export type SortOrder = 'asc' | 'desc';

// 편집 내용 로그 타입
export type EditLogType =
  | 'count_increase'     // 단수 증
  | 'count_decrease'     // 단수 감
  | 'count_reset'        // 단수 초기화
  | 'count_edit'         // 단수 편집
  | 'sub_count_increase' // 코수 증
  | 'sub_count_decrease' // 코수 감
  | 'sub_count_reset'    // 코수 초기화
  | 'sub_count_edit'     // 코수 편집
  | 'sub_rule_activate'  // 코수 규칙 활성화
  | 'sub_rule_deactivate' // 코수 규칙 비활성화
  | 'way_change_front'   // 방향 변경 (앞)
  | 'way_change_back';   // 방향 변경 (뒤)

// ===== 공통 정보 타입 =====

// 프로젝트/카운터 정보 타입
export type Info = {
  startDate?: string; // 시작일 (8자리 yyyyMMdd 형식)
  endDate?: string;   // 종료일 (8자리 yyyyMMdd 형식)
  gauge?: string;     // 게이지 정보 (최대 500자)
  yarn?: string;      // 실 정보 (최대 500자)
  needle?: string;    // 바늘 정보 (최대 500자)
  notes?: string;     // 메모 (최대 500자)
};

// 반복 규칙 타입
export type RepeatRule = {
  message: string;      // 메시지
  startNumber: number;  // 시작단
  endNumber: number;   // 종료단
  ruleNumber: number;   // 룰넘버 (몇 단마다)
  color: string;       // 색상 (필수)
};

// 구간 기록 타입
export type SectionRecord = {
  time: string;          // 시간 (HH:MM:SS 형식)
  editedCount: number;   // 편집 후 코수
  editedMainCount?: number; // 편집 후 단수 (단수 관련 편집 시에만 저장)
  editContent: EditLogType; // 편집 내용
  inputSource?: 'voice'; // 음성 인식으로 실행된 기록인지 여부
  // 실행 취소를 위한 이전 상태 정보
  previousCount?: number;      // 이전 단수
  previousSubCount?: number;   // 이전 코수
  previousWay?: Way;           // 이전 way
  previousSubRuleIsActive?: boolean; // 이전 보조 카운터 규칙 활성화 여부
};

// ===== 아이템 타입들 =====

// 카운터 아이템 타입
export type Counter = {
  id: string;                    // 고유 식별자
  type: 'counter';              // 타입 (항상 'counter')
  title: string;                 // 카운터 제목
  count: number;                 // 현재 카운트 수
  targetCount: number;           // 목표 단수 (0 = 목표 없음)
  elapsedTime: number;           // 소요 시간 (초 단위, 0 ~ 35999999, 최대 9999:59:59)
  timerIsActive: boolean;        // 타이머 활성화 상태
  timerIsPlaying: boolean;       // 타이머 재생 상태
  parentProjectId?: string | null; // 상위 프로젝트 ID (독립 카운터는 null)
  info?: Info;                   // 카운터 정보 (독립 카운터만 사용)
  way?: Way;                     // 진행 방향
  // 보조 카운터 필드들
  subCount: number;              // 보조 카운터의 현재 카운트 수
  subRule: number;               // 보조 카운터의 규칙 번호
  subRuleIsActive: boolean;      // 보조 카운터의 규칙 활성화 여부
  subModalIsOpen: boolean;       // 보조 카운터 모달 열림 여부
  // 마스코트 반복 규칙 필드들
  mascotIsActive: boolean;       // 마스코트 활성화 여부
  wayIsChange: boolean;          // 마스코트 앞뒤 변경 여부
  repeatRules: RepeatRule[];     // 반복 규칙 배열 (여러 개 가능)
  // 구간 기록 필드 (최신 3개만 저장)
  sectionRecords: SectionRecord[]; // 구간 기록 배열
  sectionModalIsOpen: boolean;     // 구간 기록 모달 열림 여부
  updatedAt?: number;            // 마지막 업데이트 시각 (epoch ms)
};

// 프로젝트 아이템 타입
export type Project = {
  id: string;        // 고유 식별자
  type: 'project';  // 타입 (항상 'project')
  title: string;     // 프로젝트 제목
  counterIds: string[]; // 하위 카운터 ID 배열
  info?: Info;       // 프로젝트 정보
  updatedAt?: number; // 마지막 업데이트 시각 (epoch ms)
};

// ===== 통합 타입 =====

// 모든 아이템의 공통 타입 (프로젝트 또는 카운터)
export type Item = Project | Counter;
