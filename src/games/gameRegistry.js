import Game3 from "./game3/Game3.jsx";

const GAME_COMPONENTS = {
  game3: Game3,
  hiranmandi: Game3,
};

export const getGameComponent = (slotId) => GAME_COMPONENTS[slotId] ?? null;