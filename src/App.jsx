import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { frameApi } from "./api/frameApi.js";
import BottomBar from "./components/BottomBar.jsx";
import CombinationSelector from "./components/CombinationSelector.jsx";
import DoubleMode from "./components/DoubleMode.jsx";
import EldoradoDoubleScene from "./components/EldoradoDoubleScene.jsx";
import EldoradoPurchasePanel from "./components/EldoradoPurchasePanel.jsx";
import GameBottomArea from "./components/GameBottomArea.jsx";
import GameMenu from "./components/GameMenu.jsx";
import Lobby from "./components/Lobby.jsx";
import LotteryGrid, {
  ELDORADO_VIEW_ASSETS,
} from "./components/LotteryGrid.jsx";
import Paytable from "./components/Paytable.jsx";
import ResultPanel from "./components/ResultPanel.jsx";
import RuntimeState from "./components/RuntimeState.jsx";
import StartupLoader from "./components/StartupLoader.jsx";
import {
  combinations as fallbackCombinations,
  games as fallbackGames,
  initialGrid,
  paytable as fallbackPaytable,
  stakeOptions,
} from "./data/mockData.js";
import {
  buildRequestId,
  getMissingRequiredContext,
  persistInitContext,
  readFrameParams,
  useFrameBridge,
} from "./hooks/useFrameBridge.js";
import { useGameAudio } from "./hooks/useGameAudio.js";
import WinningsDashboard from "./components/WinningDashboard.jsx";
import { useLanguage } from "./i18n.jsx";
import "./App.css";

const initialContext = readFrameParams();
const REQUEST_TIMEOUT_MS = 9000;
const LOTTERY_REVEAL_STEP_MS = 420;
const LOTTERY_REVEAL_COLUMNS = 5;
const LOTTERY_REVEAL_AUDIO_STOP_MS =
  LOTTERY_REVEAL_STEP_MS * (LOTTERY_REVEAL_COLUMNS - 1) + 320;
const LOTTERY_REVEAL_SETTLE_MS =
  LOTTERY_REVEAL_STEP_MS * (LOTTERY_REVEAL_COLUMNS - 1) + 650;
