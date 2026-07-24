import { useEffect, useState } from "react";
import CombinationSelector from "../CombinationSelector.jsx";
import GameAlert from "../GameAlert.jsx";
import DoubleMode from "../DoubleMode.jsx";
import View2DoubleScene from "../View2DoubleScene.jsx";
import Lobby from "../Lobby.jsx";
import LotteryGrid from "../LotteryGrid.jsx";
import WinningsDashboard from "../WinningDashboard.jsx";
import { useLanguage } from "../../i18n.jsx";
import { buildGameContentViewModel } from "../../viewModels/gameContentViewModel.js";

const SHOW_TICKET_PANEL = false;

export default function GameContent({ controller, runtimeState }) {
  const { t } = useLanguage();
  const [drawDetailsExpanded, setDrawDetailsExpanded] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);
  const { actions, derived, state } = controller;
  const view = buildGameContentViewModel({ derived, state });
  useEffect(() => {
    if (!state.spinResult?.idCard) return;
    setLastTicket({
      drawNumber: state.spinResult.idCard,
      receiptNumber: state.spinResult.Number ?? "РІР‚вЂќ",
    });
  }, [state.spinResult?.Number, state.spinResult?.idCard]);

  const drawNumber = lastTicket?.drawNumber;
  const receiptNumber = lastTicket?.receiptNumber;

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
            <LotteryGrid
              grid={state.grid}
              revealKey={state.gridRevealKey}
              animationState={state.gridAnimation}
              visualMode={state.visualMode}
              autoSequence={state.autoPlayOn}
              carpetCloseMs={state.carpetCloseMs}
              carpetOpenMs={state.carpetOpenMs}
              winningCells={state.spinResult?.winningCells}
              winningGroups={state.spinResult?.lineWins}
              scatterCells={state.spinResult?.scatterCells}
              doublingState={state.doublingState}
            />
            {SHOW_TICKET_PANEL && lastTicket && (
            <div
              className={`grid-bottom-panel${drawDetailsExpanded ? " grid-bottom-panel--expanded" : ""}`}
            >
              {drawDetailsExpanded && (
                <button
                  aria-label="Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ Р С—Р С•Р Т‘РЎР‚Р С•Р В±Р Р…Р С•РЎРѓРЎвЂљР С‘"
                  className="grid-bottom-panel__close"
                  onClick={() => setDrawDetailsExpanded(false)}
                  type="button"
                >
                  <img src="/img/ui/draw-details-close.png" alt="" />
                </button>
              )}
              {drawDetailsExpanded && (
                <div className="grid-bottom-panel__receipt">
                  Р вЂєР С•РЎвЂљР ВµРЎР‚Р ВµР в„–Р Р…Р В°РЎРЏ Р С”Р Р†Р С‘РЎвЂљР В°Р Р…РЎвЂ Р С‘РЎРЏ РІвЂћвЂ“ {receiptNumber} Р СћР С‘РЎР‚Р В°Р В¶ РІвЂћвЂ“ {drawNumber}{" "}
                  Р СњР В°РЎвЂ Р С‘Р С•Р Р…Р В°Р В»РЎРЉР Р…Р В°РЎРЏ РЎРЊР В»Р ВµР С”РЎвЂљРЎР‚Р С•Р Р…Р Р…Р В°РЎРЏ РЎвЂљР С‘РЎР‚Р В°Р В¶Р Р…Р В°РЎРЏ Р В»Р С•РЎвЂљР ВµРЎР‚Р ВµРЎРЏ Р вЂєР С•РЎвЂљР С•
                </div>
              )}
              <div className="grid-bottom-panel__footer">
                <div className="grid-bottom-panel__draw">
                  <img
                    className="grid-bottom-panel__icon"
                    src="/img/ui/draw-info-icon.png"
                    alt=""
                  />
                  <span>Р СћР С‘РЎР‚Р В°Р В¶ РІвЂћвЂ“{drawNumber}</span>
                </div>
                {!drawDetailsExpanded && (
                  <button
                    aria-expanded="false"
                    className="grid-bottom-panel__details"
                    onClick={() => setDrawDetailsExpanded(true)}
                    type="button"
                  >
                    Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р С•
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
