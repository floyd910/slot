import {
  GAME1_CHOOSER_TILE_SRC,
  GAME1_LOGO_SRC,
  GAME1_COVER_SRC,
  GAME1_DOUBLE_SCENE_BACKGROUND_SRC,
  GAME1_VIEW1_CELL_AND_VIEW2_SYMBOL_2_BACKGROUND_SRC,
  GAME1_VIEW1_HIGHLIGHT_AND_VIEW2_SYMBOL_5_BACKGROUND_SRC,
  GAME1_VIEW2_SYMBOL_4_BACKGROUND_SRC,
  GAME1_VIEW2_SYMBOL_3_BACKGROUND_SRC,
  GAME1_VIEW2_SYMBOL_6_BACKGROUND_SRC,
  GAME1_VIEW2_SYMBOL_12_STATIC_SRC,
  GAME1_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME1_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME1_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME1_VIEW2_SYMBOL_9_STATIC_SRC,
  GAME1_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME1_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME2_CHOOSER_TILE_SRC,
  GAME2_COVER_SRC,
  GAME2_DOUBLE_SCENE_BACKGROUND_SRC,
  GAME2_LOGO_SRC,
  GAME2_VIEW2_SYMBOL_1_BACKGROUND_SRC,
  GAME2_VIEW2_SYMBOL_4_BACKGROUND_SRC,
  GAME2_VIEW2_SYMBOL_3_BACKGROUND_SRC,
  GAME2_VIEW2_SYMBOL_6_BACKGROUND_SRC,
  GAME2_VIEW2_SYMBOL_12_STATIC_SRC,
  GAME2_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME2_VIEW2_SYMBOL_9_STATIC_SRC,
  GAME2_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME2_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME2_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME2_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME2_VIEW1_CELL_AND_VIEW2_SYMBOL_2_BACKGROUND_SRC,
  GAME2_VIEW1_HIGHLIGHT_AND_VIEW2_SYMBOL_5_BACKGROUND_SRC,
  GAME3_COVER_SRC,
  GAME3_CHOOSER_TILE_SRC,
  GAME3_DOUBLE_SCENE_BACKGROUND_SRC,
  GAME3_LOGO_ORNAMENT_SRC,
  GAME3_LOGO_SRC,
  GAME4_CHOOSER_TILE_SRC,
  GAME4_COVER_SRC,
  GAME4_DOUBLE_SCENE_BACKGROUND_SRC,
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
  GAME5_DOUBLE_SCENE_BACKGROUND_SRC,
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
  GAME6_CHOOSER_TILE_SRC,
  GAME6_COVER_SRC,
  GAME6_DOUBLE_SCENE_BACKGROUND_SRC,
  GAME6_LOGO_SRC,
  GAME6_VIEW2_CELL_BACKGROUND_ASSETS,
  GAME6_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_9_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_12_STATIC_SRC,
  GAME8_CHOOSER_TILE_SRC,
  GAME8_COVER_SRC,
  GAME8_LOGO_SRC,
  GAME8_VIEW2_SYMBOL_1_STATIC_SRC,
  GAME8_VIEW2_SYMBOL_2_STATIC_SRC,
  GAME8_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME8_VIEW2_SYMBOL_3_STATIC_SRC,
  GAME8_VIEW2_SYMBOL_4_STATIC_SRC,
  GAME8_VIEW2_SYMBOL_5_STATIC_SRC,
  GAME8_VIEW2_SYMBOL_6_STATIC_SRC,
  GAME8_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME7_CHOOSER_TILE_SRC,
  GAME7_DOUBLE_SCENE_BACKGROUND_SRC,
  GAME7_COVER_SRC,
  GAME7_LOGO_SRC,
  GAME7_VIEW1_CELL_AND_VIEW2_SYMBOL_2_BACKGROUND_SRC,
  GAME7_VIEW1_HIGHLIGHT_AND_VIEW2_SYMBOL_5_BACKGROUND_SRC,
  GAME7_VIEW2_SYMBOL_1_BACKGROUND_SRC,
  GAME7_VIEW2_SYMBOL_4_BACKGROUND_SRC,
  GAME7_VIEW2_SYMBOL_6_BACKGROUND_SRC,
  GAME7_VIEW2_SYMBOL_3_BACKGROUND_SRC,
  GAME7_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME7_VIEW2_SYMBOL_9_STATIC_SRC,
  GAME7_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME7_VIEW2_SYMBOL_8_STATIC_SRC,
} from "./gameAssets.js";
import { getGameColors } from "./gameColors.js";

