import { VIEW2_SYMBOL_ASSET_SOURCES } from "../components/view2Symbols/index.jsx";
import {

  GAME4_VIEW2_CELL_BACKGROUND_ASSETS,
  GAME4_VIEW2_INFO_BACKGROUND_SRC,
  GAME4_VIEW2_INFO_SMALL_BOX_BACKGROUND_SRC,
  GAME4_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_9_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_12_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_1_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_2_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_3_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_4_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_5_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_6_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_12_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_9_STATIC_SRC,
  GAME6_VIEW2_CELL_BACKGROUND_ASSETS,
  GAME6_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_12_STATIC_SRC,
} from "./gameAssets.js";

export const VIEW2_CARPET_ASSETS = [
  "/assets/img/view2-carpet-open.webp?v=20260806-no-right-seam",
  "/img/extracted/\u0438\u0433\u0440\u0430-\u0425\u0443\u0448\u043a\u043e\u043b-\u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b-\u0438\u0433\u0440\u044b-1_0/sprite_002_201x653_at_1289_1.webp",
];

export const VIEW2_INFO_ASSETS = Array.from(
  { length: 13 },
  (_, symbol) =>
    `/assets/img/info-symbols/view2-symbol-${symbol}.webp?v=20260801-assets-lossless`,
);

export const COMBO_BORDERS = [];

const collectImageSources = (...values) =>
  values.flatMap((value) => {
    if (!value) return [];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return collectImageSources(...value);
    if (typeof value === "object" && typeof value.src === "string") {
      return [value.src];
    }
    if (typeof value === "object") return collectImageSources(...Object.values(value));
    return [];
  });

export const SHARED_DICE_SYMBOL_ASSETS = [
  "/assets/img/view2-symbol-1-static.webp?v=20260711-1",
  "/assets/img/view2-symbol-2-static.webp?v=20260711-2",
  "/assets/img/view2-symbol-3-static.webp?v=20260711-1",
  "/assets/img/view2-symbol-4-static.webp?v=20260711-1",
  "/assets/img/view2-symbol-5-static.webp?v=20260711-1",
  "/assets/img/view2-symbol-6-static.webp?v=20260711-1",
];

export const SHARED_VIEW2_ASSETS = [
  ...new Set(
    collectImageSources(
      COMBO_BORDERS,
      VIEW2_CARPET_ASSETS,
      SHARED_DICE_SYMBOL_ASSETS,
    ),
  ),
];

export const GAME3_VIEW2_ASSETS = [
  ...new Set(
    collectImageSources(
      SHARED_VIEW2_ASSETS,
      VIEW2_SYMBOL_ASSET_SOURCES,
      VIEW2_INFO_ASSETS,
    ),
  ),
];

export const GAME6_WIN_ANIMATION_ASSETS = [0, 7, 8, 9, 10, 11, 12].flatMap(
  (symbol) =>
    Array.from(
      { length: 144 },
      (_, index) =>
        "/assets/img/animations/game6/" +
        symbol +
        "/frame_" +
        String(index).padStart(3, "0") +
        "_delay-0.04s.png",
    ),
);

export const GAME4_WIN_ANIMATION_ASSETS = [0, 7, 8, 9, 10, 11, 12].flatMap(
  (symbol) =>
    Array.from(
      { length: 144 },
      (_, index) =>
        "/assets/img/animations/game4/" +
        symbol +
        "/frame_" +
        String(index).padStart(3, "0") +
        "_delay-0.04s.png",
    ),
);

export const GAME4_VIEW2_ASSETS = [
  ...SHARED_VIEW2_ASSETS,
  ...GAME4_VIEW2_CELL_BACKGROUND_ASSETS,
  GAME4_VIEW2_INFO_BACKGROUND_SRC,
  GAME4_VIEW2_INFO_SMALL_BOX_BACKGROUND_SRC,
  GAME4_VIEW2_INFO_SMALL_BOX_BACKGROUND_SRC,
  ...GAME4_WIN_ANIMATION_ASSETS,
  GAME4_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_9_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_12_STATIC_SRC,
];

export const GAME5_WIN_ANIMATION_ASSETS = [0, 7, 8, 9, 10, 11, 12].map(
  (symbol) => `/assets/img/animations/game5/view2-symbol-${symbol}-win.webp`,
);

export const GAME5_VIEW2_ASSETS = [
  ...GAME3_VIEW2_ASSETS,
  ...GAME5_WIN_ANIMATION_ASSETS,
  GAME5_VIEW2_SYMBOL_1_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_2_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_3_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_4_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_5_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_6_BACKGROUND_SRC,
  GAME5_VIEW2_SYMBOL_12_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME5_VIEW2_SYMBOL_9_STATIC_SRC,
];

export const GAME6_VIEW2_ASSETS = [
  ...SHARED_VIEW2_ASSETS,
  ...GAME6_VIEW2_CELL_BACKGROUND_ASSETS,
  ...GAME6_WIN_ANIMATION_ASSETS,
  GAME6_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_12_STATIC_SRC,
];