const FREE_SPIN_COUNT = 15;
const FREE_SPIN_AUTOPLAY_DELAY_MS = 250;
const RETRYABLE_CODES = new Set(["NETWORK_ERROR", "TIMEOUT"]);
const emptyDoubling = {
  active: false,
  entered: false,
  loading: false,
  step: 0,
  marks: ["", "", "", "", ""],
  currentAmount: 0,
  initialAmount: 0,
  deferredBalance: 0,
  split: 0,
  revealKey: 0,
  changedIndex: -1,
  lastPick: "",
  lastStatus: "",
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
const isEnabled = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toLowerCase() === "true";
const IMAGE_PRELOAD_TIMEOUT_MS = 6000;
const CARPET_SOUND_SRC = "/media/carpet.ogg";
const CARPET_SOUND_FALLBACK_MS = 4910;
const CARPET_ANIMATION_TRIM_MS = 2000;
const getCarpetAnimationHalfMs = (durationMs) =>
  Math.round(Math.max(0, durationMs - CARPET_ANIMATION_TRIM_MS) / 2);
const CARPET_ANIMATION_HALF_MS = getCarpetAnimationHalfMs(
  CARPET_SOUND_FALLBACK_MS,
);
const CSS_URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
const STARTUP_VIDEO_SRC = "/media/terminal-loader.mp4";
const GAME_AREA_BACKGROUND_SRC =
  "/img/extracted/игра-Хушкол-элементы-игры-1_0/sprite_001_1282x1026_at_1_1.png";
const GAME_AREA_FOOTER_SRC =
  "/img/extracted/игра-Хушкол-элементы-игры-1_0/sprite_015_1282x196_at_1_1029.png";
const GAME_HEADER_SRC =
  "/img/extracted/игра-Хушкол-элементы-игры-1_0/sprite_003_398x172_at_1492_1.png";
const DOUBLE_SCENE_ASSET_DIR =
  "/img/extracted/\u0442\u0443\u0442-\u0444\u043e\u043d--\u0432\u044b\u0431\u043e\u0440-\u0438\u0433\u0440-\u043f\u0435\u0440\u0432\u0430\u044f-\u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430-\u0438-\u0441\u0440\u0430\u0437\u0443-\u043b\u043e\u0442\u043e\u0440\u0435\u0439\u043d\u044b\u0439-\u0440\u0435\u0436\u0438\u043c_\u0443\u0434\u0432\u043e\u0435\u043d\u0438\u0435-5_0";
const DOUBLE_SCENE_ASSETS = [
  "sprite_001_1336x542_at_1_1.png",
  "sprite_002_21x194_at_1339_1.png",
  "sprite_003_21x194_at_1419_1.png",
  "sprite_004_159x351_at_1447_1.png",
  "sprite_005_250x305_at_1611_1.png",
  "sprite_006_144x160_at_1866_1.png",
  "sprite_007_17x140_at_1343_196.png",
  "sprite_008_18x139_at_1422_197.png",
  "sprite_009_1336x396_at_1_545.png",
  "sprite_010_1336x542_at_1_947.png",
  "sprite_011_160x59_at_211_1491.png",
  "sprite_012_203x57_at_4_1494.png",
  "sprite_013_144x137_at_333_1554.png",
  "sprite_014_164x160_at_1_1558.png",
  "sprite_015_160x56_at_169_1558.png",
  "sprite_016_160x56_at_169_1616.png",
  "sprite_017_160x57_at_169_1674.png",
  "sprite_018_160x58_at_1_1767.png",
  "sprite_019_160x57_at_163_1767.png",
  "sprite_020_160x58_at_163_1826.png",
  "sprite_021_160x58_at_1_1827.png",
  "sprite_022_160x58_at_163_1886.png",
  "sprite_023_160x57_at_1_1887.png",
  "sprite_024_160x57_at_1_1946.png",
  "sprite_025_160x59_at_163_1946.png",
].map((file) => DOUBLE_SCENE_ASSET_DIR + "/" + file);

const CRITICAL_GAME_IMAGE_ASSETS = [
  GAME_AREA_BACKGROUND_SRC,
  GAME_AREA_FOOTER_SRC,
  GAME_HEADER_SRC,
  ...DOUBLE_SCENE_ASSETS,
];
const STARTUP_ASSETS = {
  images: [
    ...CRITICAL_GAME_IMAGE_ASSETS,
    "/img/extracted/игра-Хушкол-элементы-таблица-выигрышей-1_1/sprite_001_1282x1026_at_1_1.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_001_284x152_at_1_1.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_002_284x152_at_1_155.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_003_284x152_at_1_309.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_004_284x102_at_1_463.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_005_284x102_at_1_567.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_006_284x102_at_1_671.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_007_284x152_at_1_775.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_008_284x152_at_1_929.png",
    "/img/extracted/тут-кнопки-справа-1_0/sprite_009_284x152_at_1_1083.png",
    "/img/eldorado-gold-cell.webp",
    "/img/gold-cell-inner.webp",
    "/img/eldorado-winnings-table-bg.webp",
    "/img/eldorado-winnings-title-bg.webp",
  ],
  videos: [STARTUP_VIDEO_SRC],
};

const toPreloadUrl = (src) => {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return "";
  try {
    return new URL(src, document.baseURI).href;
  } catch {
    return src;
  }
};

const collectCssImageUrlsFromText = (text, urls) => {
  CSS_URL_PATTERN.lastIndex = 0;
  let match = CSS_URL_PATTERN.exec(text);
  while (match) {
    const src = toPreloadUrl(match[2]);
    if (src) urls.add(src);
    match = CSS_URL_PATTERN.exec(text);
  }
};

const collectCssRuleImageUrls = (rule, urls) => {
  if (rule.cssText) collectCssImageUrlsFromText(rule.cssText, urls);
  if (rule.cssRules) {
    Array.from(rule.cssRules).forEach((nestedRule) =>
      collectCssRuleImageUrls(nestedRule, urls),
    );
  }
};

const collectStylesheetImageUrls = () => {
  const urls = new Set();
  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      Array.from(sheet.cssRules ?? []).forEach((rule) =>
        collectCssRuleImageUrls(rule, urls),
      );
    } catch {
      // Cross-origin stylesheets cannot expose cssRules; skip them safely.
    }
  });
  return [...urls];
};

