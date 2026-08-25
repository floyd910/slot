import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { frameApi } from "../api/frameApi.js";
import { GAME3_VIEW2_ASSETS, GAME4_VIEW2_ASSETS, GAME6_VIEW2_ASSETS } from "../config/view2Assets.js";
import {
  CARPET_ANIMATION_HALF_MS,
  CARPET_SOUND_SRC,
  LOTTERY_REVEAL_AUDIO_STOP_MS,
  LOTTERY_REVEAL_COLUMNS,
  LOTTERY_REVEAL_STEP_MS,
  createDoubleState,
  createEmptyDoublingState,
  getCarpetAnimationHalfMs,
} from "../config/gameSettings.js";
import { createDoubleActions } from "../controllers/doubleActions.js";
import { createSpinActions } from "../controllers/spinActions.js";
import { ROUND_OPERATION_STATUS, stateRecoveryService } from "../services/stateRecoveryService.js";
import {
  combinations as fallbackCombinations,
  games as fallbackGames,
  initialGrid,
  paytable as fallbackPaytable,
  stakeOptions,
} from "../data/mockData.js";
import { useLanguage } from "../i18n.jsx";
import { wait, withTimeout } from "../utils/async.js";
import { isEnabled } from "../utils/featureFlags.js";
import {
  getTicketWinAmount,
  hasTicketWin,
  shouldOfferDouble,
} from "../utils/gameResult.js";
import {
  loadAudioDurationMs,
  preloadImage,
  preloadGameAssets,
  preloadStartupAssets,
} from "../utils/mediaPreload.js";
import { normalizeRuntimeStatus } from "../utils/runtimeStatus.js";
import { useGameAudio } from "./useGameAudio.js";
import {
  buildRequestId,
  getMissingRequiredContext,
  persistInitContext,
  readFrameParams,
  useFrameBridge,
} from "./useFrameBridge.js";

const initialContext = readFrameParams();

const getSupportedCombinations = (gameId, sourceCombinations) =>
  gameId === "fruits"
    ? sourceCombinations.filter(({ id }) => Number(id) === 5)
    : sourceCombinations;

