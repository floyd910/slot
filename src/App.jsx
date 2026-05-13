import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Play, RotateCcw, WifiOff } from "lucide-react";
import { frameApi } from "./api/frameApi.js";
import ActionPanel from "./components/ActionPanel.jsx";
import BottomBar from "./components/BottomBar.jsx";
import DoubleMode from "./components/DoubleMode.jsx";
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

const initialContext = readFrameParams();
const REQUEST_TIMEOUT_MS = 9000;
const RETRYABLE_CODES = new Set(["NETWORK_ERROR", "TIMEOUT"]);

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
  const [stake, setStake] = useState(10);
  const [visualMode, setVisualMode] = useState(false);
  const [expandedBoard, setExpandedBoard] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [showPaytable, setShowPaytable] = useState(false);
  const [paytableRows, setPaytableRows] = useState([]);
  const [paytableStatus, setPaytableStatus] = useState("idle");
  const [doubleState, setDoubleState] = useState({ active: false, loading: false, step: 1, status: "Choose left or right" });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [spinHistory, setSpinHistory] = useState([]);
  const playSound = useGameAudio();
  const emitSound = useCallback(
    (event) => {
      if (soundEnabled) playSound(event);
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
    () => combinations.find((item) => item.id === selectedCombinationId) ?? combinations[0],
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
        allowedOrigins: Array.from(new Set([...(current.allowedOrigins ?? []), ...nextOrigins])),
      };
      persistInitContext(merged);
      return merged;
    });
    if (nextContext.gameId) setCurrentGame(nextContext.gameId);
  }, []);

  const handleCommand = useCallback((command, payload) => {
    if (command === "FORCE_RELOAD") window.location.reload();
    if (command === "UPDATE_THEME") mergeInitContext({ theme: payload.theme ?? "dark", initSource: "postMessage" });
    if (command === "UPDATE_LOCALE") mergeInitContext({ locale: payload.locale ?? payload.language ?? "en", initSource: "postMessage" });
    if (command === "UPDATE_BALANCE") {
      setPlayer((current) => ({ ...current, balance: payload.balance ?? current?.balance }));
      setLastKnownState("balance-updated");
    }
    if (command === "OPEN_MODAL" && payload.modal === "paytable") setShowPaytable(true);
    if (command === "CLOSE_MODULE") {
      setStatus("session-expired");
      setError("Module was closed by the host page");
    }
  }, [mergeInitContext]);

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
      postEvent(nextStatus === "session-expired" ? "SESSION_EXPIRED" : nextStatus === "access-denied" ? "AUTH_REQUIRED" : "ERROR", {
        code: runtimeError?.code ?? "UNKNOWN",
        message,
      });
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
      const configError = new Error(`Missing required init context: ${missing.join(", ")}`);
      configError.code = missing.includes("token") ? "ACCESS_DENIED" : missing.includes("sessionId") ? "INVALID_SESSION" : "CONFIGURATION_ERROR";
      reportError(configError);
      return;
    }

    try {
      setStatus("bootstrap-loading");
      setError("");
      persistInitContext(context);
      const session = await withTimeout(frameApi.initSession(context), "Session bootstrap");
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
      postEvent("LOADED", { gameId: context.gameId, userId: session.player.id });
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
      setError("Connection lost. The last operation may still finish on the server.");
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
    if (paytableRows.length) return;
    try {
      setPaytableStatus("loading");
      setPaytableRows(await withTimeout(frameApi.getPaytable(), "Paytable"));
      setPaytableStatus("ready");
    } catch (paytableError) {
      setPaytableStatus("error");
      postEvent("ERROR", { message: paytableError.message, code: paytableError.code ?? "PAYTABLE_ERROR" });
    }
  };

  const handleSpin = async ({ demo = false } = {}) => {
    if (!selectedCombination || status === "processing" || doubleState.loading) return;
    const isFreeSpin = freeSpinsLeft > 0;
    const totalStake = stake * selectedCombination.groups.length;
    const requestId = buildRequestId("spin");

    if (!demo && !isFreeSpin && player.balance < totalStake) {
      reportError(Object.assign(new Error("Insufficient balance for selected combination"), { code: "ACCESS_DENIED" }));
      return;
    }

    try {
      emitSound("spin");
      setStatus("processing");
      setLastKnownState("spin-submitted");
      setError("");
      setPlayer((current) =>
        demo || isFreeSpin ? current : { ...current, balance: Number((current.balance - totalStake).toFixed(2)) },
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
      const shouldCreditWin = !demo && result.WinSum > 0;
      setGrid(result.grid);
      setGridRevealKey((key) => key + 1);
      setSpinResult({ ...result, creditedToBalance: shouldCreditWin });
      if (shouldCreditWin) {
        setPlayer((current) => ({ ...current, balance: Number((current.balance + result.WinSum).toFixed(2)) }));
      }
      setSpinHistory((current) => [
        {
          id: result.idCard,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          combination: selectedCombination.title,
          stake: totalStake,
          win: result.WinSum,
        },
        ...current,
      ].slice(0, 10));

      if (isFreeSpin) {
        setFreeSpinsLeft((left) => Math.max(0, left - 1));
      } else if (result.FreeSpin) {
        setFreeSpinsTotal(15);
        setFreeSpinsLeft(15);
      }

      setStatus("ready");
      setLastKnownState(result.WinSum > 0 ? "win" : "lose");
      emitSound(result.WinSum > 0 ? "win" : "lose");
      postEvent("LOADED", { requestId, state: "spin-complete" });
      postEvent("UPDATE_BALANCE", {
        balance: Number((player.balance - (demo || isFreeSpin ? 0 : totalStake) + (shouldCreditWin ? result.WinSum : 0)).toFixed(2)),
      });
    } catch (spinError) {
      reportError(spinError, "Spin result is unknown. Check status before retrying.");
    }
  };

  const cycleStake = (direction) => {
    const index = stakeOptions.indexOf(stake);
    const nextIndex = (index + direction + stakeOptions.length) % stakeOptions.length;
    setStake(stakeOptions[nextIndex]);
  };

  const cycleCombination = (direction) => {
    if (!combinations.length) return;
    const index = combinations.findIndex((item) => item.id === selectedCombinationId);
    const nextIndex = (index + direction + combinations.length) % combinations.length;
    setSelectedCombinationId(combinations[nextIndex].id);
  };

  const collectWin = async () => {
    if (!spinResult?.idCard || spinResult.WinSum <= 0 || status === "processing") return;
    const requestId = buildRequestId("pay");
    const payout = spinResult.WinSum;
    const alreadyCredited = spinResult.creditedToBalance;
    try {
      setStatus("processing");
      setLastKnownState("pay-submitted");
      await withTimeout(frameApi.pay({ idCard: spinResult.idCard, requestId }), "Pay");
      if (!alreadyCredited) {
        setPlayer((current) => ({ ...current, balance: Number((current.balance + payout).toFixed(2)) }));
      }
      setDoubleState({ active: false, loading: false, step: 1, status: "Choose left or right" });
      setSpinResult(null);
      setStatus("ready");
      setLastKnownState("paid");
      emitSound("cashout");
      if (!alreadyCredited) postEvent("UPDATE_BALANCE", { balance: Number((player.balance + payout).toFixed(2)) });
    } catch (payError) {
      reportError(payError, "Payment status is unknown. Check status before retrying.");
    }
  };

  const enterDouble = () => {
    if (spinResult?.WinSum > 0) {
      emitSound("double");
      if (spinResult.creditedToBalance) {
        const doubleStake = spinResult.WinSum;
        setPlayer((current) => ({ ...current, balance: Number((current.balance - doubleStake).toFixed(2)) }));
        setSpinResult((current) => ({ ...current, creditedToBalance: false }));
      }
      setDoubleState({ active: true, loading: false, step: 1, status: "Choose left or right" });
      setLastKnownState("double");
    }
  };

  const pickDouble = async (side) => {
    if (!spinResult?.idCard || doubleState.loading || status === "processing") return;
    try {
      emitSound("double");
      setStatus("processing");
      setDoubleState((current) => ({ ...current, loading: true, status: `Opening ${side}...` }));
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
      setSpinResult((current) => ({ ...current, WinSum: result.WinSum, creditedToBalance: false }));
      setDoubleState((current) => ({
        active: result.WinSum > 0,
        loading: false,
        step: current.step + 1,
        status: result.status === "win" ? `${result.side} won. Double again or take money.` : `${result.side} lost.`,
      }));
      setStatus("ready");
      setLastKnownState(result.status === "win" ? "double-win" : "double-lose");
      emitSound(result.status === "win" ? "win" : "lose");
    } catch (doubleError) {
      setDoubleState((current) => ({ ...current, loading: false, status: "Retry double request" }));
      reportError(doubleError, "Double result is unknown. Check status before retrying.");
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
    if (action === "visual") setVisualMode((value) => !value);
    if (action === "fullscreen") setExpandedBoard((value) => !value);
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

  const modeLabel = currentGame ? (visualMode ? "Visual Mode" : "Lottery Mode") : "Game Select";
  const totalPurchase = Number((stake * (selectedCombination?.groups.length ?? 0)).toFixed(2));
  const isBusy = status === "initial-loading" || status === "bootstrap-loading" || status === "processing";
  const spinButtonDisabled = status === "initial-loading" || status === "bootstrap-loading";
  const hideHeader = context.mode === "embedded" && context.featureFlags?.hiddenHeader !== false;
  const shellClass = `frame-app mode-${context.mode} theme-${context.theme}${hideHeader ? " headerless" : ""}${expandedBoard ? " expanded-board" : ""}`;
  const runtimeState = !["ready", "empty", "processing"].includes(status) ? (
    <RuntimeState status={status} error={error} mode={context.mode} onRetry={init} />
  ) : null;

  const content = runtimeState ?? (!currentGame ? (
    <Lobby games={games} loading={status === "bootstrap-loading"} error={status === "empty" ? stateCopy.empty : ""} onSelectGame={setCurrentGame} />
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
    <main className="game-shell">
      <aside className="combination-panel">
        {combinations.map((combo) => (
          <button
            key={combo.id}
            className={combo.id === selectedCombinationId ? "active" : ""}
            type="button"
            disabled={isBusy}
            onClick={() => setSelectedCombinationId(combo.id)}
          >
            <strong>{combo.title}</strong>
            <span>{combo.label}</span>
          </button>
        ))}
      </aside>
      <section className="center-stage" aria-busy={isBusy}>
        {error && (
          <div className="inline-alert">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
        <LotteryGrid
          grid={grid}
          revealKey={gridRevealKey}
          visualMode={visualMode}
          winningCells={spinResult?.winningCells}
          scatterCells={spinResult?.scatterCells}
        />
        <ResultPanel result={spinResult} freeSpinsTotal={freeSpinsTotal} freeSpinsLeft={freeSpinsLeft} onDouble={enterDouble} />
        <div className="spin-controls">
          <button type="button" className="secondary-button" disabled={spinButtonDisabled} onClick={() => handleSpin({ demo: true })}>
            <RotateCcw size={18} />
            Demo Spin
          </button>
          <button type="button" className="primary-button" disabled={spinButtonDisabled} onClick={() => handleSpin()}>
            <Play size={18} />
            {freeSpinsLeft > 0 ? "Free Spin" : "Participate"}
          </button>
        </div>
      </section>
      <aside className="win-table">
        <h3>Таблица выигрышей</h3>
        <PayoutTable rows={paytableRows} />
        <div className="draw-info">
          <strong>Тираж № {spinResult?.idCard ?? "4155974"}</strong>
          <span>{spinResult ? `Выигрыш: ${spinResult.WinSum.toFixed(2)}` : "Данных нет. Купите билет."}</span>
        </div>
      </aside>
    </main>
  ));

  return (
    <div className={shellClass} data-module-mode={context.mode}>
      {!hideHeader && <TopBar player={player} mode={modeLabel} context={context} onBack={handleBack} onFullscreen={requestFullscreen} />}
      <div className="frame-content">
        {currentGame && !runtimeState && <ActionPanel onAction={handleAction} disabled={isBusy} soundEnabled={soundEnabled} expanded={expandedBoard} />}
        {content}
      </div>
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
          onDecreaseCombination={() => cycleCombination(-1)}
          onIncreaseCombination={() => cycleCombination(1)}
          onDecreaseStake={() => cycleStake(-1)}
          onIncreaseStake={() => cycleStake(1)}
          onSpin={() => handleSpin()}
          onBuyPrizeGame={enterDouble}
        />
      )}
      {showPaytable && (
        <Paytable
          rows={paytableRows}
          loading={paytableStatus === "loading"}
          error={paytableStatus === "error" ? "Could not load payment table" : ""}
          onClose={() => setShowPaytable(false)}
        />
      )}
      {showGameMenu && <GameMenu history={spinHistory} onClose={() => setShowGameMenu(false)} />}
    </div>
  );
}

function GameMenu({ history, onClose }) {
  const [view, setView] = useState("history");

  return (
    <div className="game-menu-layer" role="dialog" aria-modal="true" aria-label="Game history and rules">
      <div className="game-menu-panel">
        <div className="game-menu-head">
          <strong>Меню игры</strong>
          <button type="button" onClick={onClose}>Закрыть</button>
        </div>
        <div className="game-menu-tabs" role="tablist" aria-label="Game menu sections">
          <button className={view === "history" ? "active" : ""} type="button" role="tab" aria-selected={view === "history"} onClick={() => setView("history")}>
            История
          </button>
          <button className={view === "rules" ? "active" : ""} type="button" role="tab" aria-selected={view === "rules"} onClick={() => setView("rules")}>
            Правила
          </button>
        </div>
        <div className="game-menu-body">
          {view === "history" ? <HistoryView history={history} /> : <RulesView />}
        </div>
      </div>
    </div>
  );
}

function HistoryView({ history }) {
  return (
    <section className="game-menu-section">
      <h4>История спинов</h4>
      <div className="history-list">
        {history.length ? history.map((item) => (
          <div key={`${item.id}-${item.time}`} className="history-row">
            <span>{item.time}</span>
            <strong>№ {item.id}</strong>
            <em>{item.combination}</em>
            <b>{Number(item.win).toFixed(2)}</b>
          </div>
        )) : <p>Пока нет сыгранных тиражей.</p>}
      </div>
    </section>
  );
}

function RulesView() {
  return (
    <section className="game-menu-section">
      <h4>Правила</h4>
      <ol className="rules-list">
        <li>Выберите комбинацию слева: 1, 3, 5 или 7 групп координат.</li>
        <li>Выберите ставку. Сумма покупки считается как ставка на каждую группу.</li>
        <li>После покупки билет участвует в тираже, а выигрыш считается по таблице выплат.</li>
        <li>Совпадение 4 одинаковых чисел в выбранной группе дает выигрыш по строке числа и колонке x4.</li>
        <li>Скаттеры запускают призовые спины с множителем x3, когда правило активируется в результате.</li>
        <li>После выигрыша можно забрать деньги или попробовать удвоение.</li>
      </ol>
    </section>
  );
}

function PayoutTable({ rows }) {
  return (
    <table className="inline-paytable">
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
            <th>{row.symbol}</th>
            {[1, 2, 3, 4, 5].map((count) => (
              <td key={count}>{row[`x${count}`] == null ? "" : Number(row[`x${count}`]).toFixed(2)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RuntimeState({ status, error, mode, onRetry }) {
  const canRetry = ["network-error", "error", "configuration-error", "initial-loading"].includes(status);
  return (
    <main className="runtime-state">
      <div className="state-icon">{status === "network-error" ? <WifiOff size={32} /> : <AlertTriangle size={32} />}</div>
      <h1>{stateCopy[status] ?? stateCopy.error}</h1>
      <p>{error || (mode === "embedded" ? "Waiting for host initialization." : "Open the module with a valid signed context.")}</p>
      {canRetry && (
        <button type="button" className="primary-button" onClick={onRetry}>
          <RotateCcw size={18} />
          Retry
        </button>
      )}
    </main>
  );
}

function ResultPanel({ result, freeSpinsTotal, freeSpinsLeft, onDouble }) {
  if (!result) {
    return <div className="result-panel muted">Waiting for the next draw</div>;
  }

  return (
    <div className="result-panel">
      <div>
        <small>Spin ID</small>
        <strong>{result.idCard}</strong>
      </div>
      <div>
        <small>Win</small>
        <strong>{result.BaseWinSum?.toFixed(2) ?? result.WinSum.toFixed(2)}</strong>
      </div>
      {result.multiplier > 1 && (
        <div>
          <small>Free Spins x3</small>
          <strong>{result.WinSum.toFixed(2)}</strong>
        </div>
      )}
      {result.scatterCount >= 2 && (
        <div>
          <small>Scatters</small>
          <strong>{result.scatterCount}</strong>
        </div>
      )}
      {freeSpinsTotal > 0 && (
        <div>
          <small>Free Spins</small>
          <strong>
            {freeSpinsLeft}/{freeSpinsTotal}
          </strong>
        </div>
      )}
      {result.WinSum > 0 && (
        <button type="button" className="secondary-button" onClick={onDouble}>
          Double
        </button>
      )}
    </div>
  );
}