const preloadImage = (
  src,
  {
    decode = true,
    fetchPriority = "high",
    timeoutMs = IMAGE_PRELOAD_TIMEOUT_MS,
  } = {},
) =>
  new Promise((resolve) => {
    const normalizedSrc = toPreloadUrl(src);
    if (!normalizedSrc) {
      resolve();
      return;
    }
    const image = new Image();
    let settled = false;
    const done = async () => {
      if (settled) return;
      settled = true;
      if (decode && image.decode) {
        try {
          await image.decode();
        } catch {
          // Loaded images can still reject decode in some browsers.
        }
      }
      resolve();
    };
    image.decoding = "async";
    image.fetchPriority = fetchPriority;
    image.onload = done;
    image.onerror = done;
    if (timeoutMs) window.setTimeout(done, timeoutMs);
    image.src = normalizedSrc;
  });

const preloadVideo = (src) =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.addEventListener("canplaythrough", done, { once: true });
    video.addEventListener("loadeddata", done, { once: true });
    video.addEventListener("error", done, { once: true });
    window.setTimeout(done, 6000);
    video.src = src;
    video.load();
  });

const loadAudioDurationMs = (src) =>
  new Promise((resolve) => {
    const audio = new Audio(src);
    let settled = false;
    const done = (durationMs = CARPET_SOUND_FALLBACK_MS) => {
      if (settled) return;
      settled = true;
      resolve(durationMs);
    };
    audio.preload = "metadata";
    audio.addEventListener(
      "loadedmetadata",
      () => {
        const durationMs = Number.isFinite(audio.duration)
          ? Math.ceil(audio.duration * 1000)
          : CARPET_SOUND_FALLBACK_MS;
        done(durationMs);
      },
      { once: true },
    );
    audio.addEventListener("error", () => done(), { once: true });
    window.setTimeout(() => done(), 2000);
    audio.src = src;
    audio.load();
  });

