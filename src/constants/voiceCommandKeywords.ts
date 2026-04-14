/**
 * 기본 음성 명령어(단일 증감)에 쓰는 키워드 목록.
 * 설정의 기본 모드·힌트·STT contextualStrings 등과 동일 출처를 맞출 때 사용합니다.
 */
export const DEFAULT_VOICE_COMMAND_KEYWORDS = {
  add: ['곤지', '군지', '건지', '본지'],
  subtract: ['연지', '현지', '연기'],
  subAdd: ['홍실', '홍신', '동실', '통실', '봉실', '뽕실', '통신', '공실'],
  subSubtract: ['청실', '청신', '창실', '정신', '정실'],
} as const;
