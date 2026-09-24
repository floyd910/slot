import { getPrimaryGameAction } from "../viewModels/primaryGameAction.js";
import { hasPendingExitRecovery, createDoubleExitHandler, registerDoubleExit, requestDoubleExit } from "../services/doubleExitService.js";
import { isStandaloneDemo, requestDemoLaunch } from "../api/demoLaunch.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { frameApi } from "../api/frameApi.js";
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
import { partnerApi } from "../services/partnerApi.js";
import {
  games as displayGames,
  combinations as displayCombinations,
  getInitialGrid,
  stakeOptions,
} from "../data/mockData.js";
import { getNotificationKey, useLanguage } from "../i18n.jsx";
import { wait, withTimeout } from "../utils/async.js";
import { isEnabled } from "../utils/featureFlags.js";
import {
  getTicketWinAmount,
  hasTicketWin,
  shouldOfferDouble,
} from "../utils/gameResult.js";
import {
  loadAudioDurationMs,
  preloadGameAssets,
  preloadSpinReadyAssets,
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
const UI_PREFERENCES_KEY = "hiranmandi-frame:ui-preferences:v1";
const SOUND_PREFERENCE_KEY = "hiranmandi-frame:sound-enabled:v1";

const readSoundPreference = () => {
  try {
    const storedValue = window.localStorage.getItem(SOUND_PREFERENCE_KEY);
    return storedValue === null ? null : storedValue === "true";
  } catch {
    return null;
  }
};

const saveSoundPreference = (soundEnabled) => {
  try {
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(soundEnabled));
  } catch {
    // Storage can be blocked in partner iframes.
  }
};

const readUiPreferences = (gameId) => {
  try {
    const allPreferences = JSON.parse(
      window.localStorage.getItem(UI_PREFERENCES_KEY) ?? "{}",
    );
    return allPreferences?.[gameId] ?? {};
  } catch {
    return {};
  }
};

