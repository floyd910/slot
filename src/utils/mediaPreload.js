import {
  GAME3_VIEW2_ASSETS,
  SHARED_VIEW2_ASSETS,
} from "../config/view2Assets.js";
import {
  DOUBLE_SCENE_ASSET_SOURCES,
  FIRST_PAINT_GAME_IMAGE_ASSETS,
  getGameFirstPaintAssets,
  STARTUP_ASSETS,
} from "../config/gameAssets.js";
import {
  CARPET_SOUND_SRC,
  CARPET_SOUND_FALLBACK_MS,
  IMAGE_PRELOAD_TIMEOUT_MS,
} from "../config/gameSettings.js";

// A URL owns one request for this app session. Failed entries are retained too,
// preventing remounts from creating an endless missing-asset request loop.
const imageLoadEntries = new Map();
const imageDecodePromises = new Map();
const retainedPreloadedAudio = new Map();
let startupAssetsPromise = null;
const gameAssetsPromises = new Map();
const IMAGE_DECODE_TIMEOUT_MS = 8000;
const GAME5_BUTTON_CLICK_SRC = "/media/game5-button-click-v2.opus";
const GAME_AUDIO_ASSETS_BY_ID = Object.freeze({
  "korvonsaroi-karavan": [
    "/media/game3-view2-win-magical-v2.opus",
    "/media/game1-btn-click.opus",
    "/media/game2-view1-spin.opus",
    "/media/game1-view2-win.opus",
  ],
  "marvorid-djemchug": [
    "/media/game2-view2-carpet-reveal-v2.opus",
    "/media/game2-button-click-v2.opus",
    "/media/game2-view1-reveal.opus",
    "/media/game2-view2-win.opus",
  ],
  "khiradmandi-makor": [
    "/media/game3-view2-carpet-egyptian-v3.opus",
    "/media/game3-view2-carpet-arabian-v2.opus",
  ],
  egypt: [
    "/media/game4-view2-carpet-second-v6.opus",
    "/media/game4-button-click.opus",
    "/media/game4-view1-reveal-v3.opus",
    "/media/game4-view2-win.opus",
  ],
  "kadima-drevnii": [
    "/media/game5-view2-carpet-second-v3.opus",
    GAME5_BUTTON_CLICK_SRC,
    "/media/game5-view1-reveal.opus",
    "/media/game5-view2-win.opus",
  ],
  "khocha-afandi": [
    "/media/game6-view2-carpet-cartoonish-v2.opus",
    "/media/game6-button-click.opus",
    "/media/game6-view1-reveal-v2.opus",
    "/media/game6-view2-win.opus",
  ],
  babylon: [
    "/media/game1-view2-carpet-second-v3.opus",
    "/media/game7-button-click.opus",
    "/media/game7-view1-reveal-v2.opus",
    "/media/game7-view2-win.opus",
  ],
  fruits: [
    "/media/game8-view2-carpet-whimsical-v2.opus",
    "/media/game8-button-click.opus",
    "/media/game8-view1-reveal-v2.opus",
    "/media/game8-view2-win.opus",
  ],
});
export const toPreloadUrl = (src) => {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return "";
  try {
    return new URL(src, document.baseURI).href;
  } catch {
    return src;
  }
};

const uniqueUrls = (sources) => [
  ...new Set(sources.map(toPreloadUrl).filter(Boolean)),
];

const loadImageOnce = (src, fetchPriority, timeoutMs) => {
  const cached = imageLoadEntries.get(src);
  if (cached) return cached;
  const image = new Image();
  const entry = { image, promise: null };
  entry.promise = new Promise((resolve) => {
    let settled = false;
    let timer;
    const settle = (loaded, reason) => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve({ image, loaded, reason });
    };
    image.decoding = "async";
    image.fetchPriority = fetchPriority;
    image.onload = () => settle(image.naturalWidth > 0, "load");
    image.onerror = () => settle(false, "error");
    if (timeoutMs) timer = window.setTimeout(() => settle(false, "timeout"), timeoutMs);
    image.src = src;
  });
  imageLoadEntries.set(src, entry);
  return entry;
};

