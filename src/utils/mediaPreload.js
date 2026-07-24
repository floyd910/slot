import { VIEW2_ASSETS } from "../config/view2Assets.js";
import {
  DOUBLE_SCENE_ASSETS,
  DEFERRED_GAME_IMAGE_ASSETS,
  FIRST_PAINT_GAME_IMAGE_ASSETS,
  STARTUP_ASSETS,
} from "../config/gameAssets.js";
import {
  CARPET_SOUND_SRC,
  CARPET_SOUND_FALLBACK_MS,
  IMAGE_PRELOAD_TIMEOUT_MS,
} from "../config/gameSettings.js";

const CSS_URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/g;

const retainedPreloadedImages = new Map();
const retainedPreloadedAudio = new Map();
let startupAssetsPromise = null;
const IMAGE_DECODE_TIMEOUT_MS = 8000;
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

const preloadResponseBytes = async (sources, onProgress) => {
  const urls = uniqueUrls(sources);
  if (urls.length === 0) {
    onProgress?.(100);
    return;
  }

  onProgress?.(0);
  const responses = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "force-cache" });
        return response.ok ? response : null;
      } catch {
        return null;
      }
    }),
  );
  const lengths = responses.map((response) =>
    Number(response?.headers.get("content-length") ?? 0),
  );
  const knownLengths = lengths.filter((length) => length > 0);
  const fallbackLength = knownLengths.length
    ? knownLengths.reduce((sum, length) => sum + length, 0) / knownLengths.length
    : 1;
  const weights = responses.map((response, index) =>
    response ? lengths[index] || fallbackLength : fallbackLength,
  );
  const totalBytes = weights.reduce((sum, length) => sum + length, 0);
  let loadedBytes = 0;
  const report = () =>
    onProgress?.(Math.min(99, Math.floor((loadedBytes / totalBytes) * 100)));

  await Promise.all(
    responses.map(async (response, index) => {
      if (!response?.body) {
        loadedBytes += weights[index];
        report();
        return;
      }
      const reader = response.body.getReader();
      let responseBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkBytes = value?.byteLength ?? 0;
        responseBytes += chunkBytes;
        loadedBytes += chunkBytes;
        report();
      }
      if (responseBytes < weights[index]) {
        loadedBytes += weights[index] - responseBytes;
        report();
      }
    }),
  );
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

export const preloadImage = (
  src,
  {
    decode = true,
    fetchPriority = "high",
    rejectOnError = false,
    timeoutMs = IMAGE_PRELOAD_TIMEOUT_MS,
  } = {},
) =>
  new Promise((resolve, reject) => {
    const normalizedSrc = toPreloadUrl(src);
    if (!normalizedSrc) {
      resolve();
      return;
    }

    const retainedImage = retainedPreloadedImages.get(normalizedSrc);
    if (retainedImage?.complete && retainedImage.naturalWidth > 0) {
      if (decode && retainedImage.decode) {
        retainedImage.decode().catch(() => {}).finally(() => resolve(normalizedSrc));
      } else {
        resolve(normalizedSrc);
      }
      return;
    }

    const image = retainedImage ?? new Image();
    retainedPreloadedImages.set(normalizedSrc, image);
    let settled = false;
    let timeoutId = null;

    const clearTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = null;
    };

    const finish = async () => {
      if (settled) return;
      settled = true;
      clearTimer();
      if (decode && image.decode) {
        try {
          await Promise.race([
            image.decode(),
            new Promise((resolve) =>
              window.setTimeout(resolve, IMAGE_DECODE_TIMEOUT_MS),
            ),
          ]);
        } catch {
          // Loaded images can still reject decode in some browsers.
        }
      }
      resolve(normalizedSrc);
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimer();
      if (rejectOnError) {
        reject(new Error(`Failed to preload required image: ${normalizedSrc}`));
        return;
      }
      resolve(normalizedSrc);
    };

    image.decoding = "async";
    image.fetchPriority = fetchPriority;
    image.onload = finish;
    image.onerror = fail;
    if (timeoutMs) {
      timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        clearTimer();
        if (rejectOnError) {
          reject(
            new Error(`Timed out preloading required image: ${normalizedSrc}`),
          );
        } else {
          resolve(normalizedSrc);
        }
      }, timeoutMs);
    }
    image.src = normalizedSrc;
  });

export const preloadImages = (sources, options = {}) =>
  Promise.all(uniqueUrls(sources).map((src) => preloadImage(src, options)));

export const preloadRequiredImages = async (sources, onProgress) => {
  if (onProgress) {
    await preloadResponseBytes(sources, (progress) =>
      onProgress(Math.floor(progress * 0.9)),
    );
  }
  await preloadImages(sources, {
    decode: true,
    fetchPriority: "high",
    rejectOnError: false,
    timeoutMs: 12000,
  });
  onProgress?.(100);
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

const loadDeferredStartupAssets = async () => {
  const criticalUrls = new Set(uniqueUrls(FIRST_PAINT_GAME_IMAGE_ASSETS));
  const deferredImages = uniqueUrls([
    ...STARTUP_ASSETS.images,
    ...DEFERRED_GAME_IMAGE_ASSETS,
    ...VIEW2_ASSETS,
    ...collectStylesheetImageUrls(),
  ]).filter((src) => !criticalUrls.has(src));

  await preloadDeferredImages(deferredImages);
  await runWithConcurrency(STARTUP_ASSETS.audio, 2, preloadAudioData);
  await Promise.all(STARTUP_ASSETS.videos.map(preloadVideo));
};

let deferredStartupAssetsPromise = null;

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

export const preloadView2FirstPaintAssets = () =>
  preloadImages(
    VIEW2_ASSETS.filter(
      (src) => !src.includes("/assets/img/animations/"),
    ),
    {
      decode: true,
      fetchPriority: "high",
      rejectOnError: false,
      timeoutMs: 30000,
    },
  );

export const preloadDoubleSceneAssets = () =>
  preloadImages(DOUBLE_SCENE_ASSETS, {
    decode: true,
    fetchPriority: "high",
    rejectOnError: false,
    timeoutMs: 60000,
  });

export const preloadDeferredStartupAssets = () => {
  deferredStartupAssetsPromise ??= loadDeferredStartupAssets().catch((error) => {
    deferredStartupAssetsPromise = null;
    throw error;
  });
  return deferredStartupAssetsPromise;
};

export const scheduleDeferredStartupAssets = () => {
  const start = () => {
    preloadDeferredStartupAssets().catch((error) => console.error(error));
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(start, { timeout: 1500 });
    return;
  }

  window.setTimeout(start, 0);
};
export const preloadWinAnimations = () =>
  preloadImages(
    VIEW2_ASSETS.filter((src) => src.includes("/assets/img/animations/")),
    {
      decode: false,
      fetchPriority: "low",
      rejectOnError: false,
      timeoutMs: IMAGE_PRELOAD_TIMEOUT_MS,
    },
  );
