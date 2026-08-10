import { Suspense, lazy } from "react";
import SlotChooser from "./components/SlotChooser.jsx";
import StartupLoader from "./components/StartupLoader.jsx";
import { useSlotApp } from "./hooks/useSlotApp.js";

const loadSelectedSlotGame = () => import("./components/game/SelectedSlotGame.jsx");
const SelectedSlotGame = lazy(loadSelectedSlotGame);

export default function App() {
  const slotApp = useSlotApp({ loadSelectedSlotGame });
  const query = new URLSearchParams(window.location.search);
  const isDirectGameRoute =
    /^#\/games\/[^/?#]+$/.test(window.location.hash) ||
    ["gameId", "game", "gameName", "selectedGame", "slotId", "slot"].some(
      (key) => Boolean(query.get(key)),
    );

  const showChooserLoader =
    !slotApp.chooserAssetsReady && !isDirectGameRoute && !slotApp.selectedSlotId;

  return (
    <div className="app-root" data-playing={slotApp.isPlaying ? "true" : "false"}>
      {(!slotApp.selectedSlotId || slotApp.pendingSlotId) && (
        <div className="app-slot-chooser">
          <SlotChooser
            interactive={
              slotApp.slotChooserInteractive && slotApp.chooserAssetsReady
            }
            onSelectSlot={slotApp.openSlot}
          />
        </div>
      )}

      {showChooserLoader && (
        <StartupLoader
          ready={false}
          leaving={false}
          variant="brand"
          progress={slotApp.chooserLoadProgress}
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



