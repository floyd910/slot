import { Suspense, lazy, useEffect, useState } from "react";
import SlotChooser from "./components/SlotChooser.jsx";
import StartupLoader from "./components/StartupLoader.jsx";

const SelectedSlotGame = lazy(
  () => import("./components/game/SelectedSlotGame.jsx"),
);

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
const preloadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const done = async () => {
      if (settled) return;
      settled = true;
      if (image.decode) {
        try {
          await image.decode();
        } catch {
          // Some browsers reject decode for already-loaded images; paint can continue.
        }
      }
      resolve();
    };

    image.decoding = "async";
    image.fetchPriority = "high";
    image.onload = done;
    image.onerror = done;
    image.src = src;
  });

export default function App() {
  const [chooserAssetsReady, setChooserAssetsReady] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  useEffect(() => {
    let active = true;
    const backgroundAsset = getChooserBackgroundAsset();
    const requiredAssets = [backgroundAsset, ...CHOOSER_TILE_ASSETS];

    Promise.all(requiredAssets.map(preloadImage)).then(() => {
      if (!active) return;
      setChooserAssetsReady(true);
      notifySlotChooserReady();
      Object.values(CHOOSER_BACKGROUND_ASSETS)
        .filter((src) => src !== backgroundAsset)
        .forEach(preloadImage);
    });
    return () => {
      active = false;
    };
  }, []);

  const openSlot = (slot) => {
    if (slot.status !== "ready") return;
    setSelectedSlotId(slot.id);
  };

  if (!chooserAssetsReady) {
    return <StartupLoader ready={false} leaving={false} />;
  }

  return (
    <div className="app-root" data-playing={selectedSlotId ? "true" : "false"}>
      <div className="app-slot-chooser">
        <SlotChooser interactive={!selectedSlotId} onSelectSlot={openSlot} />
      </div>

      {selectedSlotId && (
        <div className="app-selected-game">
          <Suspense fallback={<StartupLoader ready={false} leaving={false} />}>
            <SelectedSlotGame
              key={selectedSlotId}
              slotId={selectedSlotId}
              onBack={() => setSelectedSlotId(null)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