const sharedPlaceholderAssets = Object.freeze({
  cover: GAME3_COVER_SRC,
  logo: GAME3_LOGO_SRC,
  logoOrnament: GAME3_LOGO_ORNAMENT_SRC,
  chooserTile: GAME3_CHOOSER_TILE_SRC,
});

const winVideoPoster = (game, symbol) =>
  `/assets/img/video-posters/game${game}/${symbol}-static.webp?v=20261104-border-audit-v3`;

const gameWinVideoSymbol = (game, symbol) => Object.freeze({
  staticImage: winVideoPoster(game, symbol),
  videoBorderCropInset: game === 3 && (symbol === 0 || (symbol >= 7 && symbol <= 12)) ? 10 : 0,
  seamlessVideoPoster: game === 3 && symbol === 12,
  videoSrc: `/assets/video/animations/game${game}/${symbol}-win.webm?v=20261103-gif-source-v1`,
  videoSrcDesktop: `/assets/video/animations/game${game}/${symbol}-win-desktop.webm?v=20261103-gif-source-v1`,
  singlePlayMs: 6040,
});

const GAME3_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  doubleSceneBackground: GAME3_DOUBLE_SCENE_BACKGROUND_SRC,
  view2Symbols: Object.freeze({
    0: gameWinVideoSymbol(3, 0, "/assets/img/view2-symbol-0-static.webp?v=20260711-2"),
    7: gameWinVideoSymbol(3, 7, "/assets/img/view2-symbol-7-static.webp?v=20260711-2"),
    8: gameWinVideoSymbol(3, 8, "/assets/img/view2-symbol-8-static.webp?v=20260711-1"),
    9: gameWinVideoSymbol(3, 9, "/assets/img/view2-symbol-9-static.webp?v=20260711-2"),
    10: gameWinVideoSymbol(3, 10, "/assets/img/view2-symbol-10-static.webp?v=20260711-1"),
    11: gameWinVideoSymbol(3, 11, "/assets/img/view2-symbol-11-static.webp?v=20260711-1"),
    12: gameWinVideoSymbol(3, 12, "/assets/img/view2-symbol-12-static.webp?v=20260711-1"),
  }),
});

const game2View2Symbol = (symbol, staticImage) =>
  gameWinVideoSymbol(2, symbol, staticImage);

const fruitsView2Symbol = (symbol) =>
  Object.freeze({
    staticImage: winVideoPoster(8, symbol),
    artworkBorderInset: 0,
    videoSrc: `/assets/video/animations/game8/${symbol}-win.webm?v=20261103-gif-source-v2`,
    videoSrcDesktop: `/assets/video/animations/game8/${symbol}-win-desktop.webm?v=20261103-gif-source-v2`,
    isDice: false,
    singlePlayMs: 6040,
  });
const game7View2Symbol = (symbol, staticImage) =>
  gameWinVideoSymbol(7, symbol, staticImage);
const game1View2Symbol = (symbol, staticImage) =>
  gameWinVideoSymbol(1, symbol, staticImage);
