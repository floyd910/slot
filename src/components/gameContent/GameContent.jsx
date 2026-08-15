import { useEffect, useState } from "react";
import CombinationSelector from "../combinationSelector/CombinationSelector.jsx";
import GameAlert from "../gameAlert/GameAlert.jsx";
import DoubleMode from "../doubleMode/DoubleMode.jsx";
import View2DoubleScene from "../view2DoubleScene/View2DoubleScene.jsx";
import Lobby from "../lobby/Lobby.jsx";
import LotteryGrid from "../lotteryGrid/LotteryGrid.jsx";
import WinningsDashboard from "../winningDashboard/WinningDashboard.jsx";
import { useLanguage } from "../../i18n.jsx";
import { buildGameContentViewModel } from "../../viewModels/gameContentViewModel.js";

const TICKET_COPY = {
  ru: {
    closeDetails:
      "\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u043e\u0441\u0442\u0438",
    receiptLabel:
      "\u041b\u043e\u0442\u0435\u0440\u0435\u0439\u043d\u0430\u044f \u043a\u0432\u0438\u0442\u0430\u043d\u0446\u0438\u044f \u2116",
    drawLabel: "\u0422\u0438\u0440\u0430\u0436 \u2116",
    description:
      "\u041d\u0430\u0446\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u044d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0430\u044f \u0442\u0438\u0440\u0430\u0436\u043d\u0430\u044f \u043b\u043e\u0442\u0435\u0440\u0435\u044f \u00ab\u041b\u043e\u0442\u043e\u00bb",
    details: "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u043e",
  },
  tg: {
    closeDetails:
      "\u041f\u04ef\u0448\u0438\u0434\u0430\u043d\u0438 \u0442\u0430\u0444\u0441\u0438\u043b\u043e\u0442",
    receiptLabel:
      "\u0427\u0438\u043f\u0442\u0430\u0438 \u043b\u043e\u0442\u0435\u0440\u0435\u044f \u2116",
    drawLabel: "\u0422\u0438\u0440\u0430\u0436 \u2116",
    description:
      "\u041b\u043e\u0442\u0435\u0440\u0435\u044f\u0438 \u044d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u0438\u0438 \u043c\u0438\u043b\u043b\u0438\u0438 \u0442\u0438\u0440\u0430\u0436\u0438\u0438 \u00ab\u041b\u043e\u0442\u043e\u00bb",
    details: "\u041c\u0443\u0444\u0430\u0441\u0441\u0430\u043b",
  },
};
const SHOW_TICKET_PANEL = true;

