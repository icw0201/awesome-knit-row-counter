export interface FormattedElapsedTime {
  formatted: string;
  hours: string;
  minutes: string;
  seconds: string;
}

/**
 * 초 단위 시간을 H:MM:SS 또는 HH:MM:SS 형식으로 변환하고
 * 표시용 문자열과 시간/분/초 문자열을 함께 반환합니다.
 * 시간이 세 자릿수 이상일 때는 필요한 만큼 자릿수가 늘어남
 * 최대값: 9999:59:59 (35999999초)
 * @param seconds 초 단위 시간 (0 ~ 35999999, 음수는 0으로 처리)
 */
export const formatElapsedTime = (seconds: number): FormattedElapsedTime => {
  // 최대값: 9999시간 59분 59초 = 35999999초
  const MAX_SECONDS = 35999999;
  const totalSeconds = Math.min(Math.max(0, seconds), MAX_SECONDS);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const hoursString = String(hours);
  const minutesString = String(minutes).padStart(2, '0');
  const secondsString = String(secs).padStart(2, '0');

  return {
    formatted: `${hoursString}:${minutesString}:${secondsString}`,
    hours: hoursString,
    minutes: minutesString,
    seconds: secondsString,
  };
};

/**
 * 현재 시간을 HH:MM:SS 형식으로 반환합니다.
 * @returns 현재 시간 문자열 (HH:MM:SS 형식)
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 현재 날짜를 yyyyMMdd 형식으로 반환합니다.
 * @returns 현재 날짜 문자열 (yyyyMMdd 형식)
 */
export const getCurrentDate = (): string => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * yyyyMMdd 형식의 날짜를 YYYY/MM/DD 형식으로 변환합니다.
 * 형식이 올바르지 않으면 원본 문자열을 반환합니다.
 */
export const formatCompactDate = (date: string): string => {
  if (!/^\d{8}$/.test(date)) {
    return date;
  }

  return `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6, 8)}`;
};

