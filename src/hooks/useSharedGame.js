import { useCallback } from "react";
import { preloadGameAssets } from "../utils/mediaPreload.js";
import { useAssetGate } from "./useAssetGate.js";
import { useGameController } from "./useGameController.js";

export function useSharedGame(game) {
  const loadAssets = useCallback(() => preloadGameAssets(game), [game]);
  const assetsReady = useAssetGate(loadAssets);
  const controller = useGameController(game.soapGameId, game);
  return { assetsReady, controller };
}

