import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { frameApi } from "../api/frameApi.js";
import { VIEW2_ASSETS } from "../config/view2Assets.js";
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
  preloadDoubleSceneAssets,
  preloadImage,
  preloadStartupAssets,
  preloadView2FirstPaintAssets,
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

export function useGameController(selectedGameId) {
  const { t } = useLanguage();
  const tRef = useRef(t);
  const bootGameId = selectedGameId ?? initialContext.gameId ?? null;
  const [context, setContext] = useState(() =>
    bootGameId && initialContext.gameId !== bootGameId
      ? { ...initialContext, gameId: bootGameId }
      : initialContext,
  );
  const [status, setStatus] = useState("initial-loading");
  const [error, setError] = useState("");
  const [lastKnownState, setLastKnownState] = useState(null);
  const [player, setPlayer] = useState(null);
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(bootGameId);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombinationId, setSelectedCombinationId] = useState(1);
  const [grid, setGrid] = useState({ A: [], B: [], C: [], D: [] });
  const [gridRevealKey, setGridRevealKey] = useState(0);
  const [gridAnimation, setGridAnimation] = useState("idle");
  const [stake, setStake] = useState(0.1);
  const [visualMode, setVisualMode] = useState(false);
  const [carpetCloseMs, setCarpetCloseMs] = useState(CARPET_ANIMATION_HALF_MS);
  const [carpetOpenMs, setCarpetOpenMs] = useState(CARPET_ANIMATION_HALF_MS);
  const [expandedBoard, setExpandedBoard] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
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

  const playSound = useGameAudio();
  const emitSound = useCallback(
    (event, payload) => {
      if (visualMode && event !== "carpet") return;
      if (visualMode && event === "carpet") {
        if (soundEnabledRef.current) playSound(event, payload);
        return;
      }
      if (!["reveal", "stopReveal", "win"].includes(event)) return;
      if (soundEnabledRef.current) playSound(event, payload);
    },
    [playSound, visualMode],
  );

  useEffect(() => {
    if (!soundEnabled) playSound("stopAll");
  }, [playSound, soundEnabled]);

  const emitLotteryRevealSounds = useCallback(() => {
    window.requestAnimationFrame(() => {
      Array.from({ length: LOTTERY_REVEAL_COLUMNS }, (_, index) => {
        window.setTimeout(
          () => emitSound("reveal"),
          index * LOTTERY_REVEAL_STEP_MS,
        );
      });
      window.setTimeout(
        () => emitSound("stopReveal"),
        LOTTERY_REVEAL_AUDIO_STOP_MS,
      );
    });
  }, [emitSound]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    playSound("stopBackground");
  }, [playSound]);

  useEffect(() => {
    let active = true;
    loadAudioDurationMs(CARPET_SOUND_SRC).then((durationMs) => {
      if (active) {
        const halfDurationMs = getCarpetAnimationHalfMs(durationMs);
        setCarpetCloseMs(halfDurationMs);
        setCarpetOpenMs(halfDurationMs);
      }
    });
    return () => {
      active = false;
    };
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
    preloadStartupAssets()
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
    preloadDoubleSceneAssets().catch((assetError) => {
      console.error("Double scene asset preload failed", assetError);
    });
  }, []);

  useEffect(() => {
    if (!startupAssetsReady) return;
    preloadView2FirstPaintAssets().catch((assetError) => {
      console.error("View 2 static asset preload failed", assetError);
    });
  }, [startupAssetsReady]);

  useEffect(() => {
    if (!visualMode) return;
    VIEW2_ASSETS.forEach((src) => {
      preloadImage(src);
    });
  }, [visualMode]);

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

  useEffect(() => {
    liveSpinStateRef.current = {
      carpetCloseMs,
      context,
      doubleState,
      doublingState,
      freeSpinsLeft,
      freeSpinsTotal,
      player,
      selectedCombination,
      spinResult,
      soundEnabled,
      stake,
      status,
      visualMode,
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
      setCombinations(fallbackCombinations);
      setGrid(initialGrid);
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
      const nextStatus = normalizeRuntimeStatus(initError);
      if (nextStatus === "network-error" || nextStatus === "error") {
        recoverStartupToGameShell(initError);
        return;
      }
      reportError(initError, tRef.current("initError"));
    }
  }, [context, postEvent, recoverStartupToGameShell, reportError]);

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
    const timeout = window.setTimeout(() => {
      setStartupLoaderVisible(false);
    }, 520);
    return () => window.clearTimeout(timeout);
  }, [startupAssetsReady, startupLoaderVisible, status]);

  const loadPaytable = async () => {
    setShowPaytable((current) => !current);
    setPaytableStatus("ready");
  };

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
      setAutoPlayOn,
      setDoubleState,
      setDoublingState,
      setError,
      setFreeSpinsLeft,
      setFreeSpinsTotal,
      setGrid,
      setGridAnimation,
      setGridRevealKey,
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
    if (paytableControlsLocked || !combinations.length) return;
    emitSound("buttonPress");
    const index = combinations.findIndex(
      (item) => item.id === selectedCombinationId,
    );
    const nextIndex =
      (index + direction + combinations.length) % combinations.length;
    setSelectedCombinationId(combinations[nextIndex].id);
  };

  const selectCombination = (comboId) => {
    emitSound("buttonPress");
    setSelectedCombinationId(comboId);
  };

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
    if (!nextSoundEnabled) {
      playSound("stopAll");
    } else {
      playSound("click");
    }
    setSoundEnabled(nextSoundEnabled);
  };

  const toggleVisualMode = () => {
    if (viewSwitchDisabled) return;
    emitSound("click");
    setVisualMode((value) => {
      const nextValue = !value;
      setExpandedBoard(nextValue);
      return nextValue;
    });
  };

  const totalPurchase = Number(
    (stake * (selectedCombination?.groups.length ?? 0)).toFixed(2),
  );
  const isBusy =
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    status === "processing";
  const ticketWinAmount = getTicketWinAmount(spinResult, doublingState);
  const uncollectedWin =
    spinResult?.creditedToBalance !== true &&
    Boolean(spinResult?.idCard) &&
    ticketWinAmount > 0;
  const pendingTicketWin = hasTicketWin(spinResult, doublingState);
  const viewSwitchDisabled =
    status === "processing" || autoPlayOn || freeSpinsActive || uncollectedWin;
  const doubleOfferAvailable = shouldOfferDouble({
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
      freeSpinsTotal,
      games,
      grid,
      gridAnimation,
      gridRevealKey,
      paytableRows,
      paytableStatus,
      player,
      selectedCombinationId,
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