const saveUiPreferences = (gameId, preferences) => {
  if (!gameId) return;
  try {
    const allPreferences = JSON.parse(
      window.localStorage.getItem(UI_PREFERENCES_KEY) ?? "{}",
    );
    window.localStorage.setItem(
      UI_PREFERENCES_KEY,
      JSON.stringify({
        ...allPreferences,
        [gameId]: { ...(allPreferences?.[gameId] ?? {}), ...preferences },
      }),
    );
  } catch {
    // Storage can be blocked in partner iframes.
  }
};

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
  const [spinAssetsReady, setSpinAssetsReady] = useState(false);

  useEffect(() => {
    let active = true;
    setSpinAssetsReady(false);
    if (!gameDefinition) {
      setSpinAssetsReady(true);
      return () => {
        active = false;
      };
    }

    preloadSpinReadyAssets(gameDefinition)
      .catch((error) => console.error(error))
      .finally(() => {
        if (active) setSpinAssetsReady(true);
      });

    return () => {
      active = false;
    };
  }, [gameDefinition]);
  const tRef = useRef(t);
  const initializedSessionIdRef = useRef(null);
  const initializationInFlightRef = useRef(false);
  const bootGameId = gameDefinition?.id ?? selectedGameId ?? initialContext.gameId ?? null;
  const [context, setContext] = useState(() => ({
    ...initialContext,
    ...(bootGameId ? { gameId: bootGameId } : {}),
    recoveryGameId: gameDefinition?.id ?? bootGameId ?? initialContext.gameId,
  }));
  const uiPreferences = useMemo(
    () => readUiPreferences(gameDefinition?.id ?? bootGameId),
    [bootGameId, gameDefinition?.id],
  );
  const [status, setStatus] = useState("initial-loading");
  const [recoveringRound] = useState(() =>
    Boolean(
      frameApi.recoverState(context) ||
        frameApi.getPendingRequest(context),
    ),
  );
  const [errorKey, setErrorKey] = useState("");
  const setError = useCallback((value) => setErrorKey(getNotificationKey(value)), []);
  const error = errorKey ? t(errorKey) : "";
  const [lastKnownState, setLastKnownState] = useState(null);
  const [roundRecoveryStatus, setRoundRecoveryStatus] = useState(null);
  const [restoredDoubleAvailable, setRestoredDoubleAvailable] = useState(null);
  const [player, setPlayer] = useState(null);
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(bootGameId);
  const [combinations, setCombinations] = useState(() => getSupportedCombinations(gameDefinition?.id ?? bootGameId, displayCombinations));
  const [selectedCombinationId, setSelectedCombinationId] = useState(() => uiPreferences.selectedCombinationId ?? 1);
  const [grid, setGrid] = useState(() => getInitialGrid(gameDefinition?.id ?? bootGameId));
  const [gridRevealKey, setGridRevealKey] = useState(0);
  const [gridAnimation, setGridAnimation] = useState("idle");
  const [hasRecoveredGrid, setHasRecoveredGrid] = useState(false);
  const [hasSessionSpin, setHasSessionSpin] = useState(false);
  const [stake, setStake] = useState(() => Number(uiPreferences.stake ?? 0.1));
  const [visualMode, setVisualMode] = useState(() => uiPreferences.visualMode === true);
  const [carpetCloseMs, setCarpetCloseMs] = useState(CARPET_ANIMATION_HALF_MS);
  const [carpetOpenMs, setCarpetOpenMs] = useState(CARPET_ANIMATION_HALF_MS);
  const [expandedBoard, setExpandedBoard] = useState(() => uiPreferences.visualMode === true);
  const [spinResult, setSpinResult] = useState(null);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [freeSpinsWinTotal, setFreeSpinsWinTotal] = useState(null);
  const [freeSpinsPaidTotal, setFreeSpinsPaidTotal] = useState(0);
  const [freeSpinHistoryMissing, setFreeSpinHistoryMissing] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [freeSpinRoundStarted, setFreeSpinRoundStarted] = useState(false);
  const [showFreeSpinPrompt, setShowFreeSpinPrompt] = useState(false);
  const [freeSpinSummary, setFreeSpinSummary] = useState(null);
  const [showPaytable, setShowPaytable] = useState(false);
  const [paytableRows, setPaytableRows] = useState([]);
  const [paytableStatus, setPaytableStatus] = useState("idle");
  const [doubleState, setDoubleState] = useState(createDoubleState);
  const [doublingState, setDoublingState] = useState(createEmptyDoublingState);
  const [autoPlayOn, setAutoPlayOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(
    () => readSoundPreference() ?? uiPreferences.soundEnabled !== false,
  );
  const soundEnabledRef = useRef(soundEnabled);
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
  const resumeAutoPlayAfterFreeSpinsRef = useRef(false);
  const liveSpinStateRef = useRef({
    carpetCloseMs,
    carpetOpenMs,
    context,
    doubleState,
    doublingState,
    freeSpinsLeft,
    freeSpinsTotal,
    freeSpinsWinTotal,
    freeSpinsPaidTotal,
    freeSpinHistoryMissing,
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

  useEffect(() => {
    saveSoundPreference(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    saveUiPreferences(gameDefinition?.id ?? bootGameId, {
      selectedCombinationId,
      soundEnabled,
      stake,
      visualMode,
    });
  }, [
    bootGameId,
    gameDefinition?.id,
    selectedCombinationId,
    soundEnabled,
    stake,
    visualMode,
    roundRecoveryStatus,
  ]);

  useEffect(
    () => () => {
      autoPlayOnRef.current = false;
      freeSpinRunRef.current = false;
      resumeAutoPlayAfterFreeSpinsRef.current = false;
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
      Array.from({ length: LOTTERY_REVEAL_COLUMNS }, (_, index) => {
        window.setTimeout(() => emitSound("reveal"), index * LOTTERY_REVEAL_STEP_MS);
      });
      window.setTimeout(() => emitSound("stopReveal"), LOTTERY_REVEAL_AUDIO_STOP_MS);
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
        if (active) setError("assetsLoadError");
      });
    return () => {
      active = false;
    };
  }, []);
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
      ...liveSpinStateRef.current,
      carpetCloseMs,
      carpetOpenMs,
      context,
      doubleState,
      doublingState,
      freeSpinsLeft,
      freeSpinRoundStarted,
      freeSpinsTotal,
    freeSpinsWinTotal,
    freeSpinsPaidTotal,
      freeSpinHistoryMissing,
      player,
      selectedCombination,
      spinResult,
      soundEnabled,
      stake,
      status,
      visualMode,
      roundRecoveryBlocked: roundRecoveryStatus === ROUND_OPERATION_STATUS.RECOVERY_REQUIRED,
    };
  }, [
    carpetCloseMs,
    carpetOpenMs,
    context,
    doubleState,
    doublingState,
    freeSpinsLeft,
    freeSpinsTotal,
    freeSpinsWinTotal,
    freeSpinsPaidTotal,
    freeSpinHistoryMissing,
    player,
    selectedCombination,
    spinResult,
    stake,
    status,
    visualMode,
  ]);

  const mergeInitContext = useCallback((nextContext) => {
    setContext((current) => {
      if (current.token === nextContext.token && current.playerId === nextContext.playerId && current.initSource === "postMessage") return current;
      initializedSessionIdRef.current = null;
      const nextOrigins = Array.isArray(nextContext.allowedOrigins)
        ? nextContext.allowedOrigins
        : nextContext.allowedOrigins
          ? [nextContext.allowedOrigins]
          : [];
      const startsNewSession =
        Boolean(nextContext.token) &&
        !Object.prototype.hasOwnProperty.call(nextContext, "sessionId");
      const merged = {
        ...current,
        ...nextContext,
        ...(startsNewSession ? { sessionId: null } : {}),
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
    async (command, payload) => {
      if (command === "FORCE_RELOAD") { const exit = await requestDoubleExit(); if(exit.allowExit) window.location.reload(); return; }
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
        const exit = await requestDoubleExit();
        if (!exit.allowExit) return;
        setStatus("session-expired");
        setError("hostClosed");
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
      setError(getNotificationKey(runtimeError, getNotificationKey(fallbackMessage)));
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
      setError(getNotificationKey(runtimeError, getNotificationKey(fallbackMessage)));
      setStatus("ready");
      setLastKnownState(nextStatus);
      postEvent(nextStatus === "access-denied" ? "AUTH_REQUIRED" : "ERROR", {
        code: runtimeError?.code ?? "UNKNOWN",
        message,
      });
    },
    [postEvent],
  );

  useEffect(() => {
    if (context.initSource !== 'missing' || !isStandaloneDemo()) return;
    let active = true;
    requestDemoLaunch().then(launch => {
      if (active && isStandaloneDemo()) mergeInitContext(launch);
    }).catch(error => { if (active) reportError(error); });
    return () => { active = false; };
  }, [context.initSource, mergeInitContext, reportError]);

  useEffect(() => {
    const exit = createDoubleExitHandler({
      getState:()=>liveSpinStateRef.current, recovery:stateRecoveryService, pay:params=>frameApi.pay(params),
      requestId:()=>buildRequestId('exit-pay'),
      onStart:()=>{liveSpinStateRef.current={...liveSpinStateRef.current,status:'processing'};setStatus('processing');},
      onPaid:(result, snapshot)=>{
        const nextPlayer=snapshot.player ? {...snapshot.player,balance:result.balance} : null;
        liveSpinStateRef.current={...liveSpinStateRef.current,spinResult:null,doublingState:createEmptyDoublingState(),doubleState:createDoubleState(),player:nextPlayer,status:"ready"};
        setStatus("ready");
        setSpinResult(null);setDoublingState(createEmptyDoublingState());setDoubleState(createDoubleState());
        if(nextPlayer)setPlayer(nextPlayer);
        postEvent('UPDATE_BALANCE',{balance:result.balance,currency:snapshot.player?.currency});
      },
      onError:error=>{
        const pending=stateRecoveryService.getPendingRequest(liveSpinStateRef.current.context);
        liveSpinStateRef.current={...liveSpinStateRef.current,status:'ready',roundRecoveryBlocked:Boolean(pending)};
        if(pending)setRoundRecoveryStatus(ROUND_OPERATION_STATUS.RECOVERY_REQUIRED);
        reportOperationError(error,tRef.current('paymentUnknown'));
      },
    });
    const exitGame=async (options={})=>{
      if(hasPendingExitRecovery(liveSpinStateRef.current, stateRecoveryService)) {
        freeSpinRunRef.current=false;
        autoPlayOnRef.current=false;
        setAutoPlayOn(false);
        return {handled:true,allowExit:true,pending:true};
      }
      if(liveSpinStateRef.current.freeSpinsLeft>0 || liveSpinStateRef.current.spinResult?.freeSpinDeferred) {
        freeSpinRunRef.current=false;
        autoPlayOnRef.current=false;
        setAutoPlayOn(false);
        if(!options.keepalive) {
          const deadline=Date.now()+10000;
          while(liveSpinStateRef.current.status==="processing" && Date.now()<deadline) await wait(50);
        }
        // The operation may have become uncertain while waiting for it to finish.
        if(hasPendingExitRecovery(liveSpinStateRef.current, stateRecoveryService))
          return {handled:true,allowExit:true,pending:true};
        // Leaving pauses an unfinished series; keep its wins unpaid for continuation.
        if (liveSpinStateRef.current.freeSpinsLeft > 0 || liveSpinStateRef.current.freeSpinCountUnknown)
          return {handled:true,allowExit:true};
        const paid=await liveSpinStateRef.current.settleFreeSpinWins?.(options);
        return {handled:true,allowExit:paid===true};
      }
      return exit(options);
    };
    const unregister=registerDoubleExit(exitGame);
    const pageHide=()=>{void exitGame({keepalive:true});};
    window.addEventListener('pagehide',pageHide);
    return ()=>{unregister();window.removeEventListener('pagehide',pageHide);};
  }, [postEvent, reportOperationError]);

  const init = useCallback(async ({ force = false } = {}) => {
    if (initializationInFlightRef.current) return;
    if (!force && initializedSessionIdRef.current && context.sessionId === initializedSessionIdRef.current) return;
    const missing = getMissingRequiredContext(context);
    if (missing.length) {
      // The standalone launch is still resolving; do not expose a guest grid.
      if (context.initSource === "missing" && isStandaloneDemo()) {
        setStatus("initial-loading");
        return;
      }
      setGames(displayGames);
      setSupportedCombinations(setCombinations, setSelectedCombinationId, gameDefinition?.id ?? context.gameId, displayCombinations);
      setGrid(getInitialGrid(gameDefinition?.id ?? context.recoveryGameId ?? context.gameId));
      setCurrentGame(gameDefinition?.id ?? context.gameId);
      setGridAnimation("settled");
      setStatus("guest");
      setError("");
      return;
    }

    initializationInFlightRef.current = true;
    try {
      setStatus("bootstrap-loading");
      setError("");
      partnerApi.configure(context);
      persistInitContext(context);
      // Each HTTP request has its own aborting timeout. A shared timeout would
      // reject a healthy multi-request bootstrap and leave it running behind Retry.
      const session = await frameApi.initSession(context);
      const paymentRows = await withTimeout(frameApi.getPaytable(), "Paytable");
      if (session.sessionId && session.sessionId !== context.sessionId) {
        const initializedContext = {
          ...context,
          sessionId: session.sessionId,
          backendGameId: session.backendGameId ?? context.backendGameId,
          unfinishedRound: session.unfinishedRound ?? null,
          userId: session.player?.id ?? context.userId,
          idUser: session.player?.id ?? context.idUser,
          balance: session.player?.balance ?? context.balance,
          currency: session.player?.currency ?? context.currency,
        };
        initializedSessionIdRef.current = session.sessionId;
        partnerApi.configure(initializedContext);
        persistInitContext(initializedContext);
        setContext(initializedContext);
      }
      initializedSessionIdRef.current = session.sessionId ?? context.sessionId;
      const pendingRecovery = frameApi.getPendingRequest(context);
      const recoveredState = session.gameState ? null : frameApi.recoverState(context);
      const lastSpinSnapshot = session.gameState ?? stateRecoveryService.getLastSpin(context);
      const confirmedSpinResult = recoveredState?.spinResult ?? recoveredState?.lastConfirmedSpinResult ?? lastSpinSnapshot?.spinResult;
      const needsRecovery = Boolean(pendingRecovery) || session.gameState?.requiresReconciliation || [ROUND_OPERATION_STATUS.SPIN_PROCESSING, ROUND_OPERATION_STATUS.DOUBLE_PROCESSING].includes(recoveredState?.operationStatus);
      if (needsRecovery) {
        // Keep the last confirmed Free Spin result visible while the next
        // request remains unknown and therefore safely blocked.
        if (confirmedSpinResult && recoveredState) {
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
        // The server result is unknown. Keep this round blocked until a
        // recovery response resolves it; never clear or blindly retry it.
        setRoundRecoveryStatus(ROUND_OPERATION_STATUS.RECOVERY_REQUIRED);
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
          setFreeSpinRoundStarted(false);
          setShowFreeSpinPrompt(true);
        }
      }
      if (session.gameState) {
        if (!needsRecovery) stateRecoveryService.registerRestoredUnpaidWin(session.gameState, {...context, sessionId:session.sessionId ?? context.sessionId});
        // Show the confirmed result while any separate pending request remains blocked.
        setSpinResult(session.gameState.spinResult);
        setGridAnimation("settled");
        const remaining = session.gameState.freeSpinsLeft;
        setFreeSpinsLeft(remaining);
        // The server supplies remaining spins, not the original award total.
        setFreeSpinsTotal(remaining);
        setFreeSpinRoundStarted(false);
        setShowFreeSpinPrompt(remaining > 0 && !needsRecovery);
        if (!needsRecovery) {
          setSpinResult(session.gameState.spinResult);
          setDoublingState(session.gameState.doublingState ?? createEmptyDoublingState());
          setDoubleState(session.gameState.doubleState ?? createDoubleState());
          if (session.gameState.doublingState?.step > 0) setHasSessionSpin(true);
          setRoundRecoveryStatus(null);
        }
      }
      setFreeSpinsPaidTotal(session.freeSpinsPaidTotal ?? 0);
      setFreeSpinsWinTotal(session.freeSpinsLeft > 0 || session.gameState?.spinResult?.isFreeSpin ? session.freeSpinsWinTotal ?? null : null);
      setFreeSpinHistoryMissing(session.freeSpinHistoryMissing === true);
      liveSpinStateRef.current = {...liveSpinStateRef.current, freeSpinHistoryMissing:session.freeSpinHistoryMissing === true};
      if (session.freeSpinsLeft != null) {
        setFreeSpinsLeft(session.freeSpinsLeft);
        setFreeSpinsTotal(session.freeSpinsTotal ?? 0);
        setFreeSpinRoundStarted(false);
        setShowFreeSpinPrompt(session.freeSpinsLeft > 0 && !needsRecovery);
        liveSpinStateRef.current = {...liveSpinStateRef.current, freeSpinsLeft:session.freeSpinsLeft, freeSpinsTotal:session.freeSpinsTotal ?? 0, freeSpinCountUnknown:false};
      }
      setPlayer(session.player);
      setGames(session.games);
      setSupportedCombinations(setCombinations, setSelectedCombinationId, gameDefinition?.id ?? context.gameId, session.combinations);
      if (session.gameState) {
        // Zero is used in empty/test snapshots; keep the playable stake in that case.
        if (session.gameState.stake > 0) setStake(session.gameState.stake);
        const restoredCombination = getSupportedCombinations(gameDefinition?.id ?? context.gameId, session.combinations)
          .find(item => item.groups.length === session.gameState.lines);
        if (restoredCombination) setSelectedCombinationId(restoredCombination.id);
      }
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
      postEvent("UPDATE_BALANCE", { balance: session.player.balance, currency: session.player.currency });
      postEvent("LOADED", {
        gameId: context.gameId,
        userId: session.player.id,
      });
    } catch (initError) {
      initializedSessionIdRef.current = null;
      reportError(initError, tRef.current("initError"));
    } finally {
      initializationInFlightRef.current = false;
    }
  }, [context, postEvent, reportError]);

  const retryInitialization = useCallback(async () => {
    const pending = frameApi.getPendingRequest(context);
    if (pending?.methodName !== '/double') return init({ force: true });
    if (initializationInFlightRef.current) return;
    initializationInFlightRef.current = true;
    setStatus("bootstrap-loading");
    try {
      const recovered = await frameApi.recoverDouble(context);
      setSpinResult(recovered.spinResult);
      setDoublingState(recovered.doublingState);
      setDoubleState(recovered.doubleState);
      const restoredGrid = recovered.lastConfirmedGrid ?? recovered.grid ?? recovered.spinResult.grid;
      if (restoredGrid) setGrid(restoredGrid);
      setHasRecoveredGrid(true);
      setGridAnimation("settled");
      setRoundRecoveryStatus(null);
      setRestoredDoubleAvailable(false);
      liveSpinStateRef.current = {...liveSpinStateRef.current, spinResult:recovered.spinResult, doublingState:recovered.doublingState, doubleState:recovered.doubleState, roundRecoveryBlocked:false, status:"ready"};
      setError("");
      setLastKnownState("ready");
      setStatus("ready");
    } catch (error) {
      setRoundRecoveryStatus(ROUND_OPERATION_STATUS.RECOVERY_REQUIRED);
      reportError(error);
    } finally {
      initializationInFlightRef.current = false;
    }
  }, [context, init, reportError, setError]);

  useEffect(() => {
    if (roundRecoveryStatus !== ROUND_OPERATION_STATUS.RECOVERY_REQUIRED) return undefined;

    const restoreResolvedRound = () => {
      const recovered = frameApi.recoverState(context);
      if (!recovered?.spinResult || ![ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION, ROUND_OPERATION_STATUS.WAITING_FOR_COLLECT].includes(recovered.operationStatus)) return;
      setSpinResult(recovered.spinResult);
      setDoublingState(recovered.doublingState ? { ...recovered.doublingState, loading: false, lastPick: "", lastStatus: "" } : createEmptyDoublingState());
      setDoubleState(recovered.doubleState ? { ...recovered.doubleState, loading: false } : createDoubleState());
      setGrid(recovered.lastConfirmedGrid ?? recovered.grid ?? recovered.spinResult.grid ?? getInitialGrid(gameDefinition?.id ?? context.recoveryGameId ?? context.gameId));
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
      setError("unsupported");
      return;
    }
    init();
  }, [context, init]);

  useEffect(() => {
    const reconnect = () => {
      if (status === "network-error" || lastKnownState === "network-error") retryInitialization();
    };
    const disconnect = () => {
      if (lastKnownState === "spin-submitted") {
        setError(tRef.current("connectionLostRecovering"));
        setRoundRecoveryStatus(ROUND_OPERATION_STATUS.RECOVERY_REQUIRED);
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
  }, [retryInitialization, lastKnownState, status]);

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
    freeSpinsLeft > 0 || showFreeSpinPrompt || freeSpinSummary || freeSpinRunRef.current;
  const paytableControlsLocked = showPaytable || autoPlayOn || freeSpinsActive;

  const { collectWin, handleSpin, onAutoPlay, startFreeSpinRun, refreshBalance, settleFreeSpinWins, showFreeSpinCompletion, continueAfterFreeSpins } =
    createSpinActions({
      onRecoveryRequired: () => setRoundRecoveryStatus(ROUND_OPERATION_STATUS.RECOVERY_REQUIRED),
      autoPlayOnRef,
      setAutoPlayOn,
      emitLotteryRevealSounds,
      emitSound,
      freeSpinRunRef,
      resumeAutoPlayAfterFreeSpinsRef,
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
      setFreeSpinsWinTotal,
      setFreeSpinsPaidTotal,
      setFreeSpinSummary,
      setGrid,
      setGridAnimation,
      setGridRevealKey,
      setHasRecoveredGrid,
      setHasSessionSpin,
      setLastKnownState,
      setPlayer,
      setShowFreeSpinPrompt,
      setSpinHistory,
      setSpinResult,
      setStatus,
      showFreeSpinPrompt,
      t,
    });

  liveSpinStateRef.current.settleFreeSpinWins = settleFreeSpinWins;
  useEffect(() => {
    liveSpinStateRef.current.freeSpinSummary = null;
    liveSpinStateRef.current.freeSpinSummaryChecking = false;
    setFreeSpinSummary(null);
  }, [context.playerId, context.userId, context.idUser, context.gameId, context.sessionId]);
  useEffect(() => {
    if (status === 'ready' && freeSpinsLeft === 0 && freeSpinsTotal > 0 && spinResult?.isFreeSpin) {
      void showFreeSpinCompletion();
    }
  }, [status, freeSpinsLeft, freeSpinsTotal, spinResult?.idCard, context]);

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
      showFreeSpinPrompt ||
      status !== "ready" ||
      freeSpinsLeft <= 0 ||
      freeSpinRunRef.current
    ) {
      return;
    }

    void startFreeSpinRun();
  }, [autoPlayOn, freeSpinsLeft, status, showFreeSpinPrompt]);


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
    if (freeSpinHistoryMissing || freeSpinSummary || liveSpinStateRef.current.freeSpinSummaryChecking) return;
    resumeAutoPlayAfterFreeSpinsRef.current = false;
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
      liveSpinStateRef.current = { ...liveSpinStateRef.current, visualMode: nextValue };
      return nextValue;
    });
  };

  const totalPurchase = Number(
    (stake * (selectedCombination?.groups.length ?? 0)).toFixed(2),
  );
  const isRoundRecoveryBlocked = roundRecoveryStatus === ROUND_OPERATION_STATUS.RECOVERY_REQUIRED;
  const isBusy =
    !["ready", "guest"].includes(status) ||
    isRoundRecoveryBlocked ||
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    status === "processing";
  const ticketWinAmount = getTicketWinAmount(spinResult, doublingState);
  const uncollectedWin =
    spinResult?.creditedToBalance !== true &&
    Boolean(spinResult?.idCard) &&
    ticketWinAmount > 0;
  const pendingTicketWin = !spinResult?.freeSpinDeferred && hasTicketWin(spinResult, doublingState);
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
    Boolean(freeSpinSummary) ||
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
  const hasPlayableSession = Boolean(context.token && context.sessionId);
  const spinButtonDisabled =
    Boolean(freeSpinSummary) ||
    status !== "ready" ||
    !hasPlayableSession ||
    !spinAssetsReady ||
    isRoundRecoveryBlocked ||
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    Boolean(doublingState.loading) ||
    (!pendingTicketWin && (!canAffordSpin || freeSpinHistoryMissing));
  const hideHeader =
    context.mode === "embedded" && context.featureFlags?.hiddenHeader !== false;
  const primaryGameAction = (freeSpinsLeft <= 0 && freeSpinsWinTotal > freeSpinsPaidTotal) ? 'collect' : getPrimaryGameAction({isVisualDoubling, pendingTicketWin, hasRecoveredGrid, showFreeSpinPrompt, hasFreeSpinsPending});
  const primaryActionCollectsWin = primaryGameAction === 'collect';
  const shellClass = `frame-app mode-${context.mode} theme-${context.theme}${hideHeader ? " headerless" : ""}${expandedBoard || visualMode ? " expanded-board" : ""}${visualMode ? " view-2" : " view-1"}${isVisualDoubling ? " doubling-active" : ""}`;
  const runtimeStateVisible = !["guest", "ready", "empty", "processing", "initial-loading", "bootstrap-loading"].includes(status);

  const pressSpinButton = () => {
    if (!spinAssetsReady) return;
    if (primaryGameAction === 'collect') return collectWin();
    if (primaryGameAction === 'free-spins') return startFreeSpinRun();
    return handleSpin();
  };

  const playView2WinLine = useCallback(
    (lineIndex) => {
      if (
        !["egypt", "kadima-drevnii", "babylon"].includes(gameDefinition?.id) ||
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
      continueAfterFreeSpins,
      refreshBalance,
      collectWin,
      cycleCombination,
      cycleStake,
      handleSpin,
      init,
      retryInitialization,
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
      freeSpinSummary,
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
    freeSpinsWinTotal,
    freeSpinsPaidTotal,
      freeSpinHistoryMissing,
      games,
      grid,
      gridAnimation,
      gridRevealKey,
      hasRecoveredGrid,
      hasSessionSpin,
      paytableRows,
      paytableStatus,
      recoveringRound,
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
      isRoundRecoveryBlocked,
      isVisualDoubling,
      loginRequired: !hasPlayableSession,
      pendingTicketWin,
      primaryActionCollectsWin,
      paytableControlsLocked,
      runtimeStateVisible,
      selectedCombination,
      shellClass,
      spinAssetsLoading: !spinAssetsReady,
      spinButtonDisabled,
      testMode,
      ticketWinAmount,
      totalPurchase,
      uncollectedWin,
      viewSwitchDisabled,
    },
  };
}


