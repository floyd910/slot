import CombinationSelector from "../CombinationSelector.jsx";
import GameAlert from "../GameAlert.jsx";
import DoubleMode from "../DoubleMode.jsx";
import View2DoubleScene from "../View2DoubleScene.jsx";
import View2PurchasePanel from "../View2PurchasePanel.jsx";
import Lobby from "../Lobby.jsx";
import LotteryGrid from "../LotteryGrid.jsx";
import WinningsDashboard from "../WinningDashboard.jsx";
import { useLanguage } from "../../i18n.jsx";

export default function GameContent({ controller, runtimeState }) {
  const { t } = useLanguage();
  const { actions, derived, state } = controller;

  if (runtimeState) return runtimeState;

  if (!state.currentGame) {
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

  const moreInfoLines = t("moreInfo").split("\n");

  return (
    <>
      <aside className="main-container__left">
        {derived.isVisualDoubling ? (
          <View2PurchasePanel
            amount={
              state.doublingState.currentAmount ?? state.spinResult?.WinSum ?? 0
            }
            deferredBalance={state.doublingState.deferredBalance}
            balance={state.player?.balance ?? 0}
            totalPurchase={derived.totalPurchase}
          />
        ) : (
          <CombinationSelector
            combinations={state.combinations}
            selectedCombinationId={state.selectedCombinationId}
            disabled={derived.isBusy || derived.isDoublingLocked}
            onSelect={actions.selectCombination}
          />
        )}
      </aside>
      <section className="main-container__center" aria-busy={derived.isBusy}>
        <GameAlert message={state.error} />
        {derived.isVisualDoubling ? (
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
        ) : (
          <>
            <LotteryGrid
              grid={state.grid}
              revealKey={state.gridRevealKey}
              animationState={state.gridAnimation}
              visualMode={state.visualMode}
              carpetCloseMs={state.carpetCloseMs}
              carpetOpenMs={state.carpetOpenMs}
              winningCells={state.spinResult?.winningCells}
              winningGroups={state.spinResult?.lineWins}
              scatterCells={state.spinResult?.scatterCells}
              doublingState={state.doublingState}
            />
          </>
        )}
      </section>

      {!derived.isVisualDoubling && (
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
