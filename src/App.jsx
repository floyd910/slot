import { Suspense, lazy, useEffect, useRef, useState } from "react";
import SlotChooser from "./components/SlotChooser.jsx";
import StartupLoader from "./components/StartupLoader.jsx";
import {
  SLOT_CHOOSER_BACKGROUND_SRC,
  SLOT_CHOOSER_TILE_ASSETS,
} from "./config/gameAssets.js";
import {
  preloadRequiredImages,
  preloadStartupAssets,
} from "./utils/mediaPreload.js";

const loadSelectedSlotGame = () => import("./components/game/SelectedSlotGame.jsx");
const SelectedSlotGame = lazy(loadSelectedSlotGame);

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

export default function App() {
  const [chooserAssetsReady, setChooserAssetsReady] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [pendingSlotId, setPendingSlotId] = useState(null);
  const chooserReadyNotifiedRef = useRef(false);
  const openRequestRef = useRef(0);

  useEffect(() => {
    let active = true;
    const requiredAssets = [SLOT_CHOOSER_BACKGROUND_SRC, ...SLOT_CHOOSER_TILE_ASSETS];

    preloadRequiredImages(requiredAssets)
      .then(() => {
        if (!active) return;
        setChooserAssetsReady(true);
      })
      .catch((assetError) => {
        console.error(assetError);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!chooserAssetsReady || chooserReadyNotifiedRef.current) return;
    chooserReadyNotifiedRef.current = true;
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(notifySlotChooserReady);
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [chooserAssetsReady]);

  const openSlot = async (slot) => {
    if (slot.status !== "ready" || selectedSlotId || pendingSlotId) return;

    const requestId = openRequestRef.current + 1;
    openRequestRef.current = requestId;
    setPendingSlotId(slot.id);

    try {
      await loadSelectedSlotGame();
      await preloadStartupAssets();
    } catch (assetError) {
      console.error(assetError);
      return;
    }

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