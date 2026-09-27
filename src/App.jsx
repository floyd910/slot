import { SLOT_CHOOSER_BACKGROUND_SRC } from "./config/gameAssets.js";
import { Suspense, lazy } from "react";
import StartupLoader from "./components/startupLoader/StartupLoader.jsx";
import { useSlotApp } from "./hooks/useSlotApp.js";

const loadSlotChooser = () => import("./components/slotChooser/SlotChooser.jsx");
const SlotChooser = lazy(loadSlotChooser);
const loadSelectedSlotGame = () => import("./components/selectedSlotGame/SelectedSlotGame.jsx");
const SelectedSlotGame = lazy(loadSelectedSlotGame);

export default function App() {
  const slotApp = useSlotApp({ loadSelectedSlotGame, loadSlotChooser });
  const query = new URLSearchParams(window.location.search);
  const isDirectGameRoute =
    /^#\/games\/[^/?#]+$/.test(window.location.hash) ||
    ["gameId", "game", "gameName", "selectedGame", "slotId", "slot"].some(
      (key) => Boolean(query.get(key)),
    );

  const showChooserLoader =
    !slotApp.chooserAssetsReady && !isDirectGameRoute && !slotApp.selectedSlotId;
  const showGameLoader = Boolean(
    slotApp.pendingSlotId,
  );

  return (
    <div className="app-root" data-playing={slotApp.isPlaying ? "true" : "false"}>
      {slotApp.chooserAssetsReady && (
        <div className="app-slot-chooser">
          <Suspense fallback={null}>
            <SlotChooser
            interactive={
              slotApp.slotChooserInteractive && slotApp.chooserAssetsReady
            }
              activeRounds={slotApp.activeRounds}
              onSelectSlot={slotApp.openSlot}
            />
          </Suspense>
        </div>
      )}

      {(showChooserLoader || showGameLoader) && (
        <StartupLoader
          ready={false}
          leaving={false}
          variant="brand"
          backgroundSrc={showGameLoader ? SLOT_CHOOSER_BACKGROUND_SRC : undefined}
          progress={showChooserLoader ? slotApp.chooserLoadProgress : slotApp.gameLoadProgress}
        />
      )}

      {slotApp.selectedSlotId && (
        <div className="app-selected-game">
          <Suspense fallback={null}>
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



