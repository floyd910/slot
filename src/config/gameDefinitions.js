import {
  GAME3_COVER_SRC,
  GAME3_LOGO_ORNAMENT_SRC,
  GAME3_LOGO_SRC,
  GAME4_CHOOSER_TILE_SRC,
  GAME4_COVER_SRC,
  GAME4_DOUBLE_SCENE_BACKGROUND_SRC,
  GAME4_DOUBLE_SCENE_CLOSED_CHEST_SRC,
  GAME4_DOUBLE_SCENE_WINNING_CHEST_SRC,
  GAME4_DOUBLE_SCENE_EMPTY_CHEST_SRC,
  GAME4_LOGO_SRC,
  GAME4_VIEW2_CELL_BACKGROUND_ASSETS,
  GAME4_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_9_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME4_VIEW2_SYMBOL_12_STATIC_SRC,
  GAME5_CHOOSER_TILE_SRC,
  GAME5_COVER_SRC,
  GAME5_LOGO_SRC,
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
import { getGameColors } from "./gameColors.js";

const sharedPlaceholderAssets = Object.freeze({
  cover: GAME3_COVER_SRC,
  logo: GAME3_LOGO_SRC,
  logoOrnament: GAME3_LOGO_ORNAMENT_SRC,
  chooserTile: "/assets/img/xiramandi-makor.webp",
});

const game6WinFrames = (symbol) =>
  Array.from(
    { length: 144 },
    (_, index) =>
      `/assets/img/animations/game6/${symbol}/frame_${String(index).padStart(3, "0")}_delay-0.04s.png`,
  );

const game6View2Symbol = (symbol, staticImage) =>
  Object.freeze({
    staticImage,
    animatedImage: null,
    winFrames: Object.freeze(game6WinFrames(symbol)),
    frameMs: 40,
    cycleMs: 5760,
    forwardLoop: true,
  });

const GAME6_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: "/assets/img/game6-background.webp",
  logo: "/assets/img/game6-header.webp",
  chooserTile: "/assets/img/game6-chooser-logo.webp",
  view2Symbols: Object.freeze({
    1: Object.freeze({ background: GAME6_VIEW2_CELL_BACKGROUND_ASSETS[0] }),
    2: Object.freeze({ background: GAME6_VIEW2_CELL_BACKGROUND_ASSETS[1] }),
    3: Object.freeze({ background: GAME6_VIEW2_CELL_BACKGROUND_ASSETS[2] }),
    4: Object.freeze({ background: GAME6_VIEW2_CELL_BACKGROUND_ASSETS[3] }),
    5: Object.freeze({ background: GAME6_VIEW2_CELL_BACKGROUND_ASSETS[4] }),
    6: Object.freeze({ background: GAME6_VIEW2_CELL_BACKGROUND_ASSETS[5] }),
    0: game6View2Symbol(0, GAME6_VIEW2_SYMBOL_0_STATIC_SRC),
    7: game6View2Symbol(7, GAME6_VIEW2_SYMBOL_7_STATIC_SRC),
    8: game6View2Symbol(8, GAME6_VIEW2_SYMBOL_8_STATIC_SRC),
    9: game6View2Symbol(9, game6WinFrames(9)[0]),
    10: game6View2Symbol(10, GAME6_VIEW2_SYMBOL_10_STATIC_SRC),
    11: game6View2Symbol(11, GAME6_VIEW2_SYMBOL_11_STATIC_SRC),
    12: game6View2Symbol(12, GAME6_VIEW2_SYMBOL_12_STATIC_SRC),
  }),
});

const game4WinFrames = (symbol) =>
  Array.from(
    { length: 144 },
    (_, index) =>
      `/assets/img/animations/game4/${symbol}/frame_${String(index).padStart(3, "0")}_delay-0.04s.png`,
  );

const game4View2Symbol = (symbol, staticImage) =>
  Object.freeze({
    staticImage,
    animatedImage: null,
    winFrames: Object.freeze(game4WinFrames(symbol)),
    frameMs: 40,
    cycleMs: 5760,
    forwardLoop: true,
  });

