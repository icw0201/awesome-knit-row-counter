const KEYCODE_DPAD_UP = 19;
const KEYCODE_DPAD_DOWN = 20;
const KEYCODE_DPAD_LEFT = 21;
const KEYCODE_DPAD_RIGHT = 22;
const KEYCODE_SPACE = 62;
const KEYCODE_ENTER = 66;
const KEYCODE_DEL = 67;

export const ADD_KEY_CODES = new Set([
  KEYCODE_DPAD_RIGHT,
  KEYCODE_SPACE,
  KEYCODE_ENTER,
]);

export const SUBTRACT_KEY_CODES = new Set([
  KEYCODE_DPAD_LEFT,
  KEYCODE_DEL,
]);

/** 보조 카운터 증가 (외장 키보드 위 방향키) */
export const SUB_COUNTER_ADD_KEY_CODES = new Set([KEYCODE_DPAD_UP]);

/** 보조 카운터 감소 (외장 키보드 아래 방향키) */
export const SUB_COUNTER_SUBTRACT_KEY_CODES = new Set([KEYCODE_DPAD_DOWN]);
