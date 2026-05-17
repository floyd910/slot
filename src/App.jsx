import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { AlertTriangle, RotateCcw, WifiOff } from "lucide-react";
import { frameApi } from "./api/frameApi.js";
import ActionPanel from "./components/ActionPanel.jsx";
import BottomBar from "./components/BottomBar.jsx";
import DoubleMode from "./components/DoubleMode.jsx";
import GameMenu from "./components/GameMenu.jsx";
import Lobby from "./components/Lobby.jsx";
import LotteryGrid from "./components/LotteryGrid.jsx";
import Paytable from "./components/Paytable.jsx";
import TopBar from "./components/TopBar.jsx";
import { stakeOptions } from "./data/mockData.js";
import {
  buildRequestId,
  getMissingRequiredContext,
  persistInitContext,
  readFrameParams,
  useFrameBridge,
} from "./hooks/useFrameBridge.js";
import { useGameAudio } from "./hooks/useGameAudio.js";
import WinningsDashboard from "./components/WinningDashboard.jsx";

const initialContext = readFrameParams();
const REQUEST_TIMEOUT_MS = 9000;
const RETRYABLE_CODES = new Set(["NETWORK_ERROR", "TIMEOUT"]);
const emptyDoubling = {
  active: false,
  entered: false,
  loading: false,
  step: 0,
  marks: ["", "", "", "", ""],
  currentAmount: 0,
  deferredBalance: 0,
  split: 0,
  revealKey: 0,
  changedIndex: -1,
};

const stateCopy = {
  "initial-loading": "Preparing module...",
  "bootstrap-loading": "Validating session...",
  ready: "Ready",
  processing: "Operation is being processed...",
  empty: "No games are available",
  error: "Something went wrong",
  "network-error": "Network connection was interrupted",
  "session-expired": "Session expired",
  "unsupported-environment": "This environment is not supported",
  maintenance: "Module is temporarily unavailable",
  "invalid-session": "Invalid session",
  "access-denied": "Access denied",
  "configuration-error": "Configuration error",
};

const withTimeout = (promise, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        const error = new Error(`${label} timed out`);
        error.code = "TIMEOUT";
        reject(error);
      }, REQUEST_TIMEOUT_MS);
    }),
  ]);

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const normalizeRuntimeStatus = (error) => {
  if (!navigator.onLine) return "network-error";
  if (error?.code === "MAINTENANCE") return "maintenance";
  if (error?.code === "INVALID_SESSION") return "invalid-session";
  if (error?.code === "ACCESS_DENIED") return "access-denied";
  if (error?.code === "SESSION_EXPIRED") return "session-expired";
  if (error?.code === "CONFIGURATION_ERROR") return "configuration-error";
  if (RETRYABLE_CODES.has(error?.code)) return "network-error";
  return "error";
};

