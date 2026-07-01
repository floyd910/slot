import { useEffect, useRef, useState } from "react";
import {
  SLOT_CHOOSER_BACKGROUND_SRC,
  SLOT_CHOOSER_TILE_ASSETS,
} from "../config/gameAssets.js";
import { notifySlotChooserReady } from "../services/frameReadyNotifier.js";
import {
  preloadDeferredStartupAssets,
  preloadRequiredImages,
  preloadStartupAssets,
} from "../utils/mediaPreload.js";

const SLOT_CHOOSER_REQUIRED_ASSETS = [
  SLOT_CHOOSER_BACKGROUND_SRC,
  ...SLOT_CHOOSER_TILE_ASSETS,
];

const deferWork = (work) => {
  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(work, { timeout: 1800 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timerId = window.setTimeout(work, 300);
  return () => window.clearTimeout(timerId);
};

const notifyAfterPaint = () => {
  const firstFrame = window.requestAnimationFrame(() => {
    window.requestAnimationFrame(notifySlotChooserReady);
  });
  return () => window.cancelAnimationFrame(firstFrame);
};

export function useSlotApp({ loadSelectedSlotGame }) {
  const [chooserAssetsReady, setChooserAssetsReady] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [pendingSlotId, setPendingSlotId] = useState(null);
  const chooserReadyNotifiedRef = useRef(false);
  const openRequestRef = useRef(0);

  useEffect(() => {
    let active = true;

    preloadRequiredImages(SLOT_CHOOSER_REQUIRED_ASSETS)
      .then(() => {
        if (active) setChooserAssetsReady(true);
      })
      .catch((assetError) => console.error(assetError));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!chooserAssetsReady || chooserReadyNotifiedRef.current) return undefined;
    chooserReadyNotifiedRef.current = true;
    return notifyAfterPaint();
  }, [chooserAssetsReady]);

  useEffect(() => {
    if (!chooserAssetsReady) return undefined;
    return deferWork(() => {
      preloadStartupAssets().catch((assetError) => console.error(assetError));
    });
  }, [chooserAssetsReady]);

  const openSlot = async (slot) => {
    if (slot.status !== "ready" || selectedSlotId || pendingSlotId) return;

    const requestId = openRequestRef.current + 1;
    openRequestRef.current = requestId;
    setPendingSlotId(slot.id);

    try {
      await Promise.all([loadSelectedSlotGame(), preloadStartupAssets()]);
    } catch (assetError) {
      console.error(assetError);
      return;
    }

    if (openRequestRef.current !== requestId) return;
    setSelectedSlotId(slot.id);
    setPendingSlotId(null);
    preloadDeferredStartupAssets().catch((assetError) => console.error(assetError));
  };

  const closeSlot = () => {
    openRequestRef.current += 1;
    setPendingSlotId(null);
    setSelectedSlotId(null);
  };

  return {
    chooserAssetsReady,
    closeSlot,
    isPlaying: Boolean(selectedSlotId),
    openSlot,
    pendingSlotId,
    selectedSlotId,
    slotChooserInteractive: !selectedSlotId && !pendingSlotId,
  };
}