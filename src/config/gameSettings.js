export const REQUEST_TIMEOUT_MS = 9000;

export const LOTTERY_REVEAL_STEP_MS = 420;
export const LOTTERY_REVEAL_COLUMNS = 5;
export const LOTTERY_REVEAL_AUDIO_STOP_MS =
  LOTTERY_REVEAL_STEP_MS * (LOTTERY_REVEAL_COLUMNS - 1) + 320;
export const LOTTERY_REVEAL_SETTLE_MS =
  LOTTERY_REVEAL_STEP_MS * (LOTTERY_REVEAL_COLUMNS - 1) + 650;

export const FREE_SPIN_COUNT = 15;
export const FREE_SPIN_AUTOPLAY_DELAY_MS = 250;
export const DOUBLE_MAX_STEPS = 5;
export const DOUBLE_RESULT_REVEAL_MS = 1500;
export const DOUBLE_LOSS_RESET_MS = 2700;

export const IMAGE_PRELOAD_TIMEOUT_MS = 6000;
export const CARPET_SOUND_SRC = "/media/carpet.ogg";
export const CARPET_SOUND_FALLBACK_MS = 4910;
export const CARPET_ANIMATION_TRIM_MS = 2000;

export const getCarpetAnimationHalfMs = (durationMs) =>
  Math.round(Math.max(0, durationMs - CARPET_ANIMATION_TRIM_MS) / 2);

export const CARPET_ANIMATION_HALF_MS = getCarpetAnimationHalfMs(
  CARPET_SOUND_FALLBACK_MS,
);

export const RETRYABLE_CODES = new Set(["NETWORK_ERROR", "TIMEOUT"]);

export const createDoubleState = () => ({
  active: false,
  loading: false,
  step: 1,
  status: "Choose left or right",
});

export const createEmptyDoublingState = () => ({
  active: false,
  entered: false,
  loading: false,
  step: 0,
  marks: ["", "", "", "", ""],
  currentAmount: 0,
  initialAmount: 0,
  deferredBalance: 0,
  split: 0,
  revealKey: 0,
  changedIndex: -1,
  lastPick: "",
  lastStatus: "",
});

export const createWinningDoublingState = (amount) => ({
  ...createEmptyDoublingState(),
  active: true,
  currentAmount: amount,
});
