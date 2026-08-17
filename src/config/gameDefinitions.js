import {
  GAME1_CHOOSER_TILE_SRC,
  GAME1_LOGO_SRC,
  GAME1_COVER_SRC,
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
  GAME6_COVER_SRC,
  GAME6_LOGO_SRC,
  GAME6_VIEW2_CELL_BACKGROUND_ASSETS,
  GAME6_VIEW2_SYMBOL_0_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_7_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_8_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_10_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_11_STATIC_SRC,
  GAME6_VIEW2_SYMBOL_12_STATIC_SRC,
  GAME7_CHOOSER_TILE_SRC,
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
  chooserTile: "/assets/img/chooser/game3.webp",
});

const game2WinFrames = (symbol, frameCount) =>
  Array.from(
    { length: frameCount },
    (_, index) =>
      `/assets/img/animations/game2/${symbol}/frame_${String(index).padStart(3, "0")}_delay-0.04s.webp`,
  );

const game2View2Symbol = (symbol, staticImage) =>
  Object.freeze({
    staticImage,
    animatedImage: "/assets/img/animations/game2/" + symbol + "/win.webp",
  });
const game1WinFrames = (symbol, frameCount) =>
  Array.from(
    { length: frameCount },
    (_, index) =>
      `/assets/img/animations/game1/${symbol}/frame_${String(index).padStart(3, "0")}_delay-0.04s.webp`,
  );

const game7WinFrames = (symbol, skippedFrameIndexes = []) => {
  const skipped = new Set(skippedFrameIndexes);

  return Array.from({ length: 144 }, (_, index) => index)
    .filter((index) => !skipped.has(index))
    .map(
      (index) =>
        `/assets/img/animations/game7/${symbol}/frame_${String(index).padStart(3, "0")}_delay-0.04s.webp`,
    );
};

const game7View2Symbol = (symbol, staticImage) =>
  Object.freeze({
    staticImage,
    animatedImage: "/assets/img/animations/game7/" + symbol + "/win.webp",
  });
const game1View2Symbol = (symbol, staticImage) =>
  Object.freeze({
    staticImage,
    animatedImage: "/assets/img/animations/game1/" + symbol + "/win.avif",
  });
const GAME1_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME1_COVER_SRC,
  logo: GAME1_LOGO_SRC,
  chooserTile: GAME1_CHOOSER_TILE_SRC,
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

const game6WinFrames = (symbol) =>
  Array.from(
    { length: 144 },
    (_, index) =>
      `/assets/img/animations/game6/${symbol}/frame_${String(index).padStart(3, "0")}_delay-0.04s.webp`,
  );

const game6View2Symbol = (symbol, staticImage) =>
  Object.freeze({
    staticImage,
    animatedImage: "/assets/img/animations/game6/" + symbol + "/win.webp",
  });

const GAME6_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME6_COVER_SRC,
  logo: GAME6_LOGO_SRC,
  chooserTile: "/assets/img/chooser/game6.webp",
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
      `/assets/img/animations/game4/${symbol}/frame_${String(index).padStart(3, "0")}_delay-0.04s.webp`,
  );

const game4View2Symbol = (symbol, staticImage) =>
  Object.freeze({
    staticImage,
    animatedImage: "/assets/img/animations/game4/" + symbol + "/win.webp",
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

const GAME7_ASSETS = Object.freeze({
  ...sharedPlaceholderAssets,
  cover: GAME7_COVER_SRC,
  logo: GAME7_LOGO_SRC,
  chooserTile: GAME7_CHOOSER_TILE_SRC,
  view2Info: Object.freeze({
    symbolImageOverrides: Object.freeze({ 10: 8, 11: 8, 12: 9 }),
    hiddenPayoutSymbols: Object.freeze([9]),
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
export const GAME_DEFINITIONS = Object.freeze([
  createGameDefinition({ id: "korvonsaroi-karavan", title: "Korvonsaroi Karavan", subtitle: "Classic 5-reel slot", assets: GAME1_ASSETS }),
  createGameDefinition({ id: "marvorid-djemchug", title: "Marvorid Djemchug", subtitle: "Classic slot", assets: GAME2_ASSETS }),
  createGameDefinition({ id: "khiradmandi-makor", title: "Khiradmandi Makor", subtitle: "Coordinate lottery slot" }),
  createGameDefinition({ id: "egypt", title: "Egypt", subtitle: "Table-style slot", assets: GAME4_ASSETS }),
  createGameDefinition({ id: "kadima-drevnii", title: "Kadima Drevnii", subtitle: "Ancient adventure", assets: GAME5_ASSETS }),
  createGameDefinition({ id: "khocha-afandi", title: "Khocha Afandi", subtitle: "Number draw game", assets: GAME6_ASSETS }),
  createGameDefinition({ id: "babylon", title: "Babylon", subtitle: "Classic slot", assets: GAME7_ASSETS }),
  createGameDefinition({ id: "double-bonus", title: "Double Bonus", subtitle: "Risk ladder feature" }),
]);

const GAME_DEFINITIONS_BY_ID = new Map(GAME_DEFINITIONS.map((game) => [game.id, game]));
export const getGameDefinition = (gameId) => GAME_DEFINITIONS_BY_ID.get(gameId) ?? null;