const decodeImageOnce = (src, image) => {
  if (!image.decode) return Promise.resolve();
  if (!imageDecodePromises.has(src)) {
    imageDecodePromises.set(src, Promise.race([
      image.decode().catch(() => {}),
      new Promise((resolve) => window.setTimeout(resolve, IMAGE_DECODE_TIMEOUT_MS)),
    ]));
  }
  return imageDecodePromises.get(src);
};

export const preloadImage = async (
  src,
  {
    decode = true,
    fetchPriority = "high",
    rejectOnError = false,
    timeoutMs = IMAGE_PRELOAD_TIMEOUT_MS,
  } = {},
) => {
  const normalizedSrc = toPreloadUrl(src);
  if (!normalizedSrc) return undefined;
  const { image, loaded, reason } = await loadImageOnce(
    normalizedSrc,
    fetchPriority,
    timeoutMs,
  ).promise;
  if (!loaded) {
    if (rejectOnError) {
      const message =
        reason === "timeout" ? "Timed out preloading" : "Failed to preload";
      throw new Error(`${message} required image: ${normalizedSrc}`);
    }
    return normalizedSrc;
  }
  if (decode) await decodeImageOnce(normalizedSrc, image);
  return normalizedSrc;
};

export const preloadImages = (sources, options = {}) =>
  Promise.all(uniqueUrls(sources).map((src) => preloadImage(src, options)));

export const preloadRequiredImages = async (
  sources,
  onProgress,
  { timeoutMs = 30000 } = {},
) => {
  const urls = uniqueUrls(sources);
  const total = urls.length;
  let completed = 0;
  onProgress?.(0);

  // Required means decoded before a screen is shown. A longer timeout prevents
  // slow production requests from being marked ready before their pixels exist.
  await Promise.all(
    urls.map(async (src) => {
      await preloadImage(src, {
        decode: true,
        fetchPriority: "high",
        rejectOnError: true,
        timeoutMs,
      });
      completed += 1;
      onProgress?.(Math.floor((completed / total) * 100));
    }),
  );
};
const runWithConcurrency = async (items, limit, task) => {
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await task(item);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
};

const preloadDeferredImages = (sources) =>
  runWithConcurrency(uniqueUrls(sources), 4, (src) =>
    preloadImage(src, {
      decode: false,
      fetchPriority: "low",
      rejectOnError: false,
      timeoutMs: 30000,
    }),
  );

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

const preloadAudioData = async (src) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(toPreloadUrl(src), {
      cache: "force-cache",
      signal: controller.signal,
    });
    if (response.ok) await response.arrayBuffer();
  } catch {
    // A media request failure must not leave the startup overlay stuck.
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const preloadRequiredAudio = (src) =>
  new Promise((resolve, reject) => {
    const normalizedSrc = toPreloadUrl(src);
    const retainedAudio = retainedPreloadedAudio.get(normalizedSrc);
    if (retainedAudio?.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      resolve(normalizedSrc);
      return;
    }

    const audio = retainedAudio ?? new Audio();
    retainedPreloadedAudio.set(normalizedSrc, audio);
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", done);
      audio.removeEventListener("error", fail);
    };
    const done = () => {
      cleanup();
      resolve(normalizedSrc);
    };
    const fail = () => {
      cleanup();
      reject(new Error(`Failed to preload required audio: ${normalizedSrc}`));
    };

    audio.preload = "auto";
    audio.addEventListener("canplaythrough", done, { once: true });
    audio.addEventListener("error", fail, { once: true });
    audio.src = normalizedSrc;
    audio.load();
  });

const warmStartupAudio = () => {
  preloadRequiredAudio(CARPET_SOUND_SRC).catch(() => {
    // Mobile browsers may defer media loading until a user gesture. Audio is
    // optional for first paint, so it must never hold the game loader open.
  });
};

export const loadAudioDurationMs = (src) =>
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

