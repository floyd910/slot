import { useEffect, useRef, useState } from "react";
import {
  SLOT_CHOOSER_BACKGROUND_SRC,
  SLOT_CHOOSER_TILE_ASSETS,
  getGameFirstPaintAssets,
  SHARED_FIRST_PAINT_ASSETS,
} from "../config/gameAssets.js";
import { GAME_DEFINITIONS } from "../config/gameDefinitions.js";
import { notifySlotChooserReady } from "../services/frameReadyNotifier.js";
import {
  getRequiredGameMainScreenAssets,
  preloadGameAssets,
  preloadRequiredImages,
  scheduleDeferredStartupAssets,
} from "../utils/mediaPreload.js";

const SLOT_CHOOSER_REQUIRED_ASSETS = [
  SLOT_CHOOSER_BACKGROUND_SRC,
  ...SLOT_CHOOSER_TILE_ASSETS,
  ...GAME_DEFINITIONS.map((game) => game.assets.chooserTile),
  // Only chooser and shared main-screen UI assets load before chooser mount.
  ...SHARED_FIRST_PAINT_ASSETS,
];


const waitForAnimationFrame = () =>
  new Promise((resolve) => window.requestAnimationFrame(resolve));

const MOUNTED_IMAGE_WAIT_MS = 8000;
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

const waitForMountedImage = async (image) => {
  if (!image.complete || image.naturalWidth === 0) {
    await new Promise((resolve) => {
      const timeoutId = window.setTimeout(resolve, MOUNTED_IMAGE_WAIT_MS);
      const done = () => {
        window.clearTimeout(timeoutId);
        resolve();
      };
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    });
  }

  if (image.decode) {
    try {
      await Promise.race([
        image.decode(),
        new Promise((resolve) =>
          window.setTimeout(resolve, MOUNTED_IMAGE_WAIT_MS),
        ),
      ]);
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

const waitForMountedGamePaint = async (game, onProgress) => {
  // Wait until React has committed and the game controller has completed bootstrap.
  await waitForAnimationFrame();
  onProgress?.(85);
  await waitForControllerReady();
  onProgress?.(92);
  const mountedImages = Array.from(
    document.querySelectorAll(".app-selected-game img"),
  );
  // Grid skins are CSS backgrounds, not img elements. Re-decode the exact
  // first-screen manifest after the game DOM has mounted before hiding loader.
  await Promise.all([
    ...mountedImages.map(waitForMountedImage),
    preloadRequiredImages(getGameFirstPaintAssets(game)),
  ]);
  await (document.fonts?.ready ?? Promise.resolve());
  onProgress?.(98);

  // Give decoded images and completed component layout two stable paint frames.
  await waitForAnimationFrame();
  await waitForAnimationFrame();
  onProgress?.(100);
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
  const returningToChooserRef = useRef(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      // Decode every chooser card/background image while the initial loader is up.
      preloadRequiredImages(SLOT_CHOOSER_REQUIRED_ASSETS, setChooserLoadProgress),
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
    if (!chooserAssetsReady || chooserReadyNotifiedRef.current) return undefined;
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
      // Fetch game JSX and the explicit main-screen image manifest together.
      // Neither is allowed to mount/show until both have completed.
      await Promise.all([
        loadSelectedSlotGame(),
        preloadGameAssets(slot, (progress) =>
          setGameLoadProgress(Math.floor(progress * 0.9)),
        ),
      ]);
      await preloadRequiredImages(getRequiredGameMainScreenAssets(slot));
      if (openRequestRef.current !== requestId) return;

      setGameLoadProgress(92);
      setSelectedSlotId(slot.id);
      // Main-screen assets are ready; begin low-priority loading for optional
      // screens as soon as the game mounts.
      scheduleDeferredStartupAssets(slot);
    } catch (assetError) {
      console.error(assetError);
      if (openRequestRef.current === requestId) setPendingSlotId(null);
      return;
    }

    if (openRequestRef.current !== requestId) return;

    await waitForMountedGamePaint(slot, setGameLoadProgress);

    if (openRequestRef.current !== requestId) return;
    setPendingSlotId(null);
  };

  const closeSlot = async () => {
    // The chooser is unmounted while a game is active. Keep the game visible
    // until each chooser image has been decoded again, so returning never
    // reveals an empty grid followed by delayed logos.
    if (returningToChooserRef.current) return;
    returningToChooserRef.current = true;
    const requestId = openRequestRef.current + 1;
    openRequestRef.current = requestId;
    setHashRoute(SLOT_CHOOSER_ROUTE);
    setPendingSlotId(null);

    try {
      await preloadRequiredImages(SLOT_CHOOSER_REQUIRED_ASSETS);
      await waitForAnimationFrame();
      await waitForAnimationFrame();
      if (openRequestRef.current !== requestId) return;
      setSelectedSlotId(null);
    } finally {
      if (openRequestRef.current === requestId) {
        returningToChooserRef.current = false;
      }
    }
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


