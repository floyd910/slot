import {
  GAME3_COVER_SRC,
  GAME3_LOGO_ORNAMENT_SRC,
  GAME3_LOGO_SRC,
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
    0: game6View2Symbol(0, GAME6_VIEW2_SYMBOL_0_STATIC_SRC),
    7: game6View2Symbol(7, GAME6_VIEW2_SYMBOL_7_STATIC_SRC),
    8: game6View2Symbol(8, GAME6_VIEW2_SYMBOL_8_STATIC_SRC),
    9: game6View2Symbol(9, game6WinFrames(9)[0]),
    10: game6View2Symbol(10, GAME6_VIEW2_SYMBOL_10_STATIC_SRC),
    11: game6View2Symbol(11, GAME6_VIEW2_SYMBOL_11_STATIC_SRC),
    12: game6View2Symbol(12, GAME6_VIEW2_SYMBOL_12_STATIC_SRC),
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
  createGameDefinition({ id: "hiranmandi", title: "Hiranmandi Hushhol", subtitle: "Coordinate lottery slot" }),
  createGameDefinition({ id: "golden-dice", title: "Golden Dice", subtitle: "Table-style slot" }),
  createGameDefinition({ id: "caravan-spins", title: "Caravan Spins", subtitle: "Travel reels" }),
  createGameDefinition({ id: "khocha-afandi", title: "Khocha Afandi", subtitle: "Number draw game", assets: GAME6_ASSETS }),
  createGameDefinition({ id: "star-bazaar", title: "Star Bazaar", subtitle: "Wild multiplier slot" }),
  createGameDefinition({ id: "double-bonus", title: "Double Bonus", subtitle: "Risk ladder feature" }),
]);

const GAME_DEFINITIONS_BY_ID = new Map(GAME_DEFINITIONS.map((game) => [game.id, game]));
export const getGameDefinition = (gameId) => GAME_DEFINITIONS_BY_ID.get(gameId) ?? null;
