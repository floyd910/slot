import { resolveLocalizedAsset, SLOT_CHOOSER_BACKGROUND_SRC } from "../../config/gameAssets.js";
import { getStartupPresentation } from "../../viewModels/startupPresentation.js";
import "./GameShell.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BottomBar from "../bottomBar/BottomBar.jsx";
import GameMenu from "../gameMenu/GameMenu.jsx";
import Paytable from "../paytable/Paytable.jsx";
import RuntimeState from "../runtimeState/RuntimeState.jsx";
import StartupLoader from "../startupLoader/StartupLoader.jsx";
import View2Paytable from "../view2Paytable/View2Paytable.jsx";
import { useLanguage } from "../../i18n.jsx";
import { buildStandardPaytableViewModel } from "../../viewModels/paytableViewModel.js";
import FreeSpinsSummary from "../freeSpinsPrompt/FreeSpinsSummary.jsx";
import FreeSpinsPrompt from "../freeSpinsPrompt/FreeSpinsPrompt.jsx";
import GameContent from "../gameContent/GameContent.jsx";
import DrawTicket from "../drawTicket/DrawTicket.jsx";
import { useResponsiveGameLayout } from "../../hooks/useResponsiveGameLayout.js";
import { getRuntimeStateStatus } from "../../utils/runtimeStatus.js";
import { preloadImage } from "../../utils/mediaPreload.js";

