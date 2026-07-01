import { Suspense, lazy, useEffect, useRef, useState } from "react";
import SlotChooser from "./components/SlotChooser.jsx";
import StartupLoader from "./components/StartupLoader.jsx";
import { preloadImage, preloadStartupAssets } from "./utils/mediaPreload.js";

const loadSelectedSlotGame = () => import("./components/game/SelectedSlotGame.jsx");
const SelectedSlotGame = lazy(loadSelectedSlotGame);

const CHOOSER_BACKGROUND_ASSETS = {
  large: "/assets/img/cover.png",
  max1280: "/assets/img/landing-page-1280.png",
};

const CHOOSER_TILE_ASSETS = [
  "/assets/img/xiramandi-makor.png",
  "/assets/img/logo-frame.png",
];

const getChooserBackgroundAsset = () =>
  window.matchMedia?.("(max-width: 1280px)").matches
    ? CHOOSER_BACKGROUND_ASSETS.max1280
    : CHOOSER_BACKGROUND_ASSETS.large;

const notifySlotChooserReady = () => {
  if (window.parent === window) return;

  let targetOrigin = "*";
  try {
    targetOrigin = document.referrer ? new URL(document.referrer).origin : "*";
  } catch {
    targetOrigin = "*";
  }

  window.parent.postMessage(
    {
      source: "hiranmandi-iframe",
      contractVersion: "1.0",
      type: "SLOT_CHOOSER_READY",
      payload: { assetsReady: true },
      meta: {
        timestamp: new Date().toISOString(),
        viewportWidth: window.innerWidth,
      },
    },
    targetOrigin,
  );
};

const preloadChooserImage = (src) =>
  preloadImage(src, {
    decode: true,
    fetchPriority: "high",
    timeoutMs: null,
  });

export default function App() {
  const [chooserAssetsReady, setChooserAssetsReady] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [pendingSlotId, setPendingSlotId] = useState(null);
  const openRequestRef = useRef(0);

  useEffect(() => {
    let active = true;
    const backgroundAsset = getChooserBackgroundAsset();
    const requiredAssets = [backgroundAsset, ...CHOOSER_TILE_ASSETS];

    Promise.all(requiredAssets.map(preloadChooserImage)).then(() => {
      if (!active) return;
      setChooserAssetsReady(true);
      notifySlotChooserReady();
      Object.values(CHOOSER_BACKGROUND_ASSETS)
        .filter((src) => src !== backgroundAsset)
        .forEach(preloadChooserImage);
    });
    return () => {
      active = false;
    };
  }, []);

  const openSlot = async (slot) => {
    if (slot.status !== "ready" || selectedSlotId || pendingSlotId) return;

    const requestId = openRequestRef.current + 1;
    openRequestRef.current = requestId;
    setPendingSlotId(slot.id);

    await loadSelectedSlotGame();
    await preloadStartupAssets();

    if (openRequestRef.current !== requestId) return;
    setSelectedSlotId(slot.id);
    setPendingSlotId(null);
  };

  const closeSlot = () => {
    openRequestRef.current += 1;
    setPendingSlotId(null);
    setSelectedSlotId(null);
  };

  if (!chooserAssetsReady) {
    return <StartupLoader ready={false} leaving={false} />;
  }

  return (
    <div className="app-root" data-playing={selectedSlotId ? "true" : "false"}>
      <div className="app-slot-chooser">
        <SlotChooser
          interactive={!selectedSlotId && !pendingSlotId}
          onSelectSlot={openSlot}
        />
      </div>

      {pendingSlotId && <StartupLoader ready={false} leaving={false} />}

      {selectedSlotId && (
        <div className="app-selected-game">
          <Suspense fallback={<StartupLoader ready={false} leaving={false} />}>
            <SelectedSlotGame
              key={selectedSlotId}
              slotId={selectedSlotId}
              onBack={closeSlot}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