const fontReady = () =>
  Promise.race([
    document.fonts?.ready?.catch?.(() => {}) ?? Promise.resolve(),
    new Promise((resolve) => window.setTimeout(resolve, 5000)),
  ]);

const loadStartupAssets = async (onProgress) => {
  const decodedImages = uniqueUrls(FIRST_PAINT_GAME_IMAGE_ASSETS);

  await Promise.all([
    preloadRequiredImages(decodedImages, onProgress),
    fontReady(),
    ...STARTUP_ASSETS.videos.map(preloadVideo),
  ]);

  warmStartupAudio();
};

const isAssetAllowedForGame = (src, game) => {
  if (!game || typeof src !== "string") return true;
  if (["marvorid-djemchug", "khocha-afandi"].includes(game.id)) {
    return !src.includes("/game3-") && !src.includes("/game4-") && !src.includes("/game5-") && !src.includes("/animations/game4/") && !src.includes("/animations/view2-symbol-");
  }
  if (game.id === "kadima-drevnii") {
    return !src.includes("/game4-") && !src.includes("/game6-") && !src.includes("/animations/game4/") && !src.includes("/animations/game6/");
  }
  if (game.id === "egypt") {
    return !src.includes("/game5-") && !src.includes("/game6-") && !src.includes("/animations/game5/") && !src.includes("/animations/game6/");
  }
  return !src.includes("/game4-") && !src.includes("/game5-") && !src.includes("/game6-") && !src.includes("/animations/game4/") && !src.includes("/animations/game6/");
};

export const getGameView2Assets = (game) => {
  const configuredSymbols = game?.assets?.view2Symbols;

  // Themed games keep their own backgrounds and static symbols, while the
  // shared Game 3 animated WebPs provide their lightweight win animation.
  if (configuredSymbols) {
    return Object.values(configuredSymbols)
      .flatMap(({ background, staticImage, animatedImage, winFrames = [] }) => [
        background,
        staticImage,
        animatedImage,
        ...winFrames,
      ])
      .filter(Boolean);
  }

  return GAME3_VIEW2_ASSETS;
};
export const getGameView2GridAssets = (game) =>
  uniqueUrls([
    ...SHARED_VIEW2_ASSETS,
    ...getGameView2Assets(game).filter(
      (src) => !src.includes("/assets/img/animations/"),
    ),
  ]);

// The visible loader includes both View 1 and the static View 2 grid.
export const getRequiredGameMainScreenAssets = (game) =>
  uniqueUrls([
    game?.assets?.cover,
    game?.assets?.logo,
    ...getGameFirstPaintAssets(game),
    ...getGameView2GridAssets(game),
  ]).filter((src) => isAssetAllowedForGame(src, game));
const getGameAudioAssets = (game) => {
  const customAssets = GAME_AUDIO_ASSETS_BY_ID[game?.id] ?? [];
  const baseAssets =
    game?.id === "khiradmandi-makor" ? STARTUP_ASSETS.audio : [];
  return uniqueUrls([...customAssets, ...baseAssets]);
};

export const preloadGameBackgroundAudio = async (game) => {
  const [carpet, ...remainingAudio] = getGameAudioAssets(game);
  if (carpet) await preloadAudioData(carpet);
  await runWithConcurrency(remainingAudio, 2, preloadAudioData);
};

const getGameDoubleSceneAssets = (game) => {
  const { background, ...sharedAssets } = DOUBLE_SCENE_ASSET_SOURCES;
  return [
    game?.assets?.doubleSceneBackground ?? background,
    ...Object.values(sharedAssets),
  ];
};

const loadDeferredStartupAssets = async (game) => {
  await preloadDeferredImages(getGameDoubleSceneAssets(game));
};

const deferredStartupAssetsPromises = new Map();
const scheduledGameAssetPromises = new Map();
const spinReadyAssetPromises = new Map();

