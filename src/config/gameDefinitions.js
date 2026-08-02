import {
  GAME3_COVER_SRC,
  GAME3_LOGO_ORNAMENT_SRC,
  GAME3_LOGO_SRC,
} from "./gameAssets.js";
import { getGameColors } from "./gameColors.js";

const sharedPlaceholderAssets = Object.freeze({
  cover: GAME3_COVER_SRC,
  logo: GAME3_LOGO_SRC,
  logoOrnament: GAME3_LOGO_ORNAMENT_SRC,
  chooserTile: "/assets/img/xiramandi-makor.webp",
});

const createGameDefinition = ({ id, title, subtitle }) => Object.freeze({
  id,
  title,
  subtitle,
  status: "ready",
  // Temporary fallback until the real SOAP identifier is supplied.
  soapGameId: "hiranmandi",
  assets: sharedPlaceholderAssets,
  colors: getGameColors(id),
});

export const GAME_DEFINITIONS = Object.freeze([
  createGameDefinition({ id: "silk-fruits", title: "Silk Fruits", subtitle: "Classic 5-reel slot" }),
  createGameDefinition({ id: "desert-treasures", title: "Desert Treasures", subtitle: "Bonus hunt adventure" }),
  createGameDefinition({ id: "hiranmandi", title: "Hiranmandi Hushhol", subtitle: "Coordinate lottery slot" }),
  createGameDefinition({ id: "golden-dice", title: "Golden Dice", subtitle: "Table-style slot" }),
  createGameDefinition({ id: "caravan-spins", title: "Caravan Spins", subtitle: "Travel reels" }),
  createGameDefinition({ id: "royal-keno", title: "Royal Keno", subtitle: "Number draw game" }),
  createGameDefinition({ id: "star-bazaar", title: "Star Bazaar", subtitle: "Wild multiplier slot" }),
  createGameDefinition({ id: "double-bonus", title: "Double Bonus", subtitle: "Risk ladder feature" }),
]);

const GAME_DEFINITIONS_BY_ID = new Map(GAME_DEFINITIONS.map((game) => [game.id, game]));
export const getGameDefinition = (gameId) => GAME_DEFINITIONS_BY_ID.get(gameId) ?? null;
