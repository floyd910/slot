import "./GameShell.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BottomBar from "../bottomBar/BottomBar.jsx";
import GameMenu from "../gameMenu/GameMenu.jsx";
import Paytable from "../paytable/Paytable.jsx";
import RuntimeState from "../runtimeState/RuntimeState.jsx";
import StartupLoader from "../startupLoader/StartupLoader.jsx";
import View2Paytable from "../view2Paytable/View2Paytable.jsx";
import { SLOT_CHOOSER_BACKGROUND_SRC } from "../../config/gameAssets.js";
import { useLanguage } from "../../i18n.jsx";
import { buildStandardPaytableViewModel } from "../../viewModels/paytableViewModel.js";
import FreeSpinsPrompt from "../freeSpinsPrompt/FreeSpinsPrompt.jsx";
import FreeSpinsSummary from "../freeSpinsPrompt/FreeSpinsSummary.jsx";
import GameContent from "../gameContent/GameContent.jsx";
import { useResponsiveGameLayout } from "../../hooks/useResponsiveGameLayout.js";
import { getRuntimeStateStatus } from "../../utils/runtimeStatus.js";


export default function GameShell({ controller, game, onBackToSlots, startupManagedExternally = false }) {
  const shellRef = useRef(null);
  const backgroundRef = useRef(null);
  const [backgroundPaintReady, setBackgroundPaintReady] = useState(false);
  const [loaderExitComplete, setLoaderExitComplete] = useState(false);
  const { actions, derived, state } = controller;
  const showInlineView2Paytable = state.showPaytable && state.visualMode;
  const layoutReady = useResponsiveGameLayout(
    shellRef,
    `${state.visualMode ? "view2" : "view1"}:${derived.isVisualDoubling}:${showInlineView2Paytable}:${state.startupLoaderVisible}:${state.startupAssetsReady}`,
  );
  useLayoutEffect(() => {
    let active = true;
    const image = backgroundRef.current;
    if (!image) return undefined;

    const markPaintReady = async () => {
      try {
        await image.decode?.();
      } catch {
        // Browsers may reject redundant decode calls for a cached image.
      }
      requestAnimationFrame(() => {
        if (active) setBackgroundPaintReady(true);
      });
    };

    setBackgroundPaintReady(false);
    if (image.complete && image.naturalWidth > 0) {
      markPaintReady();
    } else {
      image.addEventListener("load", markPaintReady, { once: true });
      image.addEventListener("error", markPaintReady, { once: true });
    }

    return () => {
      active = false;
      image.removeEventListener("load", markPaintReady);
      image.removeEventListener("error", markPaintReady);
    };
  }, [game.assets.cover]);
  const { isLanguageChanging, language, t } = useLanguage();
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawalRequestSentVisible, setWithdrawalRequestSentVisible] = useState(false);

  useEffect(() => {
    if (!state.cashierLocked) {
      setWithdrawError("");
      setWithdrawSubmitting(false);
    }
  }, [state.cashierLocked]);

  useEffect(() => {
    if (!withdrawalRequestSentVisible) return undefined;
    const timer = window.setTimeout(() => setWithdrawalRequestSentVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, [withdrawalRequestSentVisible]);

  const closeCashierModal = () => {
    if (withdrawSubmitting) return;
    actions.continueAfterCashier();
  };

  const submitWithdrawal = async (event) => {
    event.preventDefault();
    const balance = Number(state.player?.balance ?? 0);
    if (!Number.isFinite(balance) || balance <= 0) {
      setWithdrawError(t("withdrawSubmitFailed"));
      return;
    }

    setWithdrawSubmitting(true);
    setWithdrawError("");
    try {
      await actions.submitCashierWithdrawal(balance);
      setWithdrawalRequestSentVisible(true);
      setWithdrawSubmitting(false);
    } catch {
      setWithdrawError(t("withdrawSubmitFailed"));
      setWithdrawSubmitting(false);
    }
  };

  const startupContentReady =
    state.startupAssetsReady &&
    !["initial-loading", "bootstrap-loading"].includes(state.status) &&
    layoutReady &&
    backgroundPaintReady;
  const showStartupLoader =
    !startupManagedExternally &&
    !loaderExitComplete &&
    (state.startupLoaderVisible ||
      state.startupLoaderLeaving ||
      !layoutReady ||
      !backgroundPaintReady) &&
    !isLanguageChanging;
  const paytableView = buildStandardPaytableViewModel({
    stake: state.stake,
    selectedCombination: derived.selectedCombination,
    selectedCombinationId: state.selectedCombinationId,
    gameId: game.id,
  });
  const runtimeState =
    derived.runtimeStateVisible && !isLanguageChanging && !showStartupLoader ? (
      <RuntimeState
        status={getRuntimeStateStatus(state.status, derived.isRoundRecoveryBlocked)}
        error={state.error}
        mode={state.context.mode}
        onRetry={actions.retryInitialization}
      />
    ) : null;

  return (
    <div
      ref={shellRef}
      className={derived.shellClass}
      style={
        game.assets.doubleSceneBackground
          ? {
              "--double-scene-background": `url("${game.assets.doubleSceneBackground}")`,
              "--double-scene-background-position":
                game.assets.doubleSceneBackgroundPosition ?? "50% 50%",
            }
          : undefined
      }
      data-fluid-fit="true"
      data-layout-ready={layoutReady ? "true" : "false"}
      data-module-mode={state.context.mode}
      data-startup-loading={startupContentReady ? "false" : "true"}
      data-startup-error={state.error === "assetsLoadError" ? "true" : "false"}
    >
      <div
        className="game_area"
        data-view2-info={showInlineView2Paytable ? "true" : "false"}
      >
        <img
          ref={backgroundRef}
          className="game_area__background"
          src={game.assets.cover}
          alt=""
          aria-hidden="true"
          decoding="sync"
          fetchpriority="high"
          draggable={false}
        />
        <div className="bg-overlay"></div>
        <img
          className="header_img"
          src={game.assets.logo}
          alt=""
          aria-hidden="true"
          decoding="sync"
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
            {state.paytableStatus !== "loading" &&
              state.paytableStatus !== "error" && (
                <View2Paytable
                  language={language}
                  gameId={game.id}
                  selectedCombinationId={state.selectedCombinationId}
                  payoutMultiplier={paytableView.payoutMultiplier}
                  zeroPayoutMultiplier={paytableView.zeroPayoutMultiplier}
                  symbolAssets={game.assets.view2Symbols}
                  symbolImageOverrides={game.assets.view2Info?.symbolImageOverrides}
                  hiddenPayoutSymbols={game.assets.view2Info?.hiddenPayoutSymbols}
                  hiddenSymbolTiles={game.assets.view2Info?.hiddenSymbolTiles}
                  onClose={() => actions.setShowPaytable(false)}
                />
              )}
          </section>
        ) : (
          <div className="game-main-layout">
            <div className="frame-content">
              <GameContent
                controller={controller}
                game={game}
                runtimeState={runtimeState}
              />
            </div>
            {!runtimeState && (
              <>
                <BottomBar
                  player={state.player}
                  stake={state.stake}
                  selectedCombination={derived.selectedCombination}
                  totalPurchase={derived.totalPurchase}
                  spinResult={state.spinResult}
                  revealComplete={state.gridAnimation === "settled"}
                  disabled={derived.isBusy}
                  spinAssetsLoading={derived.spinAssetsLoading}
                  spinDisabled={derived.spinButtonDisabled}
                  spinFeedbackActive={state.spinFeedbackActive}
                  primaryActionCollectsWin={derived.primaryActionCollectsWin}
                  doubleOfferAvailable={derived.doubleOfferAvailable}
                  doublingState={state.doublingState}
                  visualMode={state.visualMode}
                  viewSwitchDisabled={derived.viewSwitchDisabled}
                  paytableControlsLocked={derived.paytableControlsLocked}
                  isVisualDoubling={derived.isVisualDoubling}
                  onCollect={actions.collectWin}
                  onPickLeft={() => actions.playFooterDouble("left")}
                  onPickRight={() => actions.playFooterDouble("right")}
                  freeSpinsWinTotal={state.freeSpinsWinTotal}
                  freeSpinsTotal={state.freeSpinsTotal}
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
            selectedCombinationId={state.selectedCombinationId}
            onClose={() => actions.setShowPaytable(false)}
          />
        )}
        {state.showGameMenu && (
          <GameMenu
            gameId={game.id}
            paytableView={paytableView}
            visualMode={state.visualMode}
            symbolAssets={game.assets.view2Symbols}
            symbolImageOverrides={game.assets.view2Info?.symbolImageOverrides}
            onClose={() => actions.setShowGameMenu(false)}
          />
        )}
        {state.freeSpinSummary && (
          <FreeSpinsSummary
            result={state.freeSpinSummary}
            currency={state.player?.currency}
            onContinue={actions.continueAfterFreeSpins}
          />
        )}
        {!state.freeSpinSummary && state.showFreeSpinPrompt && (
          <FreeSpinsPrompt count={state.freeSpinsLeft} recovered={state.freeSpinPromptRecovered} onStart={actions.startFreeSpinRun} />
        )}

        {withdrawalRequestSentVisible && (
          <div className="cashier-withdrawal-toast" role="status" aria-live="polite">
            {t("withdrawalRequestSent")}
          </div>
        )}
        {state.cashierLocked && !showStartupLoader && (
          <section
            className="cashier-lock"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cashier-lock-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeCashierModal();
            }}
          >
            <form className="cashier-lock__card" onSubmit={submitWithdrawal}>
              <button type="button" className="cashier-lock__close" aria-label={t("close")} onClick={closeCashierModal} disabled={withdrawSubmitting}>×</button>
              <strong id="cashier-lock-title">{t("cashOutComplete")}</strong>
              <span>{t("cashOutInstructions")}</span>
              <span className="cashier-lock__id">ID {state.player?.id ?? "------"}</span>
              <span>{t("balance")}: {Number(state.player?.balance ?? 0).toFixed(2)}{state.player?.currency ? ` ${state.player.currency}` : ""}</span>

              {withdrawError && <span className="cashier-lock__error" role="alert">{withdrawError}</span>}
              <button type="submit" className="cashier-lock__submit" disabled={withdrawSubmitting || Number(state.player?.balance ?? 0) <= 0}>
                {withdrawSubmitting ? t("processing") : t("submitWithdrawal")}
              </button>
            </form>
          </section>
        )}
        {showStartupLoader && (
          <StartupLoader
            ready={
              state.startupAssetsReady && layoutReady && backgroundPaintReady
            }
            leaving={
              state.startupLoaderLeaving && layoutReady && backgroundPaintReady
            }
            backgroundSrc={SLOT_CHOOSER_BACKGROUND_SRC}
            label={state.recoveringRound ? t("restoringGame") : undefined}
            onExited={() => setLoaderExitComplete(true)}
          />
        )}
      </div>
    </div>
  );
}
