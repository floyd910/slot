import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Play, RotateCcw } from "lucide-react";
import { frameApi } from "./api/frameApi.js";
import ActionPanel from "./components/ActionPanel.jsx";
import BottomBar from "./components/BottomBar.jsx";
import DoubleMode from "./components/DoubleMode.jsx";
import Lobby from "./components/Lobby.jsx";
import LotteryGrid from "./components/LotteryGrid.jsx";
import Paytable from "./components/Paytable.jsx";
import TopBar from "./components/TopBar.jsx";
import { stakeOptions } from "./data/mockData.js";
import { readFrameParams, useFrameBridge } from "./hooks/useFrameBridge.js";

const params = readFrameParams();

export default function App() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [player, setPlayer] = useState(null);
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(params.gameId ?? null);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombinationId, setSelectedCombinationId] = useState(3);
  const [grid, setGrid] = useState({ A: [], B: [], C: [], D: [] });
  const [stake, setStake] = useState(10);
  const [visualMode, setVisualMode] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [showPaytable, setShowPaytable] = useState(false);
  const [paytableRows, setPaytableRows] = useState([]);
  const [paytableStatus, setPaytableStatus] = useState("idle");
  const [doubleState, setDoubleState] = useState({ active: false, loading: false, step: 1, status: "Choose left or right" });

  const selectedCombination = useMemo(
    () => combinations.find((item) => item.id === selectedCombinationId) ?? combinations[0],
    [combinations, selectedCombinationId],
  );

  const handleCommand = useCallback((event, data) => {
    if (event === "reload") window.location.reload();
    if (event === "changeGame") setCurrentGame(data.gameId);
    if (event === "updateBalance") {
      setPlayer((current) => ({ ...current, balance: data.balance ?? current?.balance }));
    }
    if (event === "logout") {
      setCurrentGame(null);
      setStatus("error");
      setError("Session closed by parent site");
    }
  }, []);

  const { postEvent } = useFrameBridge({ params, onCommand: handleCommand });

  const init = useCallback(async () => {
    try {
      setStatus("loading");
      setError("");
      const session = await frameApi.initSession(params);
      setPlayer(session.player);
      setGames(session.games);
      setCombinations(session.combinations);
      setGrid(session.grid);
      setCurrentGame((current) => current ?? params.gameId ?? null);
      setStatus("ready");
      postEvent("gameLoaded", { gameId: params.gameId ?? null, playerId: session.player.id });
    } catch (initError) {
      setError(initError.message);
      setStatus("error");
      postEvent("error", { message: initError.message });
    }
  }, [postEvent]);

  useEffect(() => {
    init();
  }, [init]);

  const loadPaytable = async () => {
    setShowPaytable(true);
    if (paytableRows.length) return;
    try {
      setPaytableStatus("loading");
      setPaytableRows(await frameApi.getPaytable());
      setPaytableStatus("ready");
    } catch (paytableError) {
      setPaytableStatus("error");
      postEvent("error", { message: paytableError.message });
    }
  };

  const handleSpin = async ({ demo = false } = {}) => {
    if (!selectedCombination || status === "spinning" || doubleState.loading) return;
    const isFreeSpin = freeSpinsLeft > 0;
    const totalStake = stake * selectedCombination.groups.length;

    if (!demo && !isFreeSpin && player.balance < totalStake) {
      setError("Insufficient balance for selected combination");
      setStatus("error");
      postEvent("error", { message: "Insufficient balance" });
      return;
    }

    try {
      setStatus("spinning");
      setError("");
      setPlayer((current) =>
        demo || isFreeSpin ? current : { ...current, balance: Number((current.balance - totalStake).toFixed(2)) },
      );
      const result = await frameApi.spin({
        stake,
        lines: selectedCombination.groups.length,
        isDemo: demo,
        isFreeSpin,
        selectedCombination,
      });
      setGrid(result.grid);
      setSpinResult(result);

      if (isFreeSpin) {
        setFreeSpinsLeft((left) => Math.max(0, left - 1));
      } else if (result.FreeSpin) {
        setFreeSpinsTotal(15);
        setFreeSpinsLeft(15);
      }

      setStatus(result.WinSum > 0 ? "win" : "lose");
      postEvent("betPlaced", {
        idCard: result.idCard,
        stake: totalStake,
        winSum: result.WinSum,
        isFreeSpin,
      });
      postEvent("balanceUpdated", { balance: player.balance - (demo || isFreeSpin ? 0 : totalStake) });
    } catch (spinError) {
      setError(spinError.message);
      setStatus("error");
      postEvent("error", { message: spinError.message });
    }
  };

  const collectWin = async () => {
    if (!spinResult?.idCard) return;
    try {
      setStatus("paying");
      await frameApi.pay({ idCard: spinResult.idCard });
      setPlayer((current) => ({ ...current, balance: Number((current.balance + spinResult.WinSum).toFixed(2)) }));
      setDoubleState({ active: false, loading: false, step: 1, status: "Choose left or right" });
      setSpinResult(null);
      setStatus("ready");
      postEvent("balanceUpdated", { balance: player.balance + spinResult.WinSum });
    } catch {
      setStatus("ready");
    }
  };

  const enterDouble = () => {
    if (spinResult?.WinSum > 0) {
      setDoubleState({ active: true, loading: false, step: 1, status: "Choose left or right" });
      setStatus("double");
    }
  };

  const pickDouble = async () => {
    if (!spinResult?.idCard || doubleState.loading) return;
    try {
      setDoubleState((current) => ({ ...current, loading: true, status: "Loading..." }));
      const result = await frameApi.double({
        idCard: spinResult.idCard,
        wasDouble: doubleState.step,
        sum: spinResult.WinSum,
      });
      setSpinResult((current) => ({ ...current, WinSum: result.WinSum }));
      setDoubleState((current) => ({
        active: result.WinSum > 0,
        loading: false,
        step: current.step + 1,
        status: result.status === "win" ? "Won. Double again or take money." : "Lost",
      }));
      setStatus(result.WinSum > 0 ? "double" : "lose");
    } catch (doubleError) {
      setDoubleState((current) => ({ ...current, loading: false, status: "Retry double request" }));
      postEvent("error", { message: doubleError.message });
    }
  };

  const handleAction = (action) => {
    if (action === "cashout") collectWin();
    if (action === "info") loadPaytable();
    if (action === "visual") setVisualMode((value) => !value);
    if (action === "stake") {
      const index = stakeOptions.indexOf(stake);
      setStake(stakeOptions[(index + 1) % stakeOptions.length]);
    }
    if (action === "combo") {
      const index = combinations.findIndex((item) => item.id === selectedCombinationId);
      setSelectedCombinationId(combinations[(index + 1) % combinations.length].id);
    }
    if (action === "double-left" || action === "double-right") pickDouble();
  };

  const fullscreen = () => {
    document.documentElement.requestFullscreen?.();
  };

  const modeLabel = currentGame ? (visualMode ? "Visual Mode" : "Lottery Mode") : "Game Select";
  const isBusy = ["loading", "spinning", "paying"].includes(status);
  const content = !currentGame ? (
    <Lobby games={games} loading={status === "loading"} error={error} onSelectGame={setCurrentGame} />
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
            onClick={() => setSelectedCombinationId(combo.id)}
          >
            <strong>{combo.title}</strong>
            <span>{combo.label}</span>
          </button>
        ))}
      </aside>
      <section className="center-stage">
        {error && (
          <div className="inline-alert">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
        <LotteryGrid
          grid={grid}
          visualMode={visualMode}
          winningCells={spinResult?.winningCells}
          scatterCells={spinResult?.scatterCells}
        />
        <ResultPanel result={spinResult} freeSpinsTotal={freeSpinsTotal} freeSpinsLeft={freeSpinsLeft} onDouble={enterDouble} />
        <div className="spin-controls">
          <button type="button" className="secondary-button" disabled={isBusy} onClick={() => handleSpin({ demo: true })}>
            <RotateCcw size={18} />
            Demo Spin
          </button>
          <button type="button" className="primary-button" disabled={isBusy} onClick={() => handleSpin()}>
            <Play size={18} />
            {status === "spinning" ? "Processing..." : freeSpinsLeft > 0 ? "Free Spin" : "Participate"}
          </button>
        </div>
      </section>
      <aside className="win-table">
        <h3>Winning Table</h3>
        <span>2 scatters: stake x lines x 4</span>
        <span>3+ scatters: 15 free spins</span>
        <span>Wild 12 replaces regular symbols</span>
        <span>Free spins multiplier: x3</span>
      </aside>
    </main>
  );

  return (
    <div className="frame-app">
      <TopBar player={player} mode={modeLabel} onFullscreen={fullscreen} />
      <div className="frame-content">
        {content}
        {currentGame && <ActionPanel onAction={handleAction} disabled={isBusy} inDoubleMode={doubleState.active} />}
      </div>
      <BottomBar
        player={player}
        stake={stake}
        selectedCombination={selectedCombination}
        freeSpinsLeft={freeSpinsLeft}
        multiplier={freeSpinsLeft > 0 ? 3 : 1}
      />
      {showPaytable && (
        <Paytable
          rows={paytableRows}
          loading={paytableStatus === "loading"}
          error={paytableStatus === "error" ? "Could not load payment table" : ""}
          onClose={() => setShowPaytable(false)}
        />
      )}
    </div>
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
