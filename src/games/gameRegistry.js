import { getGameDefinition } from "../config/gameDefinitions.js";
import SharedGame from "./SharedGame.jsx";

export const getGameRegistration = (slotId) => {
  const game = getGameDefinition(slotId);
  return game ? { Component: SharedGame, game } : null;
};