const GAME1_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME1_COVER_SRC,
  logo: GAME1_LOGO_SRC,
  chooserTile: GAME1_CHOOSER_TILE_SRC,
  doubleSceneBackground: GAME1_DOUBLE_SCENE_BACKGROUND_SRC,
  doubleSceneBackgroundPosition: "50% bottom",
  view2Symbols: Object.freeze({
    2: Object.freeze({
      background: GAME1_VIEW1_CELL_AND_VIEW2_SYMBOL_2_BACKGROUND_SRC,
    }),
    5: Object.freeze({
      background: GAME1_VIEW1_HIGHLIGHT_AND_VIEW2_SYMBOL_5_BACKGROUND_SRC,
    }),
    4: Object.freeze({
      background: GAME1_VIEW2_SYMBOL_4_BACKGROUND_SRC,
    }),
    3: Object.freeze({
      background: GAME1_VIEW2_SYMBOL_3_BACKGROUND_SRC,
    }),
    6: Object.freeze({
      background: GAME1_VIEW2_SYMBOL_6_BACKGROUND_SRC,
    }),
    12: game1View2Symbol(12, GAME1_VIEW2_SYMBOL_12_STATIC_SRC),
    0: game1View2Symbol(0, GAME1_VIEW2_SYMBOL_0_STATIC_SRC),
    10: game1View2Symbol(10, GAME1_VIEW2_SYMBOL_10_STATIC_SRC),
    7: game1View2Symbol(7, GAME1_VIEW2_SYMBOL_7_STATIC_SRC),
    9: game1View2Symbol(9, GAME1_VIEW2_SYMBOL_9_STATIC_SRC),
    8: game1View2Symbol(8, GAME1_VIEW2_SYMBOL_8_STATIC_SRC),
    11: game1View2Symbol(11, GAME1_VIEW2_SYMBOL_11_STATIC_SRC),
  }),
});
const GAME2_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME2_COVER_SRC,
  logo: GAME2_LOGO_SRC,
  chooserTile: GAME2_CHOOSER_TILE_SRC,
  doubleSceneBackground: GAME2_DOUBLE_SCENE_BACKGROUND_SRC,
  doubleSceneBackgroundPosition: "50% bottom",
  view2Symbols: Object.freeze({
    1: Object.freeze({ background: GAME2_VIEW2_SYMBOL_1_BACKGROUND_SRC }),
    2: Object.freeze({ background: GAME2_VIEW1_CELL_AND_VIEW2_SYMBOL_2_BACKGROUND_SRC }),
    4: Object.freeze({ background: GAME2_VIEW2_SYMBOL_4_BACKGROUND_SRC }),
    3: Object.freeze({ background: GAME2_VIEW2_SYMBOL_3_BACKGROUND_SRC }),
    6: Object.freeze({ background: GAME2_VIEW2_SYMBOL_6_BACKGROUND_SRC }),
    12: game2View2Symbol(12, GAME2_VIEW2_SYMBOL_12_STATIC_SRC),
    0: game2View2Symbol(0, GAME2_VIEW2_SYMBOL_0_STATIC_SRC),
    9: game2View2Symbol(9, GAME2_VIEW2_SYMBOL_9_STATIC_SRC),
    10: game2View2Symbol(10, GAME2_VIEW2_SYMBOL_10_STATIC_SRC),
    11: game2View2Symbol(11, GAME2_VIEW2_SYMBOL_11_STATIC_SRC),
    7: game2View2Symbol(7, GAME2_VIEW2_SYMBOL_7_STATIC_SRC),
    8: game2View2Symbol(8, GAME2_VIEW2_SYMBOL_8_STATIC_SRC),
    5: Object.freeze({ background: GAME2_VIEW1_HIGHLIGHT_AND_VIEW2_SYMBOL_5_BACKGROUND_SRC }),
  }),
});

const game6View2Symbol = (symbol) =>
  Object.freeze({
    staticImage: winVideoPoster(6, symbol),
    artworkBorderInset: 0,
    videoSrc: `/assets/video/animations/game6/${symbol}-win.webm?v=20261103-gif-source-v1`,
    videoSrcDesktop: `/assets/video/animations/game6/${symbol}-win-desktop.webm?v=20261103-gif-source-v1`,
    singlePlayMs: 6040,
  });

const GAME6_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME6_COVER_SRC,
  logo: GAME6_LOGO_SRC,
  chooserTile: GAME6_CHOOSER_TILE_SRC,
  doubleSceneBackground: GAME6_DOUBLE_SCENE_BACKGROUND_SRC,
  doubleSceneBackgroundPosition: "50% bottom",
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
    9: game6View2Symbol(9, GAME6_VIEW2_SYMBOL_9_STATIC_SRC),
    10: game6View2Symbol(10, GAME6_VIEW2_SYMBOL_10_STATIC_SRC),
    11: game6View2Symbol(11, GAME6_VIEW2_SYMBOL_11_STATIC_SRC),
    12: game6View2Symbol(12, GAME6_VIEW2_SYMBOL_12_STATIC_SRC),
  }),
});

const game4View2Symbol = (symbol, staticImage) =>
  gameWinVideoSymbol(4, symbol, staticImage);

const GAME4_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME4_COVER_SRC,
  logo: GAME4_LOGO_SRC,
  chooserTile: GAME4_CHOOSER_TILE_SRC,
  doubleSceneBackground: GAME4_DOUBLE_SCENE_BACKGROUND_SRC,
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
  gameWinVideoSymbol(5, symbol, staticImage);

const GAME5_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME5_COVER_SRC,
  logo: GAME5_LOGO_SRC,
  chooserTile: GAME5_CHOOSER_TILE_SRC,
  doubleSceneBackground: GAME5_DOUBLE_SCENE_BACKGROUND_SRC,
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