export default function GameContent({ controller, game, runtimeState }) {
  const { language, t } = useLanguage();
  const ticketCopy = TICKET_COPY[language] ?? TICKET_COPY.ru;
  const [drawDetailsExpanded, setDrawDetailsExpanded] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);
  const { actions, derived, state } = controller;
  const view = buildGameContentViewModel({ derived, state });
  useEffect(() => {
    if (!state.spinResult?.idCard) return;
    setLastTicket({
      drawNumber: state.spinResult.idCard,
      receiptNumber: state.spinResult.Number ?? "\u2014",
    });
  }, [state.spinResult?.Number, state.spinResult?.idCard]);

  const drawNumber = lastTicket?.drawNumber ?? "—";
  const receiptNumber = lastTicket?.receiptNumber ?? "—";

  if (runtimeState) return runtimeState;

  if (view.showLobby) {
    return (
      <Lobby
        games={state.games}
        loading={state.status === "bootstrap-loading"}
        error={state.status === "empty" ? t("noGames") : ""}
        onSelectGame={actions.setCurrentGame}
      />
    );
  }

  if (state.doubleState.active) {
    return (
      <DoubleMode
        winSum={state.spinResult?.WinSum ?? 0}
        step={state.doubleState.step}
        status={state.doubleState.status}
        loading={state.doubleState.loading}
        onPick={actions.pickDouble}
        onCollect={actions.collectWin}
      />
    );
  }
  if (view.showVisualDouble) {
    return (
      <section className="view2-double-screen" aria-busy={derived.isBusy}>
        <View2DoubleScene
          closedChestSource={game.assets.doubleSceneClosedChest}
          winningChestSource={game.assets.doubleSceneWinningChest}
          emptyChestSource={game.assets.doubleSceneEmptyChest}
          gameId={game.id}
          amount={
            state.doublingState.currentAmount ?? state.spinResult?.WinSum ?? 0
          }
          ladderAmount={
            state.doublingState.initialAmount ?? state.spinResult?.WinSum ?? 0
          }
          step={state.doublingState.step || 0}
          loading={state.doublingState.loading}
          lastPick={state.doublingState.lastPick}
          lastStatus={state.doublingState.lastStatus}
          onPick={actions.playFooterDouble}
        />
      </section>
    );
  }

  return (
    <>
      <aside className="main-container__left">
        <CombinationSelector
          combinations={state.combinations}
          selectedCombinationId={state.selectedCombinationId}
          disabled={derived.isBusy || derived.isDoublingLocked}
          onSelect={actions.selectCombination}
        />
      </aside>
      <section className="main-container__center" aria-busy={derived.isBusy}>
        <GameAlert message={view.alertMessage} />
        {view.showStandardGame && (
          <>
            <div
              className={`preloaded-grid-view preloaded-grid-view--view1${
                state.visualMode ? "" : " preloaded-grid-view--active"
              }`}
              aria-hidden={state.visualMode}
              inert={state.visualMode ? "" : undefined}
            >
              <LotteryGrid
                symbolAssets={game.assets.view2Symbols}
                grid={state.grid}
                revealKey={state.gridRevealKey}
                animationState={state.visualMode ? "idle" : state.gridAnimation}
                visualMode={false}
                autoSequence={state.autoPlayOn || state.freeSpinRoundStarted}
                carpetCloseMs={state.carpetCloseMs}
                carpetOpenMs={state.carpetOpenMs}
                winningCells={
                  state.visualMode ? [] : state.spinResult?.winningCells
                }
                winningGroups={
                  state.visualMode ? [] : state.spinResult?.lineWins
                }
                scatterCells={
                  state.visualMode ? [] : state.spinResult?.scatterCells
                }
                doublingState={state.doublingState}
              />
            </div>
            <div
              className={`preloaded-grid-view preloaded-grid-view--view2${
                state.visualMode ? " preloaded-grid-view--active" : ""
              }`}
              aria-hidden={!state.visualMode}
              inert={state.visualMode ? undefined : ""}
            >
              <LotteryGrid
                symbolAssets={game.assets.view2Symbols}
                grid={state.grid}
                revealKey={state.gridRevealKey}
                animationState={state.visualMode ? state.gridAnimation : "idle"}
                visualMode={true}
                autoSequence={state.autoPlayOn || state.freeSpinRoundStarted}
                carpetCloseMs={state.carpetCloseMs}
                carpetOpenMs={state.carpetOpenMs}
                winningCells={
                  state.visualMode ? state.spinResult?.winningCells : []
                }
                winningGroups={
                  state.visualMode ? state.spinResult?.lineWins : []
                }
                scatterCells={
                  state.visualMode ? state.spinResult?.scatterCells : []
                }
                doublingState={state.doublingState}
              />
            </div>
            {SHOW_TICKET_PANEL && (
              <div
                data-ticket-position="below"
                data-ticket-expansion="up"
                className={`grid-bottom-panel${drawDetailsExpanded ? " grid-bottom-panel--expanded" : ""}`}
              >
                {drawDetailsExpanded && (
                  <button
                    aria-label={ticketCopy.closeDetails}
                    className="grid-bottom-panel__close"
                    onClick={() => setDrawDetailsExpanded(false)}
                    type="button"
                  >
                    <img src="/img/ui/draw-details-close.png" alt="" />
                  </button>
                )}
                {drawDetailsExpanded && (
                  <div className="grid-bottom-panel__receipt">
                    {ticketCopy.receiptLabel} {receiptNumber}{" "}
                    {ticketCopy.drawLabel} {drawNumber} {ticketCopy.description}
                  </div>
                )}
                <div className="grid-bottom-panel__footer">
                  <div className="grid-bottom-panel__draw">
                    <img
                      className="grid-bottom-panel__icon"
                      src="/img/ui/draw-info-icon.png"
                      alt=""
                    />
                    <span>
                      {ticketCopy.drawLabel}
                      {drawNumber}
                    </span>
                  </div>
                  {!drawDetailsExpanded && (
                    <button
                      aria-expanded="false"
                      className="grid-bottom-panel__details"
                      onClick={() => setDrawDetailsExpanded(true)}
                      type="button"
                    >
                      {ticketCopy.details}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {view.showRightPanel && (
        <div className="main-container__right">
          <WinningsDashboard
            gameId={game.id}
            stake={state.stake}
            selectedCombination={derived.selectedCombination}
            spinResult={state.spinResult}
            doublingState={state.doublingState}
            revealComplete={state.gridAnimation === "settled"}
          />
        </div>
      )}
    </>
  );
}