const preloadStartupAssets = async () => {
  const fontReady =
    document.fonts?.ready?.catch?.(() => {}) ?? Promise.resolve();
  const criticalImages = [
    ...new Set(CRITICAL_GAME_IMAGE_ASSETS.map(toPreloadUrl)),
  ].filter(Boolean);
  const view2Images = [
    ...new Set(ELDORADO_VIEW_ASSETS.map(toPreloadUrl)),
  ].filter((src) => src && !criticalImages.includes(src));
  const images = [
    ...new Set([
      ...STARTUP_ASSETS.images.map(toPreloadUrl),
      ...collectStylesheetImageUrls(),
    ]),
  ].filter(
    (src) => src && !criticalImages.includes(src) && !view2Images.includes(src),
  );
  await Promise.all(
    criticalImages.map((src) =>
      preloadImage(src, {
        decode: true,
        fetchPriority: "high",
        timeoutMs: null,
      }),
    ),
  );
  await Promise.all(
    view2Images.map((src) =>
      preloadImage(src, {
        decode: true,
        fetchPriority: "high",
        timeoutMs: null,
      }),
    ),
  );
  await Promise.all([
    fontReady,
    ...images.map((src) =>
      preloadImage(src, {
        decode: false,
        fetchPriority: "low",
        timeoutMs: IMAGE_PRELOAD_TIMEOUT_MS,
      }),
    ),
    ...STARTUP_ASSETS.videos.map(preloadVideo),
    wait(900),
  ]);
};

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
  const { t } = useLanguage();
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
  const [doubleState, setDoubleState] = useState({
    active: false,
    loading: false,
    step: 1,
    status: "Choose left or right",
  });
  const [doublingState, setDoublingState] = useState(emptyDoubling);
  const [autoPlayOn, setAutoPlayOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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
    player,
    selectedCombination: null,
    spinResult,
    stake,
    status,
    visualMode,
  });

  const toggleAutoPlay = () => {
    setAutoPlayOn((current) => !current);
  };

  const playSound = useGameAudio();
  const emitSound = useCallback(
    (event, payload) => {
      if (visualMode && event !== "carpet") return;
      if (visualMode && event === "carpet") {
        if (soundEnabled) playSound(event, payload);
        return;
      }
      if (!["reveal", "stopReveal", "win"].includes(event)) return;
      if (soundEnabled) playSound(event, payload);
    },
    [playSound, soundEnabled, visualMode],
  );
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
    preloadStartupAssets().then(() => {
      if (active) setStartupAssetsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!visualMode) return;
    ELDORADO_VIEW_ASSETS.forEach((src) => {
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
      player,
      selectedCombination,
      spinResult,
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
      reportError(initError, t("initError"));
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
    setShowPaytable(true);
    setPaytableStatus("ready");
  };

  const handleSpin = async ({ demo = false, freeSpinAuto = false } = {}) => {
    const {
      carpetCloseMs,
      context,
      doubleState,
      doublingState,
      freeSpinsLeft,
      player,
      selectedCombination,
      stake,
      status,
      visualMode,
    } = liveSpinStateRef.current;
    if (
      !selectedCombination ||
      status === "processing" ||
      doubleState.loading ||
      doublingState.loading ||
      (freeSpinRunRef.current && !freeSpinAuto)
    ) {
      return null;
    }
    const isFreeSpin = freeSpinsLeft > 0;
    const testMode = isEnabled(context.testMode ?? context.demoMode);
    const effectiveDemo = isFreeSpin ? false : demo || testMode;
    const totalStake = stake * selectedCombination.groups.length;
    if (
      !effectiveDemo &&
      !isFreeSpin &&
      Number(player?.balance ?? 0) < totalStake
    ) {
      setError(t("insufficientBalance"));
      setLastKnownState("insufficient-balance");
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      return null;
    }
    const requestId = buildRequestId("spin");

    try {
      playSpinFeedback();
      setStatus("processing");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "processing",
      };
      if (!visualMode) setGridAnimation("spinning");
      setDoublingState(emptyDoubling);
      setLastKnownState("spin-submitted");
      setError("");
      setSpinResult(null);
      setPlayer((current) =>
        effectiveDemo || isFreeSpin
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
          isDemo: effectiveDemo,
          isFreeSpin,
          selectedCombination,
          requestId,
        }),
        "Spin",
      );
      if (visualMode) {
        setGridAnimation("spinning");
        emitSound("carpet");
        if (carpetCloseMs > 0) await wait(carpetCloseMs);
      }
      const hasBackendWin = result.hasBackendWin ?? result.WinSum > 0;
      const isDigitWin = result.WinSum > 0;
      const shouldCreditWin =
        !effectiveDemo && result.WinSum > 0 && !isDigitWin;
      if (visualMode) {
        setGrid(result.grid);
        setGridRevealKey((key) => key + 1);
        setGridAnimation("revealing");
        emitLotteryRevealSounds();
      } else {
        flushSync(() => {
          setGrid(result.grid);
          setGridRevealKey((key) => key + 1);
          setGridAnimation("revealing");
        });
        emitLotteryRevealSounds();
      }
      window.setTimeout(
        () => setGridAnimation("settled"),
        LOTTERY_REVEAL_SETTLE_MS,
      );
      const nextSpinResult = { ...result, creditedToBalance: shouldCreditWin };
      const nextDoublingState = isDigitWin
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
            lastPick: "",
            lastStatus: "",
          }
        : emptyDoubling;
      setSpinResult(nextSpinResult);
      setDoublingState(nextDoublingState);
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        spinResult: nextSpinResult,
        doublingState: nextDoublingState,
      };
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

      let shouldShowFreeSpinPrompt = false;
      if (isFreeSpin) {
        const nextFreeSpinsLeft = Math.max(0, freeSpinsLeft - 1);
        setFreeSpinsLeft(nextFreeSpinsLeft);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: nextFreeSpinsLeft,
        };
      } else if (result.FreeSpin) {
        setFreeSpinsTotal(FREE_SPIN_COUNT);
        setFreeSpinsLeft(FREE_SPIN_COUNT);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: FREE_SPIN_COUNT,
        };
        autoPlayOnRef.current = false;
        setAutoPlayOn(false);
        shouldShowFreeSpinPrompt = true;
        if (visualMode) emitSound("freeTickets");
      }

      await wait(LOTTERY_REVEAL_SETTLE_MS);
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      setLastKnownState(hasBackendWin ? "win" : "lose");
      if (hasBackendWin) emitSound("win", result);
      if (visualMode && !hasBackendWin) emitSound("lose", result);
      if (shouldShowFreeSpinPrompt) setShowFreeSpinPrompt(true);
      postEvent("LOADED", { requestId, state: "spin-complete" });
      postEvent("UPDATE_BALANCE", {
        balance: Number(
          (
            player.balance -
            (effectiveDemo || isFreeSpin ? 0 : totalStake) +
            (shouldCreditWin ? result.WinSum : 0)
          ).toFixed(2),
        ),
      });
      if (!hasBackendWin) {
        frameApi
          .pay({ idCard: result.idCard, requestId: buildRequestId("pay") })
          .catch(() => {});
      }
      return result;
    } catch (spinError) {
      setGridAnimation("settled");
      if (!effectiveDemo && !isFreeSpin) {
        setPlayer((current) =>
          current
            ? {
                ...current,
                balance: Number((current.balance + totalStake).toFixed(2)),
              }
            : current,
        );
      }
      reportOperationError(spinError, t("spinUnknown"));
      return null;
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
    const { player, spinResult, status } = liveSpinStateRef.current;
    if (
      !spinResult?.idCard ||
      Number(spinResult.WinSum ?? 0) <= 0 ||
      status === "processing"
    )
      return false;
    const requestId = buildRequestId("pay");
    const payout = Number(spinResult.WinSum ?? 0);
    const alreadyCredited = spinResult.creditedToBalance;
    try {
      setStatus("processing");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "processing",
      };
      setLastKnownState("pay-submitted");
      await withTimeout(
        frameApi.pay({ idCard: spinResult.idCard, requestId }),
        "Pay",
      ).catch(() => null);
      if (!alreadyCredited) {
        setPlayer((current) => {
          if (!current) return current;
          const nextPlayer = {
            ...current,
            balance: Number((Number(current.balance ?? 0) + payout).toFixed(2)),
          };
          liveSpinStateRef.current = {
            ...liveSpinStateRef.current,
            player: nextPlayer,
          };
          return nextPlayer;
        });
      }
      const nextDoubleState = {
        active: false,
        loading: false,
        step: 1,
        status: "Choose left or right",
      };
      setDoubleState(nextDoubleState);
      setDoublingState(emptyDoubling);
      setSpinResult(null);
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        doubleState: nextDoubleState,
        doublingState: emptyDoubling,
        spinResult: null,
        status: "ready",
      };
      setLastKnownState("paid");
      emitSound("cashout");
      if (!alreadyCredited)
        postEvent("UPDATE_BALANCE", {
          balance: Number((Number(player?.balance ?? 0) + payout).toFixed(2)),
        });
      return true;
    } catch (payError) {
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      return false;
    }
  };

  const startFreeSpinRun = async () => {
    if (freeSpinRunRef.current || liveSpinStateRef.current.freeSpinsLeft <= 0)
      return;

    freeSpinRunRef.current = true;
    setShowFreeSpinPrompt(false);
    try {
      while (liveSpinStateRef.current.freeSpinsLeft > 0) {
        const result = await handleSpin({ demo: true, freeSpinAuto: true });
        if (!result) break;
        if (liveSpinStateRef.current.freeSpinsLeft > 0)
          await wait(FREE_SPIN_AUTOPLAY_DELAY_MS);
      }
    } finally {
      freeSpinRunRef.current = false;
    }
  };

  const onAutoPlay = async () => {
    if (freeSpinRunRef.current || showFreeSpinPrompt) return;
    const result = await handleSpin({ demo: true });
    if (!result) return;
    await wait(1000);
    if (!autoPlayOnRef.current) return;
    await collectWin();
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

  const enterVisualDouble = () => {
    if (
      !visualMode ||
      !spinResult?.idCard ||
      Number(spinResult?.WinSum ?? 0) <= 0 ||
      doublingState.loading ||
      status === "processing"
    )
      return;

    setDoublingState((current) => ({
      ...emptyDoubling,
      ...current,
      active: true,
      entered: true,
      loading: false,
      currentAmount: Number(spinResult.WinSum),
      initialAmount: Number(spinResult.WinSum),
      lastPick: "",
      lastStatus: "",
    }));
    setLastKnownState("double");
  };

  const playFooterDouble = async (side = "x2") => {
    if (!spinResult?.idCard || doublingState.loading || status === "processing")
      return;
    const step = doublingState.step || 0;
    const currentAmount = Number(
      doublingState.currentAmount || spinResult.WinSum || 0,
    );
    if (step >= 5 || currentAmount <= 0) return;
    try {
      emitSound("double");
      if (step === 0 && spinResult.creditedToBalance) {
        setPlayer((current) => ({
          ...current,
          balance: Number((current.balance - spinResult.WinSum).toFixed(2)),
        }));
        setSpinResult((current) =>
          current ? { ...current, creditedToBalance: false } : current,
        );
      }
      setStatus("processing");
      setDoublingState((current) => ({
        ...emptyDoubling,
        ...current,
        active: true,
        entered: true,
        loading: true,
        currentAmount,
        changedIndex: step,
        lastPick: side === "left" || side === "right" ? side : "",
        lastStatus: "",
      }));
      // Temporary local double-mode outcome: each choice is an even 50/50 chance.
      const won = Math.random() < 0.5;
      const visibleWin = won ? Number((currentAmount * 2).toFixed(2)) : 0;
      const result = { WinSum: visibleWin };
      if (won) {
        setSpinResult((current) =>
          current
            ? { ...current, WinSum: visibleWin, creditedToBalance: false }
            : current,
        );
      }
      setDoublingState((current) => {
        const marks = [...current.marks];
        marks[step] = won ? "x2" : "x0";
        return {
          ...current,
          active: won && step + 1 < 5 && result.WinSum > 0,
          loading: true,
          step: won ? step + 1 : step,
          marks,
          currentAmount: won ? result.WinSum : 0,
          revealKey: current.revealKey + 1,
          changedIndex: step,
          lastPick: side === "left" || side === "right" ? side : "",
          lastStatus: won ? "win" : "lose",
        };
      });
      setLastKnownState(won ? "double-win" : "double-lose");
      emitSound(won ? "win" : "lose", result);
      if (won) {
        window.setTimeout(() => {
          setDoublingState((current) =>
            current.lastStatus === "win"
              ? { ...current, loading: false, lastPick: "", lastStatus: "" }
              : current,
          );
          setStatus("ready");
        }, 1500);
      } else {
        setStatus("ready");
        frameApi
          .pay({ idCard: spinResult.idCard, requestId: buildRequestId("pay") })
          .catch(() => {});
        window.setTimeout(() => {
          setSpinResult((current) =>
            current
              ? {
                  ...current,
                  WinSum: 0,
                  winningCells: [],
                  lineWins: [],
                  scatterCells: [],
                  creditedToBalance: false,
                }
              : current,
          );
          setGridAnimation("idle");
          setDoublingState(emptyDoubling);
        }, 2700);
      }
    } catch (doubleError) {
      setDoublingState((current) => ({ ...current, loading: false }));
      reportError(doubleError, t("doubleUnknown"));
    }
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
        status: `${t("opening")} ${t(side)}...`,
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
            ? `${t(result.side)} ${t("doubleWon")}`
            : `${t(result.side)} ${t("doubleLost")}`,
      }));
      setStatus("ready");
      setLastKnownState(result.status === "win" ? "double-win" : "double-lose");
      emitSound(result.status === "win" ? "win" : "lose");
      if (result.WinSum <= 0) {
        frameApi
          .pay({ idCard: spinResult.idCard, requestId: buildRequestId("pay") })
          .catch(() => {});
      }
    } catch (doubleError) {
      setDoubleState((current) => ({
        ...current,
        loading: false,
        status: t("retryDouble"),
      }));
      reportError(doubleError, t("doubleUnknown"));
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
    if (action === "fullscreen" && !visualMode)
      setExpandedBoard((value) => !value);
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
      ? t("visualMode")
      : t("lotteryMode")
    : t("gameSelect");
  const totalPurchase = Number(
    (stake * (selectedCombination?.groups.length ?? 0)).toFixed(2),
  );
  const isBusy =
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    status === "processing";
  const pendingTicketWin = Number(spinResult?.WinSum ?? 0) > 0;
  const isDoublingLocked =
    pendingTicketWin || Boolean(doublingState.active || doublingState.loading);
  const testMode = isEnabled(context.testMode ?? context.demoMode);
  const canAffordSpin =
    testMode ||
    freeSpinsLeft > 0 ||
    Number(player?.balance ?? 0) >= totalPurchase;
  const isVisualDoubling =
    visualMode &&
    Number(spinResult?.WinSum ?? 0) > 0 &&
    Boolean(
      doublingState.entered || doublingState.loading || doublingState.step > 0,
    );
  const spinButtonDisabled =
    status === "initial-loading" ||
    status === "bootstrap-loading" ||
    Boolean(doublingState.loading) ||
    (!pendingTicketWin && !canAffordSpin);
  const hideHeader =
    context.mode === "embedded" && context.featureFlags?.hiddenHeader !== false;
  const shellClass = `frame-app mode-${context.mode} theme-${context.theme}${hideHeader ? " headerless" : ""}${expandedBoard || visualMode ? " expanded-board" : ""}${visualMode ? " view-2 --eldorado" : " view-1"}${isVisualDoubling ? " doubling-active" : ""}`;
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
        error={status === "empty" ? t("noGames") : ""}
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
          {isVisualDoubling ? (
            <EldoradoPurchasePanel
              amount={doublingState.currentAmount ?? spinResult?.WinSum ?? 0}
              deferredBalance={doublingState.deferredBalance}
              balance={player?.balance ?? 0}
              totalPurchase={totalPurchase}
            />
          ) : (
            <CombinationSelector
              combinations={combinations}
              selectedCombinationId={selectedCombinationId}
              disabled={isBusy || isDoublingLocked}
              onSelect={(comboId) => {
                emitSound("buttonPress");
                setSelectedCombinationId(comboId);
              }}
            />
          )}
        </aside>
        <section className="main-container__center" aria-busy={isBusy}>
          {error && (
            <div className="inline-alert">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}
          {isVisualDoubling ? (
            <EldoradoDoubleScene
              amount={doublingState.currentAmount ?? spinResult?.WinSum ?? 0}
              ladderAmount={
                doublingState.initialAmount ?? spinResult?.WinSum ?? 0
              }
              step={doublingState.step || 0}
              loading={doublingState.loading}
              lastPick={doublingState.lastPick}
              lastStatus={doublingState.lastStatus}
              onPick={playFooterDouble}
            />
          ) : (
            <>
              <LotteryGrid
                grid={grid}
                revealKey={gridRevealKey}
                animationState={gridAnimation}
                visualMode={visualMode}
                carpetCloseMs={carpetCloseMs}
                carpetOpenMs={carpetOpenMs}
                winningCells={spinResult?.winningCells}
                winningGroups={spinResult?.lineWins}
                scatterCells={spinResult?.scatterCells}
                doublingState={doublingState}
              />
              <span className="info_msg">
                {t("moreInfo").split("\n")[0]} <br />
                {t("moreInfo").split("\n")[1]}
              </span>
            </>
          )}
        </section>

        {!isVisualDoubling && (
          <div className="main-container__right">
            <WinningsDashboard
              stake={stake}
              selectedCombination={selectedCombination}
              spinResult={spinResult}
              doublingState={doublingState}
              revealComplete={gridAnimation === "settled"}
            />
          </div>
        )}
      </>
    ));

  return (
    <div
      className={shellClass}
      data-module-mode={context.mode}
      data-startup-loading={startupLoaderVisible ? "true" : "false"}
    >
      <div className="game_area">
        <img
          className="header_img"
          alt="Betproduct.com"
          src={GAME_HEADER_SRC}
        />
        {freeSpinsLeft > 0 && !showFreeSpinPrompt && (
          <div className="free-spins-progress" aria-live="polite">
            <span>FREE SPINS LEFT: {freeSpinsLeft}</span>
            <strong>x3</strong>
          </div>
        )}

        <div className="game-main-layout">
          <div className="frame-content">{content}</div>
          {!runtimeState && (
            <>
              <GameBottomArea
                player={player}
                stake={stake}
                totalPurchase={totalPurchase}
                selectedCombination={selectedCombination}
                spinResult={spinResult}
                revealComplete={gridAnimation === "settled"}
              />
              <BottomBar
                player={player}
                stake={stake}
                totalPurchase={totalPurchase}
                selectedCombination={selectedCombination}
                spinResult={spinResult}
                freeSpinsLeft={freeSpinsLeft}
                multiplier={freeSpinsLeft > 0 ? 3 : 1}
                disabled={isBusy}
                spinDisabled={spinButtonDisabled}
                spinFeedbackActive={spinFeedbackActive}
                doublingState={doublingState}
                revealComplete={gridAnimation === "settled"}
                visualMode={visualMode}
                isVisualDoubling={isVisualDoubling}
                onCollect={collectWin}
                onPickLeft={() => playFooterDouble("left")}
                onPickRight={() => playFooterDouble("right")}
                autoPlayOn={autoPlayOn}
                onDecreaseCombination={() => cycleCombination(-1)}
                onIncreaseCombination={() => cycleCombination(1)}
                onDecreaseStake={() => cycleStake(-1)}
                onIncreaseStake={() => cycleStake(1)}
                onSpin={() =>
                  pendingTicketWin ? collectWin() : handleSpin({ demo: true })
                }
                onDouble={visualMode ? enterVisualDouble : playFooterDouble}
                onTakeMoney={collectWin}
                onInfo={loadPaytable}
                onVisualToggle={() => handleAction("visual")}
                onAutoPlay={toggleAutoPlay}
              />
            </>
          )}
        </div>
        {showPaytable && (
          <Paytable
            rows={paytableRows}
            loading={paytableStatus === "loading"}
            error={paytableStatus === "error" ? t("paytableLoadError") : ""}
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
        {showFreeSpinPrompt && (
          <div className="free-spins-modal" role="dialog" aria-modal="true">
            <div className="free-spins-modal__card">
              <span className="free-spins-modal__eyebrow">BONUS ROUND</span>
              <strong>You have 15 Free Spins</strong>
              <span className="free-spins-modal__multiplier">
                Multiplier x3
              </span>
              <button type="button" onClick={startFreeSpinRun}>
                START FREE SPINS
              </button>
            </div>
          </div>
        )}
        {startupLoaderVisible && (
          <StartupLoader
            videoSrc={STARTUP_VIDEO_SRC}
            ready={startupAssetsReady}
            leaving={startupLoaderLeaving}
          />
        )}
      </div>
    </div>
  );
}
