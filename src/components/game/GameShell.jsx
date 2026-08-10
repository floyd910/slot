import { useRef } from "react";
import BottomBar from "../BottomBar.jsx";
import GameBottomArea from "../GameBottomArea.jsx";
import GameMenu from "../GameMenu.jsx";
import Paytable from "../Paytable.jsx";
import RuntimeState from "../RuntimeState.jsx";
import StartupLoader from "../StartupLoader.jsx";
import View2Paytable from "../View2Paytable.jsx";
import { useLanguage } from "../../i18n.jsx";
import { buildStandardPaytableViewModel } from "../../viewModels/paytableViewModel.js";
import FreeSpinsPrompt from "./FreeSpinsPrompt.jsx";
import GameContent from "./GameContent.jsx";
import { useResponsiveGameLayout } from "../../hooks/useResponsiveGameLayout.js";

export default function GameShell({ controller, game, onBackToSlots }) {
  const shellRef = useRef(null);
  const { actions, derived, state } = controller;
  useResponsiveGameLayout(shellRef, state.visualMode ? "view2" : "view1");
  const { isLanguageChanging, language, t } = useLanguage();
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
      ref={shellRef}
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
          src={game.assets.cover}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchpriority="high"
          draggable={false}
        />
        <div className="bg-overlay"></div>
        <img
          className="header_img"
          src={game.assets.logo}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchpriority="high"
          draggable={false}
          width="3096"
          height="712"
        />

        {showInlineView2Paytable ? (
          <section className="view2-info-inline" aria-label="View 2 payouts">
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
                zeroPayoutMultiplier={paytableView.zeroPayoutMultiplier}
                symbolAssets={game.assets.view2Symbols}
                onClose={() => actions.setShowPaytable(false)}
              />
            )}
          </section>
        ) : (
          <div className="game-main-layout">
            <div className="frame-content">
              <GameContent controller={controller} game={game} runtimeState={runtimeState} />
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
                  freeSpinsLeft={state.freeSpinsLeft}
                  freeSpinRoundStarted={state.freeSpinRoundStarted}
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
            gameId={game.id}
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
            gameId={game.id}
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
            backgroundSrc={game.assets.cover}
          />
        )}
      </div>
    </div>
  );
}


