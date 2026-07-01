import { useCallback } from "react";
import { preloadStartupAssets } from "../utils/mediaPreload.js";
import { useAssetGate } from "./useAssetGate.js";
import { useGameController } from "./useGameController.js";

export function useGame3(slotId) {
  const loadAssets = useCallback(() => preloadStartupAssets(), []);
  const assetsReady = useAssetGate(loadAssets);
  const controller = useGameController(slotId);

  return { assetsReady, controller };
}