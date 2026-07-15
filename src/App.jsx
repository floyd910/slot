import { Suspense, lazy, useEffect, useState } from "react";
import SlotChooser from "./components/SlotChooser.jsx";
import StartupLoader from "./components/StartupLoader.jsx";
import { useSlotApp } from "./hooks/useSlotApp.js";

const loadSelectedSlotGame = () => import("./components/game/SelectedSlotGame.jsx");
const SelectedSlotGame = lazy(loadSelectedSlotGame);

const STARTUP_FILL_DURATION_MS = 360;
const STARTUP_FADE_DURATION_MS = 460;

export default function App() {
  const slotApp = useSlotApp({ loadSelectedSlotGame });
  const [showInitialLoader, setShowInitialLoader] = useState(true);
  const [initialLoaderLeaving, setInitialLoaderLeaving] = useState(false);
  const [showGameLoader, setShowGameLoader] = useState(false);
  const [gameLoaderReady, setGameLoaderReady] = useState(false);
  const [gameLoaderLeaving, setGameLoaderLeaving] = useState(false);

  useEffect(() => {
    if (!slotApp.chooserAssetsReady) return undefined;

    const fillTimer = window.setTimeout(() => {
      setInitialLoaderLeaving(true);
    }, STARTUP_FILL_DURATION_MS);

    const hideTimer = window.setTimeout(() => {
      setShowInitialLoader(false);
    }, STARTUP_FILL_DURATION_MS + STARTUP_FADE_DURATION_MS);

    return () => {
      window.clearTimeout(fillTimer);
      window.clearTimeout(hideTimer);
    };
  }, [slotApp.chooserAssetsReady]);

  useEffect(() => {
    if (slotApp.pendingSlotId) {
      setShowGameLoader(true);
      setGameLoaderReady(false);
      setGameLoaderLeaving(false);
      return undefined;
    }

    if (!showGameLoader) return undefined;

    if (!slotApp.selectedSlotId) {
      setShowGameLoader(false);
      return undefined;
    }

    setGameLoaderReady(true);

    const fillTimer = window.setTimeout(() => {
      setGameLoaderLeaving(true);
    }, STARTUP_FILL_DURATION_MS);

    const hideTimer = window.setTimeout(() => {
      setShowGameLoader(false);
    }, STARTUP_FILL_DURATION_MS + STARTUP_FADE_DURATION_MS);

    return () => {
      window.clearTimeout(fillTimer);
      window.clearTimeout(hideTimer);
    };
  }, [showGameLoader, slotApp.pendingSlotId, slotApp.selectedSlotId]);

  if (!slotApp.chooserAssetsReady) {
    return <StartupLoader ready={false} leaving={false} variant="brand" />;
  }

  return (
    <div className="app-root" data-playing={slotApp.isPlaying ? "true" : "false"}>
      <div className="app-slot-chooser">
        <SlotChooser
          interactive={slotApp.slotChooserInteractive}
          onSelectSlot={slotApp.openSlot}
        />
      </div>

      {showInitialLoader && (
        <StartupLoader
          ready={true}
          leaving={initialLoaderLeaving}
          variant="brand"
        />
      )}

      {showGameLoader && (
        <StartupLoader
          ready={gameLoaderReady}
          leaving={gameLoaderLeaving}
        />
      )}

      {slotApp.selectedSlotId && (
        <div className="app-selected-game">
          <Suspense fallback={<StartupLoader ready={false} leaving={false} />}>
            <SelectedSlotGame
              key={slotApp.selectedSlotId}
              slotId={slotApp.selectedSlotId}
              onBack={slotApp.closeSlot}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}