const setSupportedCombinations = (setCombinations, setSelectedCombinationId, gameId, sourceCombinations) => {
  const supportedCombinations = getSupportedCombinations(gameId, sourceCombinations);
  setCombinations(supportedCombinations);
  setSelectedCombinationId((currentId) =>
    supportedCombinations.some(({ id }) => String(id) === String(currentId))
      ? currentId
      : (supportedCombinations[0]?.id ?? 1),
  );
};
export function useGameController(selectedGameId, gameDefinition = null) {
  const { t } = useLanguage();
  const tRef = useRef(t);
  const bootGameId = selectedGameId ?? initialContext.gameId ?? null;
  const [context, setContext] = useState(() => ({
    ...initialContext,
    ...(bootGameId ? { gameId: bootGameId } : {}),
    recoveryGameId: gameDefinition?.id ?? bootGameId ?? initialContext.gameId,
  }));
  const [status, setStatus] = useState("initial-loading");
  const [error, setError] = useState("");
  const [lastKnownState, setLastKnownState] = useState(null);
  const [roundRecoveryStatus, setRoundRecoveryStatus] = useState(null);
  const [restoredDoubleAvailable, setRestoredDoubleAvailable] = useState(null);
  const [player, setPlayer] = useState(null);
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(bootGameId);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombinationId, setSelectedCombinationId] = useState(1);
  const [grid, setGrid] = useState({ A: [], B: [], C: [], D: [] });
  const [gridRevealKey, setGridRevealKey] = useState(0);
  const [gridAnimation, setGridAnimation] = useState("idle");
  const [hasRecoveredGrid, setHasRecoveredGrid] = useState(false);
  const [stake, setStake] = useState(0.1);
  const [visualMode, setVisualMode] = useState(false);
  const [carpetCloseMs, setCarpetCloseMs] = useState(CARPET_ANIMATION_HALF_MS);
  const [carpetOpenMs, setCarpetOpenMs] = useState(CARPET_ANIMATION_HALF_MS);
  const [expandedBoard, setExpandedBoard] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [freeSpinRoundStarted, setFreeSpinRoundStarted] = useState(false);
  const [showFreeSpinPrompt, setShowFreeSpinPrompt] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [paytableRows, setPaytableRows] = useState([]);
  const [paytableStatus, setPaytableStatus] = useState("idle");
  const [doubleState, setDoubleState] = useState(createDoubleState);
  const [doublingState, setDoublingState] = useState(createEmptyDoublingState);
  const [autoPlayOn, setAutoPlayOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [spinHistory, setSpinHistory] = useState([]);
  const [spinFeedbackActive, setSpinFeedbackActive] = useState(false);
  const [startupAssetsReady, setStartupAssetsReady] = useState(false);
  const [startupLoaderVisible, setStartupLoaderVisible] = useState(true);
  const [startupLoaderLeaving, setStartupLoaderLeaving] = useState(false);

  useEffect(() => {
    if (gameDefinition?.id !== "fruits") return;

    const onlyFiveLineCombination = combinations.filter(
      ({ id }) => Number(id) === 5,
    );
    if (onlyFiveLineCombination.length !== combinations.length) {
      setCombinations(onlyFiveLineCombination);
    }
    if (String(selectedCombinationId) !== "5") {
      setSelectedCombinationId(5);
    }
  }, [combinations, gameDefinition?.id, selectedCombinationId]);
  const spinFeedbackTimerRef = useRef(null);
  const autoPlayOnRef = useRef(autoPlayOn);
  const freeSpinRunRef = useRef(false);
  const liveSpinStateRef = useRef({
    carpetCloseMs,
    context,
    doubleState,
    doublingState,
    freeSpinsLeft,
    freeSpinsTotal,
    player,
    selectedCombination: null,
    spinResult,
    stake,
    status,
    visualMode,
  });

  const playSound = useGameAudio(gameDefinition?.id);
  const emitSound = useCallback(
    (event, payload) => {
      if (visualMode && !["carpet", "win"].includes(event)) return;
      if (visualMode && event === "carpet") {
        playSound(event, payload);
        return;
      }
      if (!["reveal", "stopReveal", "win"].includes(event)) return;
      playSound(event, payload);
    },
    [playSound, visualMode],
  );

  useEffect(() => {
    playSound("setMuted", !soundEnabled);
  }, [playSound, soundEnabled]);

  useEffect(
    () => () => {
      autoPlayOnRef.current = false;
      freeSpinRunRef.current = false;
      if (spinFeedbackTimerRef.current) {
        window.clearTimeout(spinFeedbackTimerRef.current);
        spinFeedbackTimerRef.current = null;
      }
      playSound("stopAll");
    },
    [playSound],
  );

  useEffect(() => {
    const getEnabledControl = (event) => {
      const control = event.target instanceof Element
        ? event.target.closest('button, [role="button"]')
        : null;
      if (!control) return null;
      if (control.matches(':disabled, [aria-disabled="true"], .--disabled')) return null;
      return control;
    };

    const playControlClick = (event) => {
      if (getEnabledControl(event)) playSound("controlClick");
    };

    const playKeyboardControlClick = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const control = getEnabledControl(event);
      if (control?.tagName !== "BUTTON") playSound("controlClick");
    };

    document.addEventListener("click", playControlClick, true);
    document.addEventListener("keydown", playKeyboardControlClick, true);
    return () => {
      document.removeEventListener("click", playControlClick, true);
      document.removeEventListener("keydown", playKeyboardControlClick, true);
    };
  }, [playSound]);

  const emitLotteryRevealSounds = useCallback(() => {
    window.requestAnimationFrame(() => {
      // Fruits uses its full reveal sound once; other games restart per column.
      if (gameDefinition?.id === "fruits") {
        emitSound("reveal");
        return;
      }
      Array.from({ length: LOTTERY_REVEAL_COLUMNS }, (_, index) => {
        window.setTimeout(() => emitSound("reveal"), index * LOTTERY_REVEAL_STEP_MS);
      });
      window.setTimeout(() => emitSound("stopReveal"), LOTTERY_REVEAL_AUDIO_STOP_MS);
    });
  }, [emitSound, gameDefinition?.id]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    playSound("stopBackground");
  }, [playSound]);

  useEffect(() => {
    let active = true;
    loadAudioDurationMs(CARPET_SOUND_SRC).then((durationMs) => {
      if (!active) return;
      const halfDurationMs = getCarpetAnimationHalfMs(durationMs);
      setCarpetCloseMs(halfDurationMs);
      setCarpetOpenMs(halfDurationMs);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => () => playSound("stopBackground"), [playSound]);

  const clearSpinFeedbackTimer = useCallback(() => {
    if (!spinFeedbackTimerRef.current) return;
    window.clearTimeout(spinFeedbackTimerRef.current);
    spinFeedbackTimerRef.current = null;
  }, []);

  useEffect(() => () => clearSpinFeedbackTimer(), [clearSpinFeedbackTimer]);

  const playSpinFeedback = useCallback(() => {
    emitSound("buttonPress");
    emitSound("spin");
    clearSpinFeedbackTimer();
    setSpinFeedbackActive(true);
    spinFeedbackTimerRef.current = window.setTimeout(() => {
      spinFeedbackTimerRef.current = null;
      setSpinFeedbackActive(false);
    }, 180);
  }, [clearSpinFeedbackTimer, emitSound]);

  useEffect(() => {
    let active = true;
    (gameDefinition ? preloadGameAssets(gameDefinition) : preloadStartupAssets())
      .then(() => {
        if (active) setStartupAssetsReady(true);
      })
      .catch((assetError) => {
        console.error(assetError);
        if (active) setError(assetError?.message || "Required game assets failed to load");
      });
    return () => {
      active = false;
    };
  }, []);
useEffect(() => {
    if (!visualMode) return;
    const assets = gameDefinition?.id === "khocha-afandi" ? GAME6_VIEW2_ASSETS : gameDefinition?.id === "egypt" ? GAME4_VIEW2_ASSETS : GAME3_VIEW2_ASSETS;
    assets.forEach((src) => {
      preloadImage(src);
    });
  }, [gameDefinition, visualMode]);

  const diagnostics = useMemo(
    () => ({
      initSource: context.initSource,
      lastKnownState,
      online: navigator.onLine,
    }),
    [context.initSource, lastKnownState],
  );

  const isFruitsGame = gameDefinition?.id === "fruits";
  const effectiveSelectedCombinationId = isFruitsGame ? 5 : selectedCombinationId;
  const selectedCombination = useMemo(
    () =>
      combinations.find(
        (item) => String(item.id) === String(effectiveSelectedCombinationId),
      ) ?? combinations[0],
    [combinations, effectiveSelectedCombinationId],
  );

  useEffect(() => {
    liveSpinStateRef.current = {
      carpetCloseMs,
      context,
      doubleState,
      doublingState,
      freeSpinsLeft,
      freeSpinRoundStarted,
      freeSpinsTotal,
      player,
      selectedCombination,
      spinResult,
      soundEnabled,
      stake,
      status,
      visualMode,
      roundRecoveryBlocked: false,
    };
  }, [
    carpetCloseMs,
    context,
    doubleState,
    doublingState,
    freeSpinsLeft,
    freeSpinsTotal,
    player,
    selectedCombination,
    spinResult,
    stake,
    status,
    visualMode,
  ]);

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

  const reportOperationError = useCallback(
    (runtimeError, fallbackMessage = "Request failed") => {
      const nextStatus = normalizeRuntimeStatus(runtimeError);
      const message = runtimeError?.message || fallbackMessage;
      setError(message);
      setStatus("ready");
      setLastKnownState(nextStatus);
      postEvent("ERROR", {
        code: runtimeError?.code ?? "UNKNOWN",
        message,
      });
    },
    [postEvent],
  );

  const recoverStartupToGameShell = useCallback(
    (runtimeError) => {
      const nextStatus = normalizeRuntimeStatus(runtimeError);
      const fallbackBalance = Number(
        context.balance ?? context.testBalance ?? 0,
      );

      setPlayer(
        (current) =>
          current ?? {
            id: context.userId ?? "demo-player",
            name: "Demo Player",
            balance: Number.isFinite(fallbackBalance) ? fallbackBalance : 0,
            currency: context.currency ?? "GEL",
          },
      );
      setGames(fallbackGames);
      setSupportedCombinations(setCombinations, setSelectedCombinationId, gameDefinition?.id ?? context.gameId, fallbackCombinations);
      setGrid(initialGrid);
      const recoveredRound = frameApi.recoverState(context);
      const lastSpinSnapshot = stateRecoveryService.getLastSpin(context);
      const restoredSpinResult = recoveredRound?.spinResult ?? recoveredRound?.lastConfirmedSpinResult ?? lastSpinSnapshot?.spinResult;
      if (restoredSpinResult) {
        setSpinResult(restoredSpinResult);
        setDoublingState(recoveredRound.doublingState ? { ...recoveredRound.doublingState, loading: false, lastPick: "", lastStatus: "" } : createEmptyDoublingState());
        setDoubleState(recoveredRound.doubleState ? { ...recoveredRound.doubleState, loading: false } : createDoubleState());
        setGrid(recoveredRound.lastConfirmedGrid ?? recoveredRound.grid ?? lastSpinSnapshot?.grid ?? restoredSpinResult.grid ?? initialGrid);
        setHasRecoveredGrid(true);
        setGridRevealKey((key) => key + 1);
        setGridAnimation("settled");
        if (Number.isFinite(Number(recoveredRound.stake))) setStake(Number(recoveredRound.stake));
        if (recoveredRound.selectedCombinationId != null) setSelectedCombinationId(recoveredRound.selectedCombinationId);
      }
      const restoredFreeSpinsLeft = Number(recoveredRound?.freeSpinsLeft ?? 0);
      if (recoveredRound?.freeSpinsActive === true && restoredFreeSpinsLeft > 0) {
        setFreeSpinsLeft(restoredFreeSpinsLeft);
        setFreeSpinsTotal(Number(recoveredRound.freeSpinsTotal ?? restoredFreeSpinsLeft));
        setFreeSpinRoundStarted(true);
        setShowFreeSpinPrompt(true);
      }
      if ([ROUND_OPERATION_STATUS.SPIN_PROCESSING, ROUND_OPERATION_STATUS.DOUBLE_PROCESSING].includes(recoveredRound?.operationStatus)) {
        setRoundRecoveryStatus(ROUND_OPERATION_STATUS.RECOVERY_REQUIRED);
      }
      setPaytableRows(fallbackPaytable);
      setPaytableStatus("ready");
      setCurrentGame(
        (current) => current ?? context.gameId ?? fallbackGames[0]?.id ?? null,
      );
      setError("");
      setStatus("ready");
      setLastKnownState(nextStatus);
    },
    [context],
  );

  const init = useCallback(async () => {
    const missing = getMissingRequiredContext(context);
    if (missing.length) {
      const configError = new Error(
        `Missing required init context: ${missing.join(", ")}`,
      );
      configError.code = missing.includes("token")
        ? "ACCESS_DENIED"
        : missing.includes("sessionId")
          ? "INVALID_SESSION"
          : "CONFIGURATION_ERROR";
      recoverStartupToGameShell(configError);
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
      const pendingRecovery = frameApi.getPendingRequest(context);
      const recoveredState = frameApi.recoverState(context);
      const lastSpinSnapshot = stateRecoveryService.getLastSpin(context);
      const confirmedSpinResult = recoveredState?.spinResult ?? recoveredState?.lastConfirmedSpinResult ?? lastSpinSnapshot?.spinResult;
      const needsRecovery = Boolean(pendingRecovery) || [ROUND_OPERATION_STATUS.SPIN_PROCESSING, ROUND_OPERATION_STATUS.DOUBLE_PROCESSING].includes(recoveredState?.operationStatus);
      if (needsRecovery) {
        // Keep the last confirmed Free Spin result visible while the next
        // request remains unknown and therefore safely blocked.
        if (confirmedSpinResult) {
          setSpinResult(confirmedSpinResult);
          setDoublingState(recoveredState.doublingState ? { ...recoveredState.doublingState, loading: false, lastPick: "", lastStatus: "" } : createEmptyDoublingState());
          setDoubleState(recoveredState.doubleState ? { ...recoveredState.doubleState, loading: false } : createDoubleState());
          setGrid(recoveredState.lastConfirmedGrid ?? recoveredState.grid ?? confirmedSpinResult.grid ?? session.grid);
          setHasRecoveredGrid(true);
          setGridRevealKey((key) => key + 1);
          setGridAnimation("settled");
          if (Number.isFinite(Number(recoveredState.stake))) setStake(Number(recoveredState.stake));
          if (recoveredState.selectedCombinationId != null) setSelectedCombinationId(recoveredState.selectedCombinationId);
          setFreeSpinsLeft(Number(recoveredState.freeSpinsLeft ?? 0));
          setFreeSpinsTotal(Number(recoveredState.freeSpinsTotal ?? recoveredState.freeSpinsLeft ?? 0));
          if (recoveredState.freeSpinsActive === true && Number(recoveredState.freeSpinsLeft ?? 0) > 0) setFreeSpinRoundStarted(true);
        }
        // User-authorized test-mode escape hatch: discard the stale local
        // recovery marker without retrying the unknown prior operation.
        stateRecoveryService.completePendingRequest(pendingRecovery?.requestId, context);
        setRoundRecoveryStatus(null);
        setError("");
      } else if (recoveredState?.spinResult) {
        setSpinResult(confirmedSpinResult);
        setDoublingState(recoveredState.doublingState ? { ...recoveredState.doublingState, loading: false, lastPick: "", lastStatus: "" } : createEmptyDoublingState());
        setDoubleState(recoveredState.doubleState ? { ...recoveredState.doubleState, loading: false } : createDoubleState());
        setGrid(recoveredState.lastConfirmedGrid ?? recoveredState.grid ?? confirmedSpinResult.grid ?? session.grid);
        setHasRecoveredGrid(true);
          setGridRevealKey((key) => key + 1);
        setGridAnimation("settled");
        if (Number.isFinite(Number(recoveredState.stake))) setStake(Number(recoveredState.stake));
        if (recoveredState.selectedCombinationId != null) setSelectedCombinationId(recoveredState.selectedCombinationId);
        setRoundRecoveryStatus(recoveredState.operationStatus === ROUND_OPERATION_STATUS.RECOVERY_REQUIRED ? null : (recoveredState.operationStatus ?? ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION));
        setRestoredDoubleAvailable(recoveredState.doubleAvailable === true);
        setFreeSpinsLeft(Number(recoveredState.freeSpinsLeft ?? 0));
        setFreeSpinsTotal(Number(recoveredState.freeSpinsTotal ?? recoveredState.freeSpinsLeft ?? 0));
        if (recoveredState.freeSpinsActive === true && Number(recoveredState.freeSpinsLeft ?? 0) > 0) {
          setFreeSpinRoundStarted(true);
          setShowFreeSpinPrompt(true);
        }
      }
      setPlayer(session.player);
      setGames(session.games);
      setSupportedCombinations(setCombinations, setSelectedCombinationId, gameDefinition?.id ?? context.gameId, session.combinations);
      const startupGrid = recoveredState?.lastConfirmedGrid ?? recoveredState?.grid ?? lastSpinSnapshot?.grid ?? confirmedSpinResult?.grid ?? session.grid;
      setGrid(startupGrid);
      setHasRecoveredGrid(Boolean(recoveredState?.spinResult || recoveredState?.lastConfirmedSpinResult || lastSpinSnapshot?.grid));
      setGridRevealKey((key) => key + 1);
      setPaytableRows(paymentRows);
      setPaytableStatus("ready");
      setCurrentGame((current) => current ?? context.gameId ?? null);
      setStatus(session.games.length ? "ready" : "empty");      setLastKnownState("ready");
      // View 1 begins with an empty board. Reapply the saved board after all
      // bootstrap state has been set, so the default session grid cannot win.
      if (recoveredState?.spinResult || recoveredState?.lastConfirmedSpinResult || lastSpinSnapshot?.grid) {
        window.requestAnimationFrame(() => {
          setGrid(startupGrid);
          setGridAnimation("settled");
          setHasRecoveredGrid(true);
          setGridRevealKey((key) => key + 1);
        });
      }
      postEvent("LOADED", {
        gameId: context.gameId,
        userId: session.player.id,
      });
    } catch (initError) {
      const nextStatus = normalizeRuntimeStatus(initError);
      if (nextStatus === "network-error" || nextStatus === "error") {
        recoverStartupToGameShell(initError);
        return;
      }
      reportError(initError, tRef.current("initError"));
    }
  }, [context, postEvent, recoverStartupToGameShell, reportError]);

  useEffect(() => {
    if (roundRecoveryStatus !== ROUND_OPERATION_STATUS.RECOVERY_REQUIRED) return undefined;

    const restoreResolvedRound = () => {
      const recovered = frameApi.recoverState(context);
      if (!recovered?.spinResult || ![ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION, ROUND_OPERATION_STATUS.WAITING_FOR_COLLECT].includes(recovered.operationStatus)) return;
      setSpinResult(recovered.spinResult);
      setDoublingState(recovered.doublingState ? { ...recovered.doublingState, loading: false, lastPick: "", lastStatus: "" } : createEmptyDoublingState());
      setDoubleState(recovered.doubleState ? { ...recovered.doubleState, loading: false } : createDoubleState());
      setGrid(recovered.lastConfirmedGrid ?? recovered.grid ?? recovered.spinResult.grid ?? initialGrid);
      setHasRecoveredGrid(true);
      setGridRevealKey((key) => key + 1);
      setGridAnimation("settled");
      if (Number.isFinite(Number(recovered.stake))) setStake(Number(recovered.stake));
      if (recovered.selectedCombinationId != null) setSelectedCombinationId(recovered.selectedCombinationId);
      setRoundRecoveryStatus(recovered.operationStatus);
      setRestoredDoubleAvailable(recovered.doubleAvailable === true);
      setError("");
      setStatus("ready");
    };
    restoreResolvedRound();
    const timer = window.setInterval(restoreResolvedRound, 300);
    return () => window.clearInterval(timer);
  }, [context, roundRecoveryStatus]);

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
      if (lastKnownState === "spin-submitted") {
        setError(
          "Connection lost. The last operation may still finish on the server.",
        );
      }
      setStatus("ready");
      setLastKnownState("network-error");
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", disconnect);
    return () => {
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", disconnect);
    };
  }, [init, lastKnownState, status]);

  useEffect(() => {
    if (
      !startupLoaderVisible ||
      !startupAssetsReady ||
      ["initial-loading", "bootstrap-loading"].includes(status)
    ) {
      return;
    }

    setStartupLoaderLeaving(true);
    setStartupLoaderVisible(false);
    return undefined;
  }, [startupAssetsReady, startupLoaderVisible, status]);

  const loadPaytable = async () => {
    setShowPaytable((current) => !current);
    setPaytableStatus("ready");
  };

  useEffect(() => {
    if (!spinResult) setRestoredDoubleAvailable(null);
  }, [spinResult]);

  const freeSpinsActive =
    freeSpinsLeft > 0 || showFreeSpinPrompt || freeSpinRunRef.current;
  const paytableControlsLocked = showPaytable || autoPlayOn || freeSpinsActive;

  const { collectWin, handleSpin, onAutoPlay, startFreeSpinRun } =
    createSpinActions({
      autoPlayOnRef,
      emitLotteryRevealSounds,
      emitSound,
      freeSpinRunRef,
      liveSpinStateRef,
      playSpinFeedback,
      postEvent,
      reportOperationError,
      setDoubleState,
      setDoublingState,
      setError,
      setFreeSpinsLeft,
      setFreeSpinRoundStarted,
      setFreeSpinsTotal,
      setGrid,
      setGridAnimation,
      setGridRevealKey,
      setHasRecoveredGrid,
      setLastKnownState,
      setPlayer,
      setShowFreeSpinPrompt,
      setSpinHistory,
      setSpinResult,
      setStatus,
      showFreeSpinPrompt,
      t,
    });

  const cycleStake = (direction) => {
    if (paytableControlsLocked) return;
    emitSound("amount");
    const index = stakeOptions.indexOf(stake);
    const nextIndex =
      (index + direction + stakeOptions.length) % stakeOptions.length;
    setStake(stakeOptions[nextIndex]);
  };

  const cycleCombination = (direction) => {
    if (isFruitsGame || paytableControlsLocked || !combinations.length) return;
    emitSound("buttonPress");
    const index = combinations.findIndex(
      (item) => String(item.id) === String(selectedCombinationId),
    );
    const nextIndex =
      (index + direction + combinations.length) % combinations.length;
    setSelectedCombinationId(combinations[nextIndex].id);
  };

  const selectCombination = (comboId) => {
    if (isFruitsGame && Number(comboId) !== 5) return;
    emitSound("buttonPress");
    setSelectedCombinationId(comboId);
  };

  useEffect(() => {
    if (
      !autoPlayOn ||
      status !== "ready" ||
      freeSpinsLeft <= 0 ||
      freeSpinRunRef.current
    ) {
      return;
    }

    void startFreeSpinRun();
  }, [autoPlayOn, freeSpinsLeft, status]);


  useEffect(() => {
    autoPlayOnRef.current = autoPlayOn;
    if (!autoPlayOn) return undefined;

    let cancelled = false;
    const runAutoPlay = async () => {
      while (!cancelled && autoPlayOnRef.current) {
        await onAutoPlay();
        await wait(100);
      }
    };

    runAutoPlay();
    return () => {
      cancelled = true;
      autoPlayOnRef.current = false;
    };
  }, [autoPlayOn]);

  const toggleAutoPlay = () => {
    setAutoPlayOn((current) => !current);
  };

  const { enterDoubleScene, enterVisualDouble, pickDouble, playFooterDouble } =
    createDoubleActions({
      doubleState,
      doublingState,
      emitSound,
      liveSpinStateRef,
      postEvent,
      reportError,
      setDoubleState,
      setDoublingState,
      setGridAnimation,
      setLastKnownState,
      setPlayer,
      setSpinResult,
      setStatus,
      spinResult,
      status,
      t,
      visualMode,
    });
  const toggleSound = () => {
    const nextSoundEnabled = !soundEnabledRef.current;
    soundEnabledRef.current = nextSoundEnabled;

    playSound("setMuted", !nextSoundEnabled);
    if (nextSoundEnabled) playSound("controlClick");
    setSoundEnabled(nextSoundEnabled);
  };

  const toggleVisualMode = () => {
    if (viewSwitchDisabled) return;
    setVisualMode((value) => {
      const nextValue = !value;
      setExpandedBoard(nextValue);
      return nextValue;
    });
  };

  const totalPurchase = Number(
    (stake * (selectedCombination?.groups.length ?? 0)).toFixed(2),
  );
  const isRoundRecoveryBlocked = roundRecoveryStatus === ROUND_OPERATION_STATUS.RECOVERY_REQUIRED;
  const isBusy =
    isRoundRecoveryBlocked ||
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    status === "processing";
  const ticketWinAmount = getTicketWinAmount(spinResult, doublingState);
  const uncollectedWin =
    spinResult?.creditedToBalance !== true &&
    Boolean(spinResult?.idCard) &&
    ticketWinAmount > 0;
  const pendingTicketWin = hasTicketWin(spinResult, doublingState);
  const visualDoubleSceneActive =
    visualMode &&
    Boolean(
      doublingState.entered &&
        (doublingState.active ||
          doublingState.loading ||
          doublingState.lastStatus ||
          (pendingTicketWin && doublingState.step > 0)),
    );
  const viewSwitchDisabled =
    status === "processing" ||
    autoPlayOn ||
    freeSpinRunRef.current ||
    visualDoubleSceneActive;
  const doubleOfferAvailable = restoredDoubleAvailable === true || shouldOfferDouble({
    autoPlayOn,
    doublingState,
    freeSpinsLeft,
    freeSpinRunActive: freeSpinRunRef.current,
    showFreeSpinPrompt,
    spinResult,
  });
  const isDoublingLocked =
    pendingTicketWin || Boolean(doublingState.active || doublingState.loading);
  const testMode = isEnabled(context.testMode ?? context.demoMode);
  const canAffordSpin =
    testMode ||
    freeSpinsLeft > 0 ||
    Number(player?.balance ?? 0) >= totalPurchase;
  const hasFreeSpinsPending = freeSpinsLeft > 0;
  const isVisualDoubling =
    visualMode &&
    Boolean(
      doublingState.entered &&
        (doublingState.active ||
          doublingState.loading ||
          doublingState.lastStatus ||
          (pendingTicketWin && doublingState.step > 0)),
    );
  const spinButtonDisabled =
    isRoundRecoveryBlocked ||
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    Boolean(doublingState.loading) ||
    (!pendingTicketWin && !canAffordSpin);
  const hideHeader =
    context.mode === "embedded" && context.featureFlags?.hiddenHeader !== false;
  const shellClass = `frame-app mode-${context.mode} theme-${context.theme}${hideHeader ? " headerless" : ""}${expandedBoard || visualMode ? " expanded-board" : ""}${visualMode ? " view-2" : " view-1"}${isVisualDoubling ? " doubling-active" : ""}`;
  const runtimeStateVisible = !["ready", "empty", "processing"].includes(status);

  const pressSpinButton = () => {
    if (isVisualDoubling) return collectWin();
    if (showFreeSpinPrompt || hasFreeSpinsPending) return startFreeSpinRun();
    if (pendingTicketWin) return collectWin();
    return handleSpin();
  };

  const playView2WinLine = useCallback(
    (lineIndex) => {
      if (
        !["korvonsaroi-karavan", "marvorid-djemchug", "egypt", "kadima-drevnii"].includes(gameDefinition?.id) ||
        !visualMode
      ) {
        return;
      }
      playSound("winLine", { lineIndex });
    },
    [gameDefinition?.id, playSound, visualMode],
  );

  return {
    actions: {
      collectWin,
      cycleCombination,
      cycleStake,
      handleSpin,
      init,
      loadPaytable,
      pickDouble,
      playFooterDouble,
      playView2WinLine,
      pressSpinButton,
      selectCombination,
      setCurrentGame,
      setShowGameMenu,
      setShowPaytable,
      startFreeSpinRun,
      toggleAutoPlay,
      toggleSound,
      toggleVisualMode,
      enterDoubleScene,
      enterVisualDouble,
    },
    state: {
      autoPlayOn,
      carpetCloseMs,
      carpetOpenMs,
      combinations,
      context,
      currentGame,
      doubleState,
      doublingState,
      error,
      freeSpinsLeft,
      freeSpinRoundStarted,
      freeSpinsTotal,
      games,
      grid,
      gridAnimation,
      gridRevealKey,
      hasRecoveredGrid,
      paytableRows,
      paytableStatus,
      player,
      selectedCombinationId: effectiveSelectedCombinationId,
      showFreeSpinPrompt,
      showGameMenu,
      showPaytable,
      spinFeedbackActive,
      spinHistory,
      spinResult,
      soundEnabled,
      stake,
      startupAssetsReady,
      startupLoaderLeaving,
      startupLoaderVisible,
      status,
      visualMode,
    },
    derived: {
      canAffordSpin,
      doubleOfferAvailable,
      isBusy,
      isDoublingLocked,
      isVisualDoubling,
      pendingTicketWin,
      paytableControlsLocked,
      runtimeStateVisible,
      selectedCombination,
      shellClass,
      spinButtonDisabled,
      testMode,
      ticketWinAmount,
      totalPurchase,
      uncollectedWin,
      viewSwitchDisabled,
    },
  };
}


