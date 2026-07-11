import { useEffect, useRef, useState } from "react";
import {
  SLOT_CHOOSER_BACKGROUND_SRC,
  SLOT_CHOOSER_TILE_ASSETS,
} from "../config/gameAssets.js";
import { notifySlotChooserReady } from "../services/frameReadyNotifier.js";
import {
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

const waitForAnimationFrame = () =>
  new Promise((resolve) => window.requestAnimationFrame(resolve));

const waitForMountedImage = async (image) => {
  if (!image.complete || image.naturalWidth === 0) {
    await new Promise((resolve) => {
      const done = () => resolve();
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    });
  }

  if (image.decode) {
    try {
      await image.decode();
    } catch {
      // A loaded browser-cached image can reject a redundant decode request.
    }
  }
};

const waitForControllerReady = () =>
  new Promise((resolve) => {
    const isReady = () =>
      document.querySelector(
        '.app-selected-game .frame-app[data-startup-loading="false"]',
      );

    if (isReady()) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      if (!isReady()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-startup-loading"],
      childList: true,
      subtree: true,
    });
  });

const waitForMountedGamePaint = async () => {
  // Wait until React has committed and the game controller has completed bootstrap.
  await waitForAnimationFrame();
  await waitForControllerReady();
  const mountedImages = Array.from(
    document.querySelectorAll(".app-selected-game img"),
  );
  await Promise.all(mountedImages.map(waitForMountedImage));
  await (document.fonts?.ready ?? Promise.resolve());

  // Give decoded images and completed component layout two stable paint frames.
  await waitForAnimationFrame();
  await waitForAnimationFrame();
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
      // Import the complete game and its CSS first, then discover and preload
      // every referenced asset before switching away from the loader.
      await loadSelectedSlotGame();
      await preloadStartupAssets();
    } catch (assetError) {
      console.error(assetError);
      if (openRequestRef.current === requestId) setPendingSlotId(null);
      return;
    }

    if (openRequestRef.current !== requestId) return;

    // Mount the fully imported game behind the fixed loader first.
    setSelectedSlotId(slot.id);
    await waitForMountedGamePaint();

    if (openRequestRef.current !== requestId) return;
    setPendingSlotId(null);
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