import { Suspense, lazy } from "react";
import StartupLoader from "./components/startupLoader/StartupLoader.jsx";
<<<<<<< HEAD
import { SLOT_CHOOSER_BACKGROUND_SRC } from "./config/gameAssets.js";
=======
import { GAME3_COVER_SRC } from "./config/gameAssets.js";
>>>>>>> 1e669f63d5d3d2f3b27cd7ca954f960969dcc235
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
<<<<<<< HEAD
  const showGameLoader = Boolean(
    slotApp.pendingSlotId,
=======
  const showSelectionLoader = Boolean(
    slotApp.pendingSlotId && !slotApp.selectedSlotId,
>>>>>>> 1e669f63d5d3d2f3b27cd7ca954f960969dcc235
  );

  return (
    <div className="app-root" data-playing={slotApp.isPlaying ? "true" : "false"}>
      {slotApp.chooserAssetsReady && (!slotApp.selectedSlotId || slotApp.pendingSlotId) && (
        <div className="app-slot-chooser">
          <Suspense fallback={null}>
            <SlotChooser
            interactive={
              slotApp.slotChooserInteractive && slotApp.chooserAssetsReady
            }
              onSelectSlot={slotApp.openSlot}
            />
          </Suspense>
        </div>
      )}

<<<<<<< HEAD
      {(showChooserLoader || showGameLoader) && (
=======
      {(showChooserLoader || showSelectionLoader) && (
>>>>>>> 1e669f63d5d3d2f3b27cd7ca954f960969dcc235
        <StartupLoader
          ready={false}
          leaving={false}
          variant={showChooserLoader ? "brand" : "default"}
<<<<<<< HEAD
          backgroundSrc={showGameLoader ? SLOT_CHOOSER_BACKGROUND_SRC : undefined}
          progress={showChooserLoader ? slotApp.chooserLoadProgress : slotApp.gameLoadProgress}
=======
          backgroundSrc={showSelectionLoader ? GAME3_COVER_SRC : undefined}
          progress={showChooserLoader ? slotApp.chooserLoadProgress : undefined}
>>>>>>> 1e669f63d5d3d2f3b27cd7ca954f960969dcc235
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



