import BottomBar from "../BottomBar.jsx";
import GameBottomArea from "../GameBottomArea.jsx";
import GameMenu from "../GameMenu.jsx";
import Paytable from "../Paytable.jsx";
import RuntimeState from "../RuntimeState.jsx";
import StartupLoader from "../StartupLoader.jsx";
import { GAME_HEADER_SRC, STARTUP_VIDEO_SRC } from "../../config/gameAssets.js";
import { useLanguage } from "../../i18n.jsx";
import FreeSpinsPrompt from "./FreeSpinsPrompt.jsx";
import GameContent from "./GameContent.jsx";

export default function GameShell({ controller }) {
  const { t } = useLanguage();
  const { actions, derived, state } = controller;
  const runtimeState = derived.runtimeStateVisible ? (
    <RuntimeState
      status={state.status}
      error={state.error}
      mode={state.context.mode}
      onRetry={actions.init}
    />
  ) : null;

  return (
    <div
      className={derived.shellClass}
      data-module-mode={state.context.mode}
      data-startup-loading={state.startupLoaderVisible ? "true" : "false"}
    >
      <div className="game_area">
        <img className="header_img" alt="Betproduct.com" src={GAME_HEADER_SRC} />

        <div className="game-main-layout">
          <div className="frame-content">
            <GameContent controller={controller} runtimeState={runtimeState} />
          </div>
          {!runtimeState && (
            <>
              <GameBottomArea
                player={state.player}
                stake={state.stake}
                totalPurchase={derived.totalPurchase}
                selectedCombination={derived.selectedCombination}
                spinResult={state.spinResult}
                revealComplete={state.gridAnimation === "settled"}
              />
              <BottomBar
                spinResult={state.spinResult}
                disabled={derived.isBusy}
                spinDisabled={derived.spinButtonDisabled}
                spinFeedbackActive={state.spinFeedbackActive}
                doubleOfferAvailable={derived.doubleOfferAvailable}
                doublingState={state.doublingState}
                visualMode={state.visualMode}
                isVisualDoubling={derived.isVisualDoubling}
                onCollect={actions.collectWin}
                onPickLeft={() => actions.playFooterDouble("left")}
                onPickRight={() => actions.playFooterDouble("right")}
                autoPlayOn={state.autoPlayOn}
                infoActive={state.showPaytable}
                onIncreaseCombination={() => actions.cycleCombination(1)}
                onIncreaseStake={() => actions.cycleStake(1)}
                onSpin={actions.pressSpinButton}
                onDouble={
                  state.visualMode
                    ? actions.enterVisualDouble
                    : actions.playFooterDouble
                }
                onInfo={actions.loadPaytable}
                onVisualToggle={actions.toggleVisualMode}
                onAutoPlay={actions.toggleAutoPlay}
              />
            </>
          )}
        </div>
        {state.showPaytable && (
          <Paytable
            rows={state.paytableRows}
            loading={state.paytableStatus === "loading"}
            error={
              state.paytableStatus === "error" ? t("paytableLoadError") : ""
            }
            visualMode={state.visualMode}
            stake={state.stake}
            selectedCombination={derived.selectedCombination}
            onClose={() => actions.setShowPaytable(false)}
          />
        )}
        {state.showGameMenu && (
          <GameMenu
            history={state.spinHistory}
            onClose={() => actions.setShowGameMenu(false)}
          />
        )}
        {state.showFreeSpinPrompt && (
          <FreeSpinsPrompt count={state.freeSpinsTotal} />
        )}
        {state.startupLoaderVisible && (
          <StartupLoader
            videoSrc={STARTUP_VIDEO_SRC}
            ready={state.startupAssetsReady}
            leaving={state.startupLoaderLeaving}
          />
        )}
      </div>
    </div>
  );
}

