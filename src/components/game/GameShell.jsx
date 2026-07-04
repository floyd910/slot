import BottomBar from "../BottomBar.jsx";
import GameBottomArea from "../GameBottomArea.jsx";
import GameMenu from "../GameMenu.jsx";
import Paytable from "../Paytable.jsx";
import RuntimeState from "../RuntimeState.jsx";
import StartupLoader from "../StartupLoader.jsx";
import { GAME3_COVER_SRC } from "../../config/gameAssets.js";
import { useLanguage } from "../../i18n.jsx";
import FreeSpinsPrompt from "./FreeSpinsPrompt.jsx";
import GameContent from "./GameContent.jsx";

export default function GameShell({ controller, onBackToSlots }) {
  const { isLanguageChanging, t } = useLanguage();
  const { actions, derived, state } = controller;
  const showStartupLoader = state.startupLoaderVisible && !isLanguageChanging;
  const runtimeState =
    derived.runtimeStateVisible && !isLanguageChanging && !showStartupLoader ? (
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
      data-startup-loading={showStartupLoader ? "true" : "false"}
    >
      <div className="game_area">
        <img
          className="game_area__background"
          src={GAME3_COVER_SRC}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          draggable={false}
        />
        <div className="bg-overlay"></div>
        <div className="header_img"></div>

        <div className="game-main-layout">
          <div className="frame-content">
            <GameContent controller={controller} runtimeState={runtimeState} />
          </div>
          {!runtimeState && (
            <>
              {/* <GameBottomArea
                player={state.player}
                stake={state.stake}
                selectedCombination={derived.selectedCombination}
                spinResult={state.spinResult}
                revealComplete={state.gridAnimation === "settled"}
              /> */}
              <BottomBar
                player={state.player}
                stake={state.stake}
                selectedCombination={derived.selectedCombination}
                totalPurchase={derived.totalPurchase}
                spinResult={state.spinResult}
                revealComplete={state.gridAnimation === "settled"}
                disabled={derived.isBusy}
                spinDisabled={derived.spinButtonDisabled}
                spinFeedbackActive={state.spinFeedbackActive}
                doubleOfferAvailable={derived.doubleOfferAvailable}
                doublingState={state.doublingState}
                visualMode={state.visualMode}
                viewSwitchDisabled={derived.viewSwitchDisabled}
                paytableControlsLocked={derived.paytableControlsLocked}
                isVisualDoubling={derived.isVisualDoubling}
                onCollect={actions.collectWin}
                onPickLeft={() => actions.playFooterDouble("left")}
                onPickRight={() => actions.playFooterDouble("right")}
                autoPlayOn={state.autoPlayOn}
                infoActive={state.showPaytable}
                onIncreaseCombination={() => actions.cycleCombination(1)}
                onDecreaseCombination={() => actions.cycleCombination(-1)}
                onIncreaseStake={() => actions.cycleStake(1)}
                onDecreaseStake={() => actions.cycleStake(-1)}
                onSpin={actions.pressSpinButton}
                onDouble={
                  state.visualMode
                    ? actions.enterVisualDouble
                    : actions.playFooterDouble
                }
                onInfo={actions.loadPaytable}
                onVisualToggle={actions.toggleVisualMode}
                onAutoPlay={actions.toggleAutoPlay}
                onMenu={onBackToSlots}
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
        {showStartupLoader && (
          <StartupLoader
            ready={state.startupAssetsReady}
            leaving={state.startupLoaderLeaving}
          />
        )}
      </div>
    </div>
  );
}
