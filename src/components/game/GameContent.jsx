import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CombinationSelector from "../CombinationSelector.jsx";
import GameAlert from "../GameAlert.jsx";
import DoubleMode from "../DoubleMode.jsx";
import View2DoubleScene from "../View2DoubleScene.jsx";
import Lobby from "../Lobby.jsx";
import LotteryGrid from "../LotteryGrid.jsx";
import WinningsDashboard from "../WinningDashboard.jsx";
import { useLanguage } from "../../i18n.jsx";
import { buildGameContentViewModel } from "../../viewModels/gameContentViewModel.js";


const TICKET_COPY = {
  ru: {
    closeDetails: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u043e\u0441\u0442\u0438",
    receiptLabel: "\u041b\u043e\u0442\u0435\u0440\u0435\u0439\u043d\u0430\u044f \u043a\u0432\u0438\u0442\u0430\u043d\u0446\u0438\u044f \u2116",
    drawLabel: "\u0422\u0438\u0440\u0430\u0436 \u2116",
    description: "\u041d\u0430\u0446\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u044d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0430\u044f \u0442\u0438\u0440\u0430\u0436\u043d\u0430\u044f \u043b\u043e\u0442\u0435\u0440\u0435\u044f \u00ab\u041b\u043e\u0442\u043e\u00bb",
    details: "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u043e",
  },
  tg: {
    closeDetails: "\u041f\u04ef\u0448\u0438\u0434\u0430\u043d\u0438 \u0442\u0430\u0444\u0441\u0438\u043b\u043e\u0442",
    receiptLabel: "\u0427\u0438\u043f\u0442\u0430\u0438 \u043b\u043e\u0442\u0435\u0440\u0435\u044f \u2116",
    drawLabel: "\u0422\u0438\u0440\u0430\u0436 \u2116",
    description: "\u041b\u043e\u0442\u0435\u0440\u0435\u044f\u0438 \u044d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u0438\u0438 \u043c\u0438\u043b\u043b\u0438\u0438 \u0442\u0438\u0440\u0430\u0436\u0438\u0438 \u00ab\u041b\u043e\u0442\u043e\u00bb",
    details: "\u041c\u0443\u0444\u0430\u0441\u0441\u0430\u043b",
  },
};
const SHOW_TICKET_PANEL = true;

export default function GameContent({ controller, game, runtimeState }) {
  const { language, t } = useLanguage();
  const ticketCopy = TICKET_COPY[language] ?? TICKET_COPY.ru;
  const [drawDetailsExpanded, setDrawDetailsExpanded] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);
  const [ticketPosition, setTicketPosition] = useState("below");
  const [ticketExpansion, setTicketExpansion] = useState("down");
  const ticketRef = useRef(null);
  const { actions, derived, state } = controller;
  const view = buildGameContentViewModel({ derived, state });
  useEffect(() => {
    if (!state.spinResult?.idCard) return;
    setLastTicket({
      drawNumber: state.spinResult.idCard,
      receiptNumber: state.spinResult.Number ?? "\u2014",
    });
  }, [state.spinResult?.Number, state.spinResult?.idCard]);

  useLayoutEffect(() => {
    if (!lastTicket) return undefined;

    const ticket = ticketRef.current;
    const center = ticket?.parentElement;
    const root = ticket?.closest(".frame-app");
    if (!ticket || !center || !root) return undefined;

    const isVisible = (element) =>
      element &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).display !== "none";
    const getVisibleFooter = () =>
      Array.from(root.querySelectorAll(".bottom-bar")).find(isVisible) ??
      Array.from(root.querySelectorAll(".footer-block")).find(isVisible);


    const updatePosition = () => {
        const centerRect = center.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        const footer = getVisibleFooter();
        const footerTop = footer?.getBoundingClientRect().top ?? rootRect.bottom;
        const scale = center.offsetWidth
          ? centerRect.width / center.offsetWidth
          : 1;
        const gap = 16 * scale;
        const ticketFooterHeight =
          ticket.querySelector(".grid-bottom-panel__footer")
            ?.getBoundingClientRect().height ?? 0;
        const collapsedTicketHeight = Math.max(
          56 * scale,
          ticketFooterHeight + 32 * scale,
        );
        const fitsBelow =
          centerRect.bottom + gap + collapsedTicketHeight <= footerTop;
        const nextPosition = fitsBelow ? "below" : "above";

        setTicketPosition((current) =>
          current === nextPosition ? current : nextPosition,
        );
        const expandedFitsBelow =
          centerRect.bottom + gap + ticket.offsetHeight * scale <= footerTop;
        const nextExpansion = expandedFitsBelow ? "down" : "up";
        setTicketExpansion((current) =>
          current === nextExpansion ? current : nextExpansion,
        );
    };

    const observer = new ResizeObserver(updatePosition);
    observer.observe(root);
    observer.observe(center);
    const footer = getVisibleFooter();
    observer.observe(ticket);
    if (footer) observer.observe(footer);
    const mutationObserver = new MutationObserver(updatePosition);
    mutationObserver.observe(root, {
      attributes: true,
      attributeFilter: ["class", "style", "data-fluid-fit"],
    });
    window.addEventListener("resize", updatePosition);
    updatePosition();

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [drawDetailsExpanded, lastTicket, state.visualMode]);


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
                winningCells={state.visualMode ? [] : state.spinResult?.winningCells}
                winningGroups={state.visualMode ? [] : state.spinResult?.lineWins}
                scatterCells={state.visualMode ? [] : state.spinResult?.scatterCells}
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
                winningCells={state.visualMode ? state.spinResult?.winningCells : []}
                winningGroups={state.visualMode ? state.spinResult?.lineWins : []}
                scatterCells={state.visualMode ? state.spinResult?.scatterCells : []}
                doublingState={state.doublingState}
              />
            </div>
            {SHOW_TICKET_PANEL && lastTicket && (
            <div
              ref={ticketRef}
              data-ticket-position={ticketPosition}
              data-ticket-expansion={ticketExpansion}
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
                  {ticketCopy.receiptLabel} {receiptNumber} {ticketCopy.drawLabel} {drawNumber}{" "}
                  {ticketCopy.description}
                </div>
              )}
              <div className="grid-bottom-panel__footer">
                <div className="grid-bottom-panel__draw">
                  <img
                    className="grid-bottom-panel__icon"
                    src="/img/ui/draw-info-icon.png"
                    alt=""
                  />
                  <span>{ticketCopy.drawLabel}{drawNumber}</span>
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
