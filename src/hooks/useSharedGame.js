import { useGameController } from "./useGameController.js";

export function useSharedGame(game) {
  const controller = useGameController(game.soapGameId, game);
  return { controller };
}