const GAME7_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME7_COVER_SRC,
  logo: GAME7_LOGO_SRC,
  chooserTile: GAME7_CHOOSER_TILE_SRC,
  doubleSceneBackground: GAME7_DOUBLE_SCENE_BACKGROUND_SRC,
  doubleSceneBackgroundPosition: "50% bottom",
  view2Info: Object.freeze({
    symbolImageOverrides: Object.freeze({ 10: 8, 11: 8, 12: 9 }),
    hiddenSymbolTiles: Object.freeze([8, 11]),
  }),
  view2Symbols: Object.freeze({
    0: game7View2Symbol(0, GAME7_VIEW2_SYMBOL_0_STATIC_SRC),
    9: game7View2Symbol(9, GAME7_VIEW2_SYMBOL_9_STATIC_SRC),
    7: game7View2Symbol(7, GAME7_VIEW2_SYMBOL_7_STATIC_SRC),
    8: game7View2Symbol(8, GAME7_VIEW2_SYMBOL_8_STATIC_SRC),
    1: Object.freeze({ background: GAME7_VIEW2_SYMBOL_1_BACKGROUND_SRC }),
    4: Object.freeze({ background: GAME7_VIEW2_SYMBOL_4_BACKGROUND_SRC }),
    3: Object.freeze({ background: GAME7_VIEW2_SYMBOL_3_BACKGROUND_SRC }),
    6: Object.freeze({ background: GAME7_VIEW2_SYMBOL_6_BACKGROUND_SRC }),
    2: Object.freeze({ background: GAME7_VIEW1_CELL_AND_VIEW2_SYMBOL_2_BACKGROUND_SRC }),
    5: Object.freeze({ background: GAME7_VIEW1_HIGHLIGHT_AND_VIEW2_SYMBOL_5_BACKGROUND_SRC }),
  }),
});

const GAME8_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME8_COVER_SRC,
  logo: GAME8_LOGO_SRC,
  chooserTile: GAME8_CHOOSER_TILE_SRC,
  view2Symbols: Object.freeze({
    0: fruitsView2Symbol(0, GAME8_VIEW2_SYMBOL_0_STATIC_SRC),
    1: fruitsView2Symbol(1, GAME8_VIEW2_SYMBOL_1_STATIC_SRC),
    2: fruitsView2Symbol(2, GAME8_VIEW2_SYMBOL_2_STATIC_SRC),
    3: fruitsView2Symbol(3, GAME8_VIEW2_SYMBOL_3_STATIC_SRC),
    4: fruitsView2Symbol(4, GAME8_VIEW2_SYMBOL_4_STATIC_SRC),
    5: fruitsView2Symbol(5, GAME8_VIEW2_SYMBOL_5_STATIC_SRC),
    6: fruitsView2Symbol(6, GAME8_VIEW2_SYMBOL_6_STATIC_SRC),
    7: fruitsView2Symbol(7, GAME8_VIEW2_SYMBOL_7_STATIC_SRC),
  }),
});
export const GAME_DEFINITIONS = Object.freeze([
  createGameDefinition({ id: "ganchina-sokrovishch", title: "Ганчина-Сокровищ", subtitle: "Classic 5-reel slot", assets: GAME1_ASSETS }),
  createGameDefinition({ id: "marvorid-djemchug", title: "Marvorid Djemchug", subtitle: "Classic slot", assets: GAME2_ASSETS }),
  createGameDefinition({ id: "khiradmandi-makor", title: "Khiradmandi Makor", subtitle: "Coordinate lottery slot", assets: GAME3_ASSETS }),
  createGameDefinition({ id: "egypt", title: "Egypt", subtitle: "Table-style slot", assets: GAME4_ASSETS }),
  createGameDefinition({ id: "kadima-drevnii", title: "Kadima Drevnii", subtitle: "Ancient adventure", assets: GAME5_ASSETS }),
  createGameDefinition({ id: "khocha-afandi", title: "Khocha Afandi", subtitle: "Number draw game", assets: GAME6_ASSETS }),
  createGameDefinition({ id: "babylon", title: "Babylon", subtitle: "Classic slot", assets: GAME7_ASSETS }),
  createGameDefinition({ id: "fruits", title: "Fruits", subtitle: "Classic fruit slot", assets: GAME8_ASSETS }),
  createGameDefinition({ id: "double-bonus", title: "Double Bonus", subtitle: "Risk ladder feature" }),
]);

const GAME_DEFINITIONS_BY_ID = new Map(GAME_DEFINITIONS.map((game) => [game.id, game]));
export const getGameDefinition = (gameId) => GAME_DEFINITIONS_BY_ID.get(gameId) ?? null;