// The shell and controller enter the same gate during startup. Share one load
// so mobile devices do not repeat decode work or attach duplicate media waits.
export const preloadStartupAssets = (onProgress) => {
  if (startupAssetsPromise) onProgress?.(100);
  startupAssetsPromise ??= loadStartupAssets(onProgress).catch((error) => {
    startupAssetsPromise = null;
    throw error;
  });
  return startupAssetsPromise;
};

export const preloadGameAssets = (game, onProgress) => {
  if (!game) return preloadStartupAssets(onProgress);
  // Each game has distinct View 1 artwork. Do not share a completed preload
  // promise across games, otherwise a later game can mount before its own
  // header and cell background have decoded.
  const cacheKey = game.id;
  const cached = gameAssetsPromises.get(cacheKey);
  if (cached) {
    onProgress?.(99, { immediate: true });
    return cached;
  }

  const requiredAssets = getRequiredGameMainScreenAssets(game);
  const promise = Promise.all([
    // Decode each required image once and report completion immediately.
    // No all-request header barrier: production latency cannot pin progress at 0%.
    preloadRequiredImages(
      requiredAssets,
      (progress) => onProgress?.(Math.max(1, Math.min(99, progress))),
      // Slow connections must never cancel navigation back to the chooser.
      // Required game assets wait for load or a real network error.
      { timeoutMs: 0 },
    ),
    fontReady(),
    ...(game.id === "kadima-drevnii"
      ? [preloadAudioData(GAME5_BUTTON_CLICK_SRC)]
      : []),
    ...STARTUP_ASSETS.videos.map(preloadVideo),
  ]).then(() => {
    // All loader-blocking work has completed. The caller reserves 100% until
    // the lazy game module is ready too.
    onProgress?.(99);
    warmStartupAudio();
  }).catch((error) => {
    gameAssetsPromises.delete(cacheKey);
    throw error;
  });

  gameAssetsPromises.set(cacheKey, promise);
  return promise;
};
export const preloadDoubleSceneAssets = (game) =>
  preloadImages(getGameDoubleSceneAssets(game), {
    decode: true,
    fetchPriority: "high",
    rejectOnError: false,
    timeoutMs: 60000,
  });

export const preloadDeferredStartupAssets = (game) => {
  // Each game owns a distinct double-scene background. Never share this cache
  // between games, otherwise a prior game can prevent the later background
  // from being requested.
  const cacheKey = game?.id ?? "shared";
  if (!deferredStartupAssetsPromises.has(cacheKey)) {
    const promise = loadDeferredStartupAssets(game).catch((error) => {
      deferredStartupAssetsPromises.delete(cacheKey);
      throw error;
    });
    deferredStartupAssetsPromises.set(cacheKey, promise);
  }
  return deferredStartupAssetsPromises.get(cacheKey);
};

export const preloadWinAnimations = (game) =>
  preloadImages(
    getGameView2Assets(game).filter((src) => src.includes("/assets/img/animations/")),
    {
      decode: false,
      fetchPriority: "low",
      rejectOnError: false,
      timeoutMs: IMAGE_PRELOAD_TIMEOUT_MS,
    },
  );

export const preloadSpinReadyAssets = (game) => {
  const cacheKey = game?.id ?? "shared";
  if (!spinReadyAssetPromises.has(cacheKey)) {
    const promise = preloadGameBackgroundAudio(game)
      .then(() => preloadWinAnimations(game));
    spinReadyAssetPromises.set(cacheKey, promise);
  }
  return spinReadyAssetPromises.get(cacheKey);
};

export const scheduleDeferredStartupAssets = (game) => {
  const cacheKey = game?.id ?? "shared";
  if (scheduledGameAssetPromises.has(cacheKey)) {
    return scheduledGameAssetPromises.get(cacheKey);
  }

  const promise = new Promise((resolve) => window.setTimeout(resolve, 0))
    .then(() => preloadSpinReadyAssets(game))
    .then(() => preloadDeferredStartupAssets(game))
    .catch((error) => {
      // Keep this settled promise cached. A missing optional asset must not
      // create a request loop every time the game component remounts.
      console.error(error);
    });

  scheduledGameAssetPromises.set(cacheKey, promise);
  return promise;
};


