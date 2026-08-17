import { useEffect, useRef, useState } from "react";
import {
  SLOT_CHOOSER_BACKGROUND_SRC,
  SLOT_CHOOSER_TILE_ASSETS,
} from "../config/gameAssets.js";
import { GAME_DEFINITIONS } from "../config/gameDefinitions.js";
import { notifySlotChooserReady } from "../services/frameReadyNotifier.js";
import {
  preloadGameAssets,
  preloadRequiredImages,
  scheduleDeferredStartupAssets,
} from "../utils/mediaPreload.js";

const SLOT_CHOOSER_REQUIRED_ASSETS = [
  SLOT_CHOOSER_BACKGROUND_SRC,
  ...SLOT_CHOOSER_TILE_ASSETS,
  ...GAME_DEFINITIONS.map((game) => game.assets.chooserTile),
];

const waitForAnimationFrame = () =>
  new Promise((resolve) => window.requestAnimationFrame(resolve));

const SLOT_CHOOSER_ROUTE = "/slots";
const readHashGameId = () => {
  const match = window.location.hash.match(/^#\/games\/([^/?#]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
};

const readInitialGameId = () => {
  const query = new URLSearchParams(window.location.search);
  return (
    readHashGameId() ??
    query.get("gameId") ??
    query.get("game") ??
    query.get("gameName") ??
    query.get("selectedGame") ??
    query.get("slotId") ??
    query.get("slot") ??
    null
  );
};

const getInitialSlotId = () => {
  const gameId = readInitialGameId();
  return GAME_DEFINITIONS.some((game) => game.id === gameId) ? gameId : null;
};

const setHashRoute = (route) => {
  const nextHash = `#${route}`;
  if (window.location.hash !== nextHash) window.location.hash = nextHash;
};

const waitForControllerReady = () =>
  new Promise((resolve) => {
    const selector =
      '.app-selected-game .frame-app[data-startup-loading="false"]';
    if (document.querySelector(selector)) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) return;
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
  // At this point every loader-required asset, font, and module is ready.
  // Keep the overlay only for React's final mount and layout/paint frames.
  await waitForAnimationFrame();
  await waitForAnimationFrame();
};

const notifyAfterPaint = () => {
  const firstFrame = window.requestAnimationFrame(() => {
    window.requestAnimationFrame(notifySlotChooserReady);
  });
  return () => window.cancelAnimationFrame(firstFrame);
};

export function useSlotApp({ loadSelectedSlotGame, loadSlotChooser }) {
  const [chooserAssetsReady, setChooserAssetsReady] = useState(false);
  const [chooserLoadProgress, setChooserLoadProgress] = useState(0);
  const [gameLoadProgress, setGameLoadProgress] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState(getInitialSlotId);
  const [pendingSlotId, setPendingSlotId] = useState(null);
  const chooserReadyNotifiedRef = useRef(false);
  const initialRouteSlotIdRef = useRef(getInitialSlotId());
  const openRequestRef = useRef(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      // Decode every chooser card/background image while the initial loader is up.
      preloadRequiredImages(
        SLOT_CHOOSER_REQUIRED_ASSETS,
        setChooserLoadProgress,
      ),
      // Load the chooser JSX and its CSS before its first render.
      loadSlotChooser(),
      // Cache the lazy game screen module before any card can be selected.
      loadSelectedSlotGame(),
    ])
      .then(async () => {
        // The lazy component stylesheet is now installed and every chooser
        // image/background has decoded. Give the browser a stable paint frame
        // before allowing the chooser to mount.
        await waitForAnimationFrame();
        await waitForAnimationFrame();
        if (!active) return;
        setChooserAssetsReady(true);
      })
      .catch((assetError) => console.error(assetError));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!chooserAssetsReady || chooserReadyNotifiedRef.current)
      return undefined;
    chooserReadyNotifiedRef.current = true;
    return notifyAfterPaint();
  }, [chooserAssetsReady]);
  const openSlot = async (slot) => {
    if (slot.status !== "ready" || selectedSlotId || pendingSlotId) return;

    setHashRoute(`/games/${encodeURIComponent(slot.id)}`);

    const requestId = openRequestRef.current + 1;
    openRequestRef.current = requestId;
    setGameLoadProgress(0);
    setPendingSlotId(slot.id);

    try {
      // Keep the chooser background loader visible while the selected game's
      // code and first screen assets load together.
      await Promise.all([
        loadSelectedSlotGame(),
        preloadGameAssets(slot, setGameLoadProgress),
      ]);
      if (openRequestRef.current !== requestId) return;
      // Mount the game while progress remains below 100. Its controller and
      // first layout must be complete before the loader can truthfully finish.
      setSelectedSlotId(slot.id);
      await waitForControllerReady();
      if (openRequestRef.current !== requestId) return;
      setGameLoadProgress(100);
    } catch (assetError) {
      console.error(assetError);
      if (openRequestRef.current === requestId) setPendingSlotId(null);
      return;
    }

    if (openRequestRef.current !== requestId) return;

    await waitForMountedGamePaint();

    if (openRequestRef.current !== requestId) return;
    setPendingSlotId(null);
    // Optional View 2/media assets must never compete with the final loader
    // paint. Begin them only after the game is already visible.
    scheduleDeferredStartupAssets(slot);
  };

  const closeSlot = () => {
    setHashRoute(SLOT_CHOOSER_ROUTE);
    openRequestRef.current += 1;
    setPendingSlotId(null);
    setSelectedSlotId(null);
  };

  useEffect(() => {
    const applyHashRoute = () => {
      const gameId = readHashGameId();
      if (!gameId) {
        if (window.location.hash !== `#${SLOT_CHOOSER_ROUTE}`) {
          window.history.replaceState(
            window.history.state,
            "",
            `${window.location.pathname}${window.location.search}#${SLOT_CHOOSER_ROUTE}`,
          );
        }
        if (selectedSlotId || pendingSlotId) closeSlot();
        return;
      }

      const slot = GAME_DEFINITIONS.find((game) => game.id === gameId);
      if (!slot) {
        setHashRoute(SLOT_CHOOSER_ROUTE);
        return;
      }
      if (selectedSlotId === gameId || pendingSlotId === gameId) return;
      if (selectedSlotId || pendingSlotId) {
        openRequestRef.current += 1;
        setPendingSlotId(null);
        setSelectedSlotId(null);
        return;
      }
      if (chooserAssetsReady) openSlot(slot);
    };

    applyHashRoute();
    window.addEventListener("hashchange", applyHashRoute);
    return () => window.removeEventListener("hashchange", applyHashRoute);
  }, [chooserAssetsReady, pendingSlotId, selectedSlotId]);
  return {
    chooserAssetsReady,
    chooserLoadProgress,
    closeSlot,
    gameLoadProgress,
    isPlaying: Boolean(selectedSlotId),
    openSlot,
    pendingSlotId,
    selectedSlotId,
    slotChooserInteractive: !selectedSlotId && !pendingSlotId,
  };
}