export default function App() {
  const [context, setContext] = useState(initialContext);
  const [status, setStatus] = useState("initial-loading");
  const [error, setError] = useState("");
  const [lastKnownState, setLastKnownState] = useState(null);
  const [player, setPlayer] = useState(null);
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(initialContext.gameId ?? null);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombinationId, setSelectedCombinationId] = useState(3);
  const [grid, setGrid] = useState({ A: [], B: [], C: [], D: [] });
  const [gridRevealKey, setGridRevealKey] = useState(0);
  const [gridAnimation, setGridAnimation] = useState("idle");
  const [stake, setStake] = useState(10);
  const [visualMode, setVisualMode] = useState(false);
  const [expandedBoard, setExpandedBoard] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [showPaytable, setShowPaytable] = useState(false);
  const [paytableRows, setPaytableRows] = useState([]);
  const [paytableStatus, setPaytableStatus] = useState("idle");
  const [doubleState, setDoubleState] = useState({
    active: false,
    loading: false,
    step: 1,
    status: "Choose left or right",
  });
  const [doublingState, setDoublingState] = useState(emptyDoubling);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [spinHistory, setSpinHistory] = useState([]);
  const playSound = useGameAudio();
  const emitSound = useCallback(
    (event, payload) => {
      if (soundEnabled) playSound(event, payload);
    },
    [playSound, soundEnabled],
  );

  const diagnostics = useMemo(
    () => ({
      initSource: context.initSource,
      lastKnownState,
      online: navigator.onLine,
    }),
    [context.initSource, lastKnownState],
  );

  const selectedCombination = useMemo(
    () =>
      combinations.find((item) => item.id === selectedCombinationId) ??
      combinations[0],
    [combinations, selectedCombinationId],
  );

  const mergeInitContext = useCallback((nextContext) => {
    setContext((current) => {
      const nextOrigins = Array.isArray(nextContext.allowedOrigins)
        ? nextContext.allowedOrigins
        : nextContext.allowedOrigins
          ? [nextContext.allowedOrigins]
          : [];
      const merged = {
        ...current,
        ...nextContext,
        featureFlags: {
          ...(current.featureFlags ?? {}),
          ...(nextContext.featureFlags ?? {}),
        },
        allowedOrigins: Array.from(
          new Set([...(current.allowedOrigins ?? []), ...nextOrigins]),
        ),
      };
      persistInitContext(merged);
      return merged;
    });
    if (nextContext.gameId) setCurrentGame(nextContext.gameId);
  }, []);

  const handleCommand = useCallback(
    (command, payload) => {
      if (command === "FORCE_RELOAD") window.location.reload();
      if (command === "UPDATE_THEME")
        mergeInitContext({
          theme: payload.theme ?? "dark",
          initSource: "postMessage",
        });
      if (command === "UPDATE_LOCALE")
        mergeInitContext({
          locale: payload.locale ?? payload.language ?? "en",
          initSource: "postMessage",
        });
      if (command === "UPDATE_BALANCE") {
        setPlayer((current) => ({
          ...current,
          balance: payload.balance ?? current?.balance,
        }));
        setLastKnownState("balance-updated");
      }
      if (command === "OPEN_MODAL" && payload.modal === "paytable")
        setShowPaytable(true);
      if (command === "CLOSE_MODULE") {
        setStatus("session-expired");
        setError("Module was closed by the host page");
      }
    },
    [mergeInitContext],
  );

  const { postEvent } = useFrameBridge({
    context,
    diagnostics,
    onCommand: handleCommand,
    onInitContext: mergeInitContext,
  });

  const reportError = useCallback(
    (runtimeError, fallbackMessage = "Request failed") => {
      const nextStatus = normalizeRuntimeStatus(runtimeError);
      const message = runtimeError?.message || fallbackMessage;
      setError(message);
      setStatus(nextStatus);
      setLastKnownState(nextStatus);
      postEvent(
        nextStatus === "session-expired"
          ? "SESSION_EXPIRED"
          : nextStatus === "access-denied"
            ? "AUTH_REQUIRED"
            : "ERROR",
        {
          code: runtimeError?.code ?? "UNKNOWN",
          message,
        },
      );
    },
    [postEvent],
  );

  const init = useCallback(async () => {
    const missing = getMissingRequiredContext(context);
    if (missing.length) {
      if (context.mode === "embedded" && context.initSource === "missing") {
        setStatus("initial-loading");
        setError("");
        return;
      }
      const configError = new Error(
        `Missing required init context: ${missing.join(", ")}`,
      );
      configError.code = missing.includes("token")
        ? "ACCESS_DENIED"
        : missing.includes("sessionId")
          ? "INVALID_SESSION"
          : "CONFIGURATION_ERROR";
      reportError(configError);
      return;
    }

    try {
      setStatus("bootstrap-loading");
      setError("");
      persistInitContext(context);
      const session = await withTimeout(
        frameApi.initSession(context),
        "Session bootstrap",
      );
      const paymentRows = await withTimeout(frameApi.getPaytable(), "Paytable");
      setPlayer(session.player);
      setGames(session.games);
      setCombinations(session.combinations);
      setGrid(session.grid);
      setPaytableRows(paymentRows);
      setPaytableStatus("ready");
      setCurrentGame((current) => current ?? context.gameId ?? null);
      setStatus(session.games.length ? "ready" : "empty");
      setLastKnownState("ready");
      postEvent("LOADED", {
        gameId: context.gameId,
        userId: session.player.id,
      });
    } catch (initError) {
      reportError(initError, "Could not initialize iframe module");
    }
  }, [context, postEvent, reportError]);

  useEffect(() => {
    if (!window.ResizeObserver || !window.Promise) {
      setStatus("unsupported-environment");
      setError("Browser is missing required iframe APIs");
      return;
    }
    init();
  }, [init]);

  useEffect(() => {
    const reconnect = () => {
      if (status === "network-error") init();
    };
    const disconnect = () => {
      setStatus("network-error");
      setError(
        "Connection lost. The last operation may still finish on the server.",
      );
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", disconnect);
    return () => {
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", disconnect);
    };
  }, [init, status]);

  const loadPaytable = async () => {
    setShowPaytable(true);
    setPaytableStatus("ready");
  };

  const handleSpin = async ({ demo = false } = {}) => {
    if (
      !selectedCombination ||
      status === "processing" ||
      doubleState.loading ||
      doublingState.loading
    )
      return;
    const isFreeSpin = freeSpinsLeft > 0;
    const totalStake = stake * selectedCombination.groups.length;
    const requestId = buildRequestId("spin");
    const spinStartedAt = performance.now();

    if (!demo && !isFreeSpin && player.balance < totalStake) {
      reportError(
        Object.assign(
          new Error("Insufficient balance for selected combination"),
          { code: "ACCESS_DENIED" },
        ),
      );
      return;
    }

    try {
      if (visualMode) emitSound("spin");
      setStatus("processing");
      setGridAnimation("spinning");
      setLastKnownState("spin-submitted");
      setError("");
      setPlayer((current) =>
        demo || isFreeSpin
          ? current
          : {
              ...current,
              balance: Number((current.balance - totalStake).toFixed(2)),
            },
      );
      const result = await withTimeout(
        frameApi.spin({
          stake,
          lines: selectedCombination.groups.length,
          isDemo: demo,
          isFreeSpin,
          selectedCombination,
          requestId,
        }),
        "Spin",
      );
      const closeTimeLeft = visualMode
        ? Math.max(0, 1500 - (performance.now() - spinStartedAt))
        : 0;
      if (closeTimeLeft > 0) await wait(closeTimeLeft);
      const isDigitWin = !visualMode && result.WinSum > 0;
      const shouldCreditWin = !demo && result.WinSum > 0 && !isDigitWin;
      if (visualMode) {
        setGrid(result.grid);
        setGridRevealKey((key) => key + 1);
        setGridAnimation("revealing");
      } else {
        flushSync(() => {
          setGrid(result.grid);
          setGridRevealKey((key) => key + 1);
          setGridAnimation("revealing");
        });
        window.requestAnimationFrame(() => emitSound("reveal"));
      }
      window.setTimeout(() => setGridAnimation("settled"), 1500);
      setSpinResult({ ...result, creditedToBalance: shouldCreditWin });
      setDoublingState(
        isDigitWin
          ? {
              active: true,
              entered: false,
              loading: false,
              step: 0,
              marks: ["", "", "", "", ""],
              currentAmount: result.WinSum,
              deferredBalance: 0,
              split: 0,
              revealKey: 0,
              changedIndex: -1,
            }
          : emptyDoubling,
      );
      if (shouldCreditWin) {
        setPlayer((current) => ({
          ...current,
          balance: Number((current.balance + result.WinSum).toFixed(2)),
        }));
      }
      setSpinHistory((current) =>
        [
          {
            id: result.idCard,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            combination: selectedCombination.title,
            stake: totalStake,
            win: result.WinSum,
          },
          ...current,
        ].slice(0, 10),
      );

      if (isFreeSpin) {
        setFreeSpinsLeft((left) => Math.max(0, left - 1));
      } else if (result.FreeSpin) {
        setFreeSpinsTotal(15);
        setFreeSpinsLeft(15);
        emitSound("freeTickets");
      }

      await wait(1500);
      setStatus("ready");
      setLastKnownState(result.WinSum > 0 ? "win" : "lose");
      emitSound(result.WinSum > 0 ? "win" : "lose", result);
      postEvent("LOADED", { requestId, state: "spin-complete" });
      postEvent("UPDATE_BALANCE", {
        balance: Number(
          (
            player.balance -
            (demo || isFreeSpin ? 0 : totalStake) +
            (shouldCreditWin ? result.WinSum : 0)
          ).toFixed(2),
        ),
      });
    } catch (spinError) {
      reportError(
        spinError,
        "Spin result is unknown. Check status before retrying.",
      );
    }
  };

  const cycleStake = (direction) => {
    emitSound("amount");
    const index = stakeOptions.indexOf(stake);
    const nextIndex =
      (index + direction + stakeOptions.length) % stakeOptions.length;
    setStake(stakeOptions[nextIndex]);
  };

  const cycleCombination = (direction) => {
    if (!combinations.length) return;
    emitSound("buttonPress");
    const index = combinations.findIndex(
      (item) => item.id === selectedCombinationId,
    );
    const nextIndex =
      (index + direction + combinations.length) % combinations.length;
    setSelectedCombinationId(combinations[nextIndex].id);
  };

  const collectWin = async () => {
    if (
      !spinResult?.idCard ||
      spinResult.WinSum <= 0 ||
      status === "processing"
    )
      return;
    const requestId = buildRequestId("pay");
    const payout = spinResult.WinSum;
    const alreadyCredited = spinResult.creditedToBalance;
    try {
      setStatus("processing");
      setLastKnownState("pay-submitted");
      await withTimeout(
        frameApi.pay({ idCard: spinResult.idCard, requestId }),
        "Pay",
      );
      if (!alreadyCredited) {
        setPlayer((current) => ({
          ...current,
          balance: Number((current.balance + payout).toFixed(2)),
        }));
      }
      setDoubleState({
        active: false,
        loading: false,
        step: 1,
        status: "Choose left or right",
      });
      setDoublingState(emptyDoubling);
      setSpinResult(null);
      setStatus("ready");
      setLastKnownState("paid");
      emitSound("cashout");
      if (!alreadyCredited)
        postEvent("UPDATE_BALANCE", {
          balance: Number((player.balance + payout).toFixed(2)),
        });
    } catch (payError) {
      reportError(
        payError,
        "Payment status is unknown. Check status before retrying.",
      );
    }
  };

  const enterDouble = () => {
    if (spinResult?.WinSum > 0) {
      emitSound("double");
      if (spinResult.creditedToBalance) {
        const doubleStake = spinResult.WinSum;
        setPlayer((current) => ({
          ...current,
          balance: Number((current.balance - doubleStake).toFixed(2)),
        }));
        setSpinResult((current) => ({ ...current, creditedToBalance: false }));
      }
      setDoubleState({
        active: true,
        loading: false,
        step: 1,
        status: "Choose left or right",
      });
      setLastKnownState("double");
    }
  };

  const playFooterDouble = async () => {
    if (!spinResult?.idCard || doublingState.loading || status === "processing")
      return;
    const step = doublingState.step || 0;
    const currentAmount = Number(
      doublingState.currentAmount || spinResult.WinSum || 0,
    );
    if (step >= 5 || currentAmount <= 0) return;
    if (!doublingState.entered) {
      emitSound("double");
      if (spinResult.creditedToBalance) {
        setPlayer((current) => ({
          ...current,
          balance: Number((current.balance - spinResult.WinSum).toFixed(2)),
        }));
        setSpinResult((current) =>
          current ? { ...current, creditedToBalance: false } : current,
        );
      }
      setDoublingState((current) => ({
        ...emptyDoubling,
        ...current,
        active: true,
        entered: true,
        loading: false,
        currentAmount,
        deferredBalance: Number(current.deferredBalance ?? 0),
      }));
      setLastKnownState("double");
      return;
    }

    const deferredBalance = Number(doublingState.deferredBalance ?? 0);
    try {
      emitSound("double");
      setStatus("processing");
      setDoublingState((current) => ({
        ...emptyDoubling,
        ...current,
        active: true,
        entered: true,
        loading: true,
        currentAmount,
        changedIndex: step,
      }));
      const result = await withTimeout(
        frameApi.double({
          idCard: spinResult.idCard,
          wasDouble: step + 1,
          sum: currentAmount,
          side: "x2",
          requestId: buildRequestId("double"),
        }),
        "Double",
      );
      const won = result.status === "win" && result.WinSum > 0;
      const visibleWin = won
        ? Number((result.WinSum + deferredBalance).toFixed(2))
        : deferredBalance;
      setSpinResult((current) =>
        current
          ? { ...current, WinSum: visibleWin, creditedToBalance: false }
          : current,
      );
      setDoublingState((current) => {
        const marks = [...current.marks];
        marks[step] = won ? "x2" : "x0";
        return {
          ...current,
          active: won && step + 1 < 5 && result.WinSum > 0,
          loading: false,
          step: step + 1,
          marks,
          currentAmount: won ? result.WinSum : 0,
          revealKey: current.revealKey + 1,
          changedIndex: step,
        };
      });
      setStatus("ready");
      setLastKnownState(won ? "double-win" : "double-lose");
      emitSound(won ? "win" : "lose", result);
    } catch (doubleError) {
      setDoublingState((current) => ({ ...current, loading: false }));
      reportError(
        doubleError,
        "Double result is unknown. Check status before retrying.",
      );
    }
  };

  const splitFooterDouble = () => {
    if (
      !doublingState.entered ||
      !doublingState.active ||
      doublingState.loading ||
      doublingState.currentAmount <= 0
    )
      return;
    setDoublingState((current) => {
      if (
        !current.entered ||
        !current.active ||
        current.loading ||
        current.currentAmount <= 0
      )
        return current;
      const half = Number((current.currentAmount / 2).toFixed(2));
      if (half <= 0) return current;
      return {
        ...current,
        currentAmount: half,
        deferredBalance: Number(
          ((current.deferredBalance ?? 0) + half).toFixed(2),
        ),
        split: (current.split ?? 0) + 1,
      };
    });
  };

  const resetFooterDoubleSplit = () => {
    if (
      !doublingState.entered ||
      !doublingState.active ||
      doublingState.loading ||
      !doublingState.split
    )
      return;
    setDoublingState((current) => ({
      ...current,
      currentAmount: Number(
        ((current.currentAmount ?? 0) + (current.deferredBalance ?? 0)).toFixed(
          2,
        ),
      ),
      deferredBalance: 0,
      split: 0,
    }));
  };

  const pickDouble = async (side) => {
    if (!spinResult?.idCard || doubleState.loading || status === "processing")
      return;
    try {
      emitSound("double");
      setStatus("processing");
      setDoubleState((current) => ({
        ...current,
        loading: true,
        status: `Opening ${side}...`,
      }));
      const result = await withTimeout(
        frameApi.double({
          idCard: spinResult.idCard,
          wasDouble: doubleState.step,
          sum: spinResult.WinSum,
          side,
          requestId: buildRequestId("double"),
        }),
        "Double",
      );
      setSpinResult((current) => ({
        ...current,
        WinSum: result.WinSum,
        creditedToBalance: false,
      }));
      setDoubleState((current) => ({
        active: result.WinSum > 0,
        loading: false,
        step: current.step + 1,
        status:
          result.status === "win"
            ? `${result.side} won. Double again or take money.`
            : `${result.side} lost.`,
      }));
      setStatus("ready");
      setLastKnownState(result.status === "win" ? "double-win" : "double-lose");
      emitSound(result.status === "win" ? "win" : "lose");
    } catch (doubleError) {
      setDoubleState((current) => ({
        ...current,
        loading: false,
        status: "Retry double request",
      }));
      reportError(
        doubleError,
        "Double result is unknown. Check status before retrying.",
      );
    }
  };

  const handleAction = (action) => {
    if (action !== "sound") emitSound("click");
    if (action === "sound") {
      setSoundEnabled((enabled) => !enabled);
      return;
    }
    if (action === "cashout") collectWin();
    if (action === "info") loadPaytable();
    if (action === "visual") {
      setVisualMode((value) => {
        const nextValue = !value;
        setExpandedBoard(nextValue);
        return nextValue;
      });
    }
    if (action === "fullscreen" && !visualMode) setExpandedBoard((value) => !value);
    if (action === "menu") setShowGameMenu(true);
    if (action === "stake") {
      cycleStake(1);
    }
    if (action === "combo") {
      cycleCombination(1);
    }
    if (action === "double-left") pickDouble("left");
    if (action === "double-right") pickDouble("right");
  };

  const requestFullscreen = () => {
    if (context.mode === "embedded") {
      postEvent("REQUEST_FULLSCREEN", { gameId: currentGame });
      return;
    }
    document.documentElement.requestFullscreen?.();
  };

  const handleBack = () => {
    if (context.mode === "embedded") {
      postEvent("REQUEST_CLOSE", { gameId: currentGame });
      return;
    }
    if (context.returnUrl) {
      window.location.assign(context.returnUrl);
      return;
    }
    window.history.back();
  };

  const modeLabel = currentGame
    ? visualMode
      ? "Visual Mode"
      : "Lottery Mode"
    : "Game Select";
  const totalPurchase = Number(
    (stake * (selectedCombination?.groups.length ?? 0)).toFixed(2),
  );
  const isBusy =
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    status === "processing";
  const pendingDigitWin = !visualMode && Number(spinResult?.WinSum ?? 0) > 0;
  const isDoublingLocked =
    pendingDigitWin || Boolean(doublingState.active || doublingState.loading);
  const spinButtonDisabled =
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    isDoublingLocked;
  const hideHeader =
    context.mode === "embedded" && context.featureFlags?.hiddenHeader !== false;
  const shellClass = `frame-app mode-${context.mode} theme-${context.theme}${hideHeader ? " headerless" : ""}${expandedBoard || visualMode ? " expanded-board" : ""}${visualMode ? " view-2 --eldorado" : " view-1"}`;
  const runtimeState = !["ready", "empty", "processing"].includes(status) ? (
    <RuntimeState
      status={status}
      error={error}
      mode={context.mode}
      onRetry={init}
    />
  ) : null;

  const content =
    runtimeState ??
    (!currentGame ? (
      <Lobby
        games={games}
        loading={status === "bootstrap-loading"}
        error={status === "empty" ? stateCopy.empty : ""}
        onSelectGame={setCurrentGame}
      />
    ) : doubleState.active ? (
      <DoubleMode
        winSum={spinResult?.WinSum ?? 0}
        step={doubleState.step}
        status={doubleState.status}
        loading={doubleState.loading}
        onPick={pickDouble}
        onCollect={collectWin}
      />
    ) : (
      <>
        <aside className="main-container__left">
          <div
            className={`combination-group${isBusy || isDoublingLocked ? " --disabled" : ""}`}
          >
            {combinations.map((combo) => (
              <div
                key={combo.id}
                className={`combination-item${combo.id === selectedCombinationId ? " --glow" : ""}`}
                id={`combi-${combo.id}`}
                role="button"
                tabIndex={isBusy || isDoublingLocked ? -1 : 0}
                onClick={() => {
                  if (isBusy || isDoublingLocked) return;
                  emitSound("buttonPress");
                  setSelectedCombinationId(combo.id);
                }}
                onKeyDown={(event) => {
                  if (
                    isBusy ||
                    isDoublingLocked ||
                    (event.key !== "Enter" && event.key !== " ")
                  )
                    return;
                  event.preventDefault();
                  emitSound("buttonPress");
                  setSelectedCombinationId(combo.id);
                }}
              >
                <h4 className="combination-item__title">Комбинация</h4>
                <span className="combination-item__count">{combo.title}</span>
                <p className="combination-item__subTitle">
                  включающая группу координат:
                </p>
                <div className="combination-item__wrapper">
                  {getCombinationTexts(combo).map((text, index, list) => (
                    <span key={text} className="combination-item__text">
                      {text}
                      {index < list.length - 1 ? "," : ""}
                    </span>
                  ))}
                  {combo.id !== 1 && (
                    <span className="combination-item__subTitle">
                      {" "}
                      или их сочетание
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <section className="main-container__center" aria-busy={isBusy}>
          {error && (
            <div className="inline-alert">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}
          <LotteryGrid
            grid={grid}
            revealKey={gridRevealKey}
            animationState={gridAnimation}
            visualMode={visualMode}
            winningCells={spinResult?.winningCells}
            scatterCells={spinResult?.scatterCells}
            doublingState={doublingState}
          />
          <ResultPanel
            result={spinResult}
            freeSpinsTotal={freeSpinsTotal}
            freeSpinsLeft={freeSpinsLeft}
          />
        </section>

        <WinningsDashboard
          stake={stake}
          selectedCombination={selectedCombination}
          spinResult={spinResult}
        />
      </>
    ));

  return (
    <div className={shellClass} data-module-mode={context.mode}>
      {!hideHeader && (
        <TopBar
          player={player}
          mode={modeLabel}
          context={context}
          onBack={handleBack}
          onFullscreen={requestFullscreen}
        />
      )}
      <div className="game_area">
        <div className="top_bar">
          <div className="main-header combination-main-header">
            <div className="main-header__text">
              Выбор лотерейной
              <br />
              комбинации
            </div>
          </div>

          <img
            data-v-75f96f19=""
            class="main-header__image main-header__heroEn"
            src="https://lotogame.lotosport.tj/img/eldorado-logo.31ee1229.webp"
            alt="eldorado image"
          ></img>
          {currentGame && !runtimeState && (
            <ActionPanel
              onAction={handleAction}
              disabled={isBusy}
              soundEnabled={soundEnabled}
              expanded={expandedBoard}
              visualMode={visualMode}
            />
          )}
        </div>
        <div className="frame-content">{content}</div>
        {!runtimeState && (
          <BottomBar
            player={player}
            stake={stake}
            totalPurchase={totalPurchase}
            selectedCombination={selectedCombination}
            spinResult={spinResult}
            freeSpinsLeft={freeSpinsLeft}
            multiplier={freeSpinsLeft > 0 ? 3 : 1}
            disabled={isBusy}
            doublingState={doublingState}
            visualMode={visualMode}
            onDecreaseCombination={() => cycleCombination(-1)}
            onIncreaseCombination={() => cycleCombination(1)}
            onDecreaseStake={() => cycleStake(-1)}
            onIncreaseStake={() => cycleStake(1)}
            onSpin={() => handleSpin()}
            onDouble={playFooterDouble}
            onSplitDouble={splitFooterDouble}
            onResetSplit={resetFooterDoubleSplit}
            onTakeMoney={collectWin}
            onInfo={loadPaytable}
          />
        )}
        {showPaytable && (
          <Paytable
            rows={paytableRows}
            loading={paytableStatus === "loading"}
            error={
              paytableStatus === "error" ? "Could not load payment table" : ""
            }
            stake={stake}
            selectedCombination={selectedCombination}
            onClose={() => setShowPaytable(false)}
          />
        )}
        {showGameMenu && (
          <GameMenu
            history={spinHistory}
            onClose={() => setShowGameMenu(false)}
          />
        )}
      </div>
    </div>
  );
}

function getCombinationTexts(combo) {
  if (Array.isArray(combo.displayGroups)) return combo.displayGroups;
  return (combo.groups ?? []).map((group) =>
    group.map(formatCoordinate).join("-"),
  );
}

function formatCoordinate(coord) {
  return String(coord).replace(/^A/, "А").replace(/^B/, "В").replace(/^C/, "С");
}

function PayoutTable({ rows }) {
  return (
    <div className="winnings-table">
      <h2 className="winnings-table__title">Таблица выигрышей</h2>
      <table className="winnings-table__container">
        <thead>
          <tr>
            <th />
            <th>x1</th>
            <th>x2</th>
            <th>x3</th>
            <th>x4</th>
            <th>x5</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol}>
              <td>{row.symbol}</td>
              {[1, 2, 3, 4, 5].map((count) => (
                <td key={count}>
                  {row[`x${count}`] == null
                    ? ""
                    : Number(row[`x${count}`]).toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RuntimeState({ status, error, mode, onRetry }) {
  const canRetry = [
    "network-error",
    "error",
    "configuration-error",
    "initial-loading",
  ].includes(status);
  return (
    <main className="runtime-state">
      <div className="state-icon">
        {status === "network-error" ? (
          <WifiOff size={32} />
        ) : (
          <AlertTriangle size={32} />
        )}
      </div>
      <h1>{stateCopy[status] ?? stateCopy.error}</h1>
      <p>
        {error ||
          (mode === "embedded"
            ? "Waiting for host initialization."
            : "Open the module with a valid signed context.")}
      </p>
      {canRetry && (
        <button type="button" className="primary-button" onClick={onRetry}>
          <RotateCcw size={18} />
          Retry
        </button>
      )}
    </main>
  );
}

function ResultPanel({ result, freeSpinsTotal, freeSpinsLeft }) {
  const message = result
    ? getResultMessage(result, freeSpinsTotal, freeSpinsLeft)
    : "Выберите лотерейную комбинацию и сумму лотерейной ставки.";

  return (
    <div className="main-container__wrapper">
      <div className="main-container__info">
        <span>{message}</span>
      </div>
    </div>
  );
}

function getResultMessage(result, freeSpinsTotal, freeSpinsLeft) {
  if (freeSpinsTotal > 0)
    return `Призовые спины: ${freeSpinsLeft}/${freeSpinsTotal}. Выигрыш: ${result.WinSum.toFixed(2)}.`;
  if (result.scatterCount >= 2)
    return `Скаттеры: ${result.scatterCount}. Выигрыш: ${result.WinSum.toFixed(2)}.`;
  if (result.WinSum > 0)
    return `Поздравляем! Ваш выигрыш: ${result.WinSum.toFixed(2)}.`;
  return "Билет не выиграл. Выберите комбинацию и попробуйте еще раз.";
}
