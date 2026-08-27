import { Suspense, lazy } from "react";
import StartupLoader from "./components/startupLoader/StartupLoader.jsx";
import { SLOT_CHOOSER_BACKGROUND_SRC } from "./config/gameAssets.js";
import { useSlotApp } from "./hooks/useSlotApp.js";
import { useLanguage } from "./i18n.jsx";

const loadSlotChooser = () => import("./components/slotChooser/SlotChooser.jsx");
const SlotChooser = lazy(loadSlotChooser);
const loadSelectedSlotGame = () => import("./components/selectedSlotGame/SelectedSlotGame.jsx");
const SelectedSlotGame = lazy(loadSelectedSlotGame);

export default function App() {
  const slotApp = useSlotApp({ loadSelectedSlotGame, loadSlotChooser });
  const { t } = useLanguage();
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
      {!isDirectGameRoute && (!slotApp.selectedSlotId || slotApp.pendingSlotId) && (
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
          variant={showChooserLoader ? "brand" : "default"}
          backgroundSrc={showGameLoader ? SLOT_CHOOSER_BACKGROUND_SRC : undefined}
          progress={showChooserLoader ? slotApp.chooserLoadProgress : slotApp.gameLoadProgress}
        />
      )}

      {slotApp.exitConfirmationOpen && (
        <div className="round-exit-dialog-backdrop" role="presentation">
          <section
            className="round-exit-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="round-exit-dialog-title"
          >
            <p id="round-exit-dialog-title">
              {t("unfinishedRoundMessage")}
            </p>
            <div className="round-exit-dialog__actions">
              <button type="button" onClick={slotApp.confirmCloseSlot}>
                {t("goToGames")}
              </button>
              <button
                type="button"
                className="round-exit-dialog__stay"
                onClick={slotApp.cancelCloseSlot}
                autoFocus
              >
                {t("stay")}
              </button>
            </div>
          </section>
        </div>
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