export default function GameShell({ controller, game, onBackToSlots }) {
  const shellRef = useRef(null);
  const backgroundRef = useRef(null);
  const [backgroundPaintReady, setBackgroundPaintReady] = useState(false);
  const [backgroundLoadFailed, setBackgroundLoadFailed] = useState(false);
  const [backgroundAttempt, setBackgroundAttempt] = useState(0);
  const [loaderExitComplete, setLoaderExitComplete] = useState(false);
  const { actions, derived, state } = controller;
  const checkingSession = ["initial-loading", "bootstrap-loading"].includes(state.status) && !derived.isRoundRecoveryBlocked;
  const showInlineView2Paytable = state.showPaytable && state.visualMode;
  const gridMounted = Boolean(state.grid?.A?.length && state.grid?.B?.length && state.grid?.C?.length);
  const layoutReady = useResponsiveGameLayout(
    shellRef,
    `${state.visualMode ? "view2" : "view1"}:${derived.isVisualDoubling}:${showInlineView2Paytable}:${state.startupAssetsReady}:${gridMounted}:${state.combinations.length}:${checkingSession}`,
  );
  useLayoutEffect(() => {
    const shell = shellRef.current;
    const configuredGame = shell?.closest(".configured-game");
    const logo = shell?.querySelector(".header_img");
    if (!shell || !configuredGame || !logo) return undefined;

    let frame = 0;
    const fitLogoBetweenHeaderControls = () => {
      frame = 0;
      if (window.innerWidth > 1024) {
        shell.style.removeProperty("--collision-logo-max-width");
        return;
      }

      const header = configuredGame.querySelector("header");
      const leftControls = header?.querySelector(".header-left");
      const rightControls = header?.querySelector(".header-btns");
      const centerX = window.innerWidth / 2;
      const safeGap = window.innerWidth <= 440 ? 6 : 10;
      const leftEdge = leftControls?.getBoundingClientRect().right ?? safeGap;
      const rightEdge = rightControls?.getBoundingClientRect().left ?? (window.innerWidth - safeGap);
      const availableHalfWidth = Math.max(
        0,
        Math.min(centerX - leftEdge - safeGap, rightEdge - centerX - safeGap),
      );
      const maxWidth = Math.max(300, Math.floor(availableHalfWidth * 2));
      shell.style.setProperty("--collision-logo-max-width", `${maxWidth}px`);
    };
    const scheduleFit = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fitLogoBetweenHeaderControls);
    };

    const observer = new ResizeObserver(scheduleFit);
    const header = configuredGame.querySelector("header");
    [configuredGame, header, header?.querySelector(".header-left"), header?.querySelector(".header-btns")]
      .filter(Boolean)
      .forEach((element) => observer.observe(element));
    scheduleFit();
    window.addEventListener("resize", scheduleFit, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleFit);
      shell.style.removeProperty("--collision-logo-max-width");
    };
  }, [state.visualMode, state.showGameMenu]);
  useLayoutEffect(() => {
    let active = true;
    const image = backgroundRef.current;
    if (!image) return undefined;

    const markFailed = () => {
      if (active) {
        setBackgroundPaintReady(false);
        setBackgroundLoadFailed(true);
      }
    };
    const markPaintReady = async () => {
      try {
        await image.decode?.();
      } catch {
        markFailed();
        return;
      }
      requestAnimationFrame(() => {
        if (active) setBackgroundPaintReady(true);
      });
    };

    setBackgroundPaintReady(false);
    setBackgroundLoadFailed(false);
    if (image.complete) {
      if (image.naturalWidth > 0) markPaintReady();
      else markFailed();
    } else {
      image.addEventListener("load", markPaintReady, { once: true });
      image.addEventListener("error", markFailed, { once: true });
    }

    return () => {
      active = false;
      image.removeEventListener("load", markPaintReady);
      image.removeEventListener("error", markFailed);
    };
  }, [game.assets.cover, backgroundAttempt]);
  const { isLanguageChanging, language, t } = useLanguage();
  useEffect(() => {
    const alternateLanguage = language === "ru" ? "tg" : "ru";
    const timer = window.setTimeout(() => {
      preloadImage(resolveLocalizedAsset(game.assets.logo, alternateLanguage), {
        decode: false,
        fetchPriority: "low",
        rejectOnError: false,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [game.assets.logo, language]);

  const {guest, showStartupLoader} = getStartupPresentation({
    status:state.status, loaderExitComplete, checkingSession, hasPlayer:Boolean(state.player),
    startupLoaderVisible:state.startupLoaderVisible, startupLoaderLeaving:state.startupLoaderLeaving,
    layoutReady, backgroundPaintReady, isLanguageChanging,
  });
  useLayoutEffect(() => {
    if (checkingSession) setLoaderExitComplete(false);
    else if (guest) setLoaderExitComplete(true);
  }, [guest, checkingSession]);
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
      data-guest={guest ? "true" : "false"}
      data-module-mode={state.context.mode}
      data-startup-loading={showStartupLoader ? "true" : "false"}
    >
      <div
        className="game_area"
        data-view2-info={showInlineView2Paytable ? "true" : "false"}
      >
        <img
          key={backgroundAttempt}
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
          src={resolveLocalizedAsset(game.assets.logo, language)}
          alt=""
          aria-hidden="true"
          decoding="sync"
          fetchpriority="high"
          draggable={false}
          width="3096"
          height="712"
        />

        {!showInlineView2Paytable && !runtimeState && !derived.isVisualDoubling && !state.doubleState.active && (
          <DrawTicket spinResult={state.spinResult} />
        )}

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
                  revealComplete={state.hasRecoveredGrid || state.gridAnimation === "settled"}
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
                  freeSpinsWinTotal={state.freeSpinsWinTotal} freeSpinsLeft={state.freeSpinsLeft} freeSpinHistoryMissing={state.freeSpinHistoryMissing}
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
        {state.freeSpinSummary && <FreeSpinsSummary result={state.freeSpinSummary} currency={state.player?.currency} onContinue={actions.continueAfterFreeSpins} />}
        {!state.freeSpinSummary && state.showFreeSpinPrompt && !(state.hasRecoveredGrid && derived.pendingTicketWin) && (
          <FreeSpinsPrompt onStart={actions.startFreeSpinRun} count={state.freeSpinsLeft} paidTotal={state.freeSpinsPaidTotal} />
        )}

      {backgroundLoadFailed && (
          <div className="startup-loader game-background-error" role="alert">
            <p>{t("backgroundLoadError")}</p>
            <button type="button" onClick={() => setBackgroundAttempt((attempt) => attempt + 1)}>
              {t("retry")}
            </button>
          </div>
        )}
      {showStartupLoader && !backgroundLoadFailed && (
          <StartupLoader backgroundSrc={SLOT_CHOOSER_BACKGROUND_SRC}
            preserveBackground={Boolean(state.player) && backgroundPaintReady}
            ready={
              !checkingSession && state.startupAssetsReady && layoutReady && backgroundPaintReady
            }
            leaving={
              !checkingSession && state.startupLoaderLeaving && layoutReady && backgroundPaintReady
            }
            label={state.recoveringRound ? t("restoringGame") : undefined}
            onExited={() => setLoaderExitComplete(true)}
          />
        )}
      </div>
    </div>
  );
}
