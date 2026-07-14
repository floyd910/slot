import { Suspense, lazy } from "react";
import SlotChooser from "./components/SlotChooser.jsx";
import StartupLoader from "./components/StartupLoader.jsx";
import { useSlotApp } from "./hooks/useSlotApp.js";

const loadSelectedSlotGame = () => import("./components/game/SelectedSlotGame.jsx");
const SelectedSlotGame = lazy(loadSelectedSlotGame);

export default function App() {
  const slotApp = useSlotApp({ loadSelectedSlotGame });

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

      {slotApp.pendingSlotId && <StartupLoader ready={false} leaving={false} />}

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