const GAME4_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME4_COVER_SRC,
  logo: GAME4_LOGO_SRC,
  chooserTile: GAME4_CHOOSER_TILE_SRC,
  doubleSceneBackground: GAME4_DOUBLE_SCENE_BACKGROUND_SRC,
  doubleSceneClosedChest: GAME4_DOUBLE_SCENE_CLOSED_CHEST_SRC,
  doubleSceneWinningChest: GAME4_DOUBLE_SCENE_WINNING_CHEST_SRC,
  doubleSceneEmptyChest: GAME4_DOUBLE_SCENE_EMPTY_CHEST_SRC,
  view2Symbols: Object.freeze({
    1: Object.freeze({ background: GAME4_VIEW2_CELL_BACKGROUND_ASSETS[0] }),
    2: Object.freeze({ background: GAME4_VIEW2_CELL_BACKGROUND_ASSETS[1] }),
    3: Object.freeze({ background: GAME4_VIEW2_CELL_BACKGROUND_ASSETS[2] }),
    4: Object.freeze({ background: GAME4_VIEW2_CELL_BACKGROUND_ASSETS[3] }),
    5: Object.freeze({ background: GAME4_VIEW2_CELL_BACKGROUND_ASSETS[4] }),
    6: Object.freeze({ background: GAME4_VIEW2_CELL_BACKGROUND_ASSETS[5] }),
    0: game4View2Symbol(0, GAME4_VIEW2_SYMBOL_0_STATIC_SRC),
    7: game4View2Symbol(7, GAME4_VIEW2_SYMBOL_7_STATIC_SRC),
    8: game4View2Symbol(8, GAME4_VIEW2_SYMBOL_8_STATIC_SRC),
    9: game4View2Symbol(9, GAME4_VIEW2_SYMBOL_9_STATIC_SRC),
    10: game4View2Symbol(10, GAME4_VIEW2_SYMBOL_10_STATIC_SRC),
    11: game4View2Symbol(11, GAME4_VIEW2_SYMBOL_11_STATIC_SRC),
    12: game4View2Symbol(12, GAME4_VIEW2_SYMBOL_12_STATIC_SRC),
  }),
});

const game5View2Symbol = (symbol, staticImage) =>
  Object.freeze({
    staticImage,
    animatedImage: `/assets/img/animations/game5/view2-symbol-${symbol}-win.webp`,
    cycleMs: 5760,
    singlePlayMs: 5760,
  });

const GAME5_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME5_COVER_SRC,
  logo: GAME5_LOGO_SRC,
  chooserTile: GAME5_CHOOSER_TILE_SRC,
  view2Symbols: Object.freeze({
    1: Object.freeze({ background: GAME5_VIEW2_SYMBOL_1_BACKGROUND_SRC }),
    2: Object.freeze({ background: GAME5_VIEW2_SYMBOL_2_BACKGROUND_SRC }),
    3: Object.freeze({ background: GAME5_VIEW2_SYMBOL_3_BACKGROUND_SRC }),
    4: Object.freeze({ background: GAME5_VIEW2_SYMBOL_4_BACKGROUND_SRC }),
    5: Object.freeze({ background: GAME5_VIEW2_SYMBOL_5_BACKGROUND_SRC }),
    6: Object.freeze({ background: GAME5_VIEW2_SYMBOL_6_BACKGROUND_SRC }),
    12: game5View2Symbol(12, GAME5_VIEW2_SYMBOL_12_STATIC_SRC),
    0: game5View2Symbol(0, GAME5_VIEW2_SYMBOL_0_STATIC_SRC),
    8: game5View2Symbol(8, GAME5_VIEW2_SYMBOL_8_STATIC_SRC),
    7: game5View2Symbol(7, GAME5_VIEW2_SYMBOL_7_STATIC_SRC),
    10: game5View2Symbol(10, GAME5_VIEW2_SYMBOL_10_STATIC_SRC),
    11: game5View2Symbol(11, GAME5_VIEW2_SYMBOL_11_STATIC_SRC),
    9: game5View2Symbol(9, GAME5_VIEW2_SYMBOL_9_STATIC_SRC),
  }),
});

const createGameDefinition = ({ id, title, subtitle, assets = sharedPlaceholderAssets }) => Object.freeze({
  id,
  title,
  subtitle,
  status: "ready",
  // Temporary fallback until the real SOAP identifier is supplied.
  soapGameId: "hiranmandi",
  assets,
  colors: getGameColors(id),
});

export const GAME_DEFINITIONS = Object.freeze([
  createGameDefinition({ id: "silk-fruits", title: "Silk Fruits", subtitle: "Classic 5-reel slot" }),
  createGameDefinition({ id: "desert-treasures", title: "Desert Treasures", subtitle: "Bonus hunt adventure" }),
  createGameDefinition({ id: "khiradmandi-makor", title: "Khiradmandi Makor", subtitle: "Coordinate lottery slot" }),
  createGameDefinition({ id: "egypt", title: "Egypt", subtitle: "Table-style slot", assets: GAME4_ASSETS }),
  createGameDefinition({ id: "caravan-spins", title: "Kadima Drevnii", subtitle: "Ancient adventure", assets: GAME5_ASSETS }),
  createGameDefinition({ id: "khocha-afandi", title: "Khocha Afandi", subtitle: "Number draw game", assets: GAME6_ASSETS }),
  createGameDefinition({ id: "star-bazaar", title: "Star Bazaar", subtitle: "Wild multiplier slot" }),
  createGameDefinition({ id: "double-bonus", title: "Double Bonus", subtitle: "Risk ladder feature" }),
]);

const GAME_DEFINITIONS_BY_ID = new Map(GAME_DEFINITIONS.map((game) => [game.id, game]));
export const getGameDefinition = (gameId) => GAME_DEFINITIONS_BY_ID.get(gameId) ?? null;
