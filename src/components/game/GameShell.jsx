import BottomBar from "../BottomBar.jsx";
import GameBottomArea from "../GameBottomArea.jsx";
import GameMenu from "../GameMenu.jsx";
import Paytable from "../Paytable.jsx";
import RuntimeState from "../RuntimeState.jsx";
import StartupLoader from "../StartupLoader.jsx";
import View2Paytable from "../View2Paytable.jsx";
import { GAME3_COVER_SRC } from "../../config/gameAssets.js";
import { useLanguage } from "../../i18n.jsx";
import { buildStandardPaytableViewModel } from "../../viewModels/paytableViewModel.js";
import FreeSpinsPrompt from "./FreeSpinsPrompt.jsx";
import GameContent from "./GameContent.jsx";

export default function GameShell({ controller, onBackToSlots }) {
  const { isLanguageChanging, language, t } = useLanguage();
  const { actions, derived, state } = controller;
  const showStartupLoader = state.startupLoaderVisible && !isLanguageChanging;
  const showInlineView2Paytable = state.showPaytable && state.visualMode;
  const paytableView = buildStandardPaytableViewModel({
    stake: state.stake,
    selectedCombination: derived.selectedCombination,
  });
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
      <div
        className="game_area"
        data-view2-info={showInlineView2Paytable ? "true" : "false"}
      >
        <img
          className="game_area__background"
          src={GAME3_COVER_SRC}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchpriority="high"
          draggable={false}
        />
        <div className="bg-overlay"></div>
        <div className="header_img"></div>

        {showInlineView2Paytable ? (
          <section className="view2-info-inline" aria-label="View 2 payouts">
            <div className="view2-info-inline__close-wrap">
              <button
                className="info-modal__close view2-info-inline__close"
                onClick={() => actions.setShowPaytable(false)}
                type="button"
                aria-label="Close info"
              >
                X
              </button>
            </div>
            {state.paytableStatus === "loading" && !isLanguageChanging && (
              <div className="info-paytable-state">{t("loading")}</div>
            )}
            {state.paytableStatus === "error" && (
              <div className="info-paytable-state --error">
                {t("paytableLoadError")}
              </div>
            )}
            {state.paytableStatus !== "loading" && state.paytableStatus !== "error" && (
              <View2Paytable
                language={language}
                payoutMultiplier={paytableView.payoutMultiplier}
              />
            )}
          </section>
        ) : (
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
                  onAutoPlay={actions.toggleAutoPlay}
                  onMenu={onBackToSlots}
                />
              </>
            )}
          </div>
        )}

        {state.showPaytable && !state.visualMode && (
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
          <FreeSpinsPrompt
            onStart={actions.startFreeSpinRun}
          />
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
