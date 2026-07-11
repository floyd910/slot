import { VIEW2_ASSETS } from "../config/view2Assets.js";
import {
  DEFERRED_GAME_IMAGE_ASSETS,
  FIRST_PAINT_GAME_IMAGE_ASSETS,
  STARTUP_ASSETS,
} from "../config/gameAssets.js";
import {
  CARPET_SOUND_FALLBACK_MS,
  IMAGE_PRELOAD_TIMEOUT_MS,
} from "../config/gameSettings.js";

const CSS_URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/g;

const retainedPreloadedImages = new Map();

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
          await image.decode();
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
        if (rejectOnError) fail();
        else finish();
      }, timeoutMs);
    }
    image.src = normalizedSrc;
  });

export const preloadImages = (sources, options = {}) =>
  Promise.all(uniqueUrls(sources).map((src) => preloadImage(src, options)));

export const preloadRequiredImages = (sources) =>
  preloadImages(sources, {
    decode: true,
    fetchPriority: "high",
    rejectOnError: true,
    timeoutMs: null,
  });

const preloadDeferredImages = (sources) =>
  preloadImages(sources, {
    decode: false,
    fetchPriority: "low",
    rejectOnError: false,
    timeoutMs: IMAGE_PRELOAD_TIMEOUT_MS,
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

const fontReady = () => document.fonts?.ready?.catch?.(() => {}) ?? Promise.resolve();

const loadStartupAssets = async () => {
  const requiredImages = uniqueUrls([
    ...STARTUP_ASSETS.images,
    ...FIRST_PAINT_GAME_IMAGE_ASSETS,
    ...DEFERRED_GAME_IMAGE_ASSETS,
    ...VIEW2_ASSETS,
    ...collectStylesheetImageUrls(),
  ]);

  const animationImages = requiredImages.filter((src) =>
    src.includes("/assets/img/animations/"),
  );
  const decodedImages = requiredImages.filter(
    (src) => !src.includes("/assets/img/animations/"),
  );

  await Promise.all([
    preloadRequiredImages(decodedImages),
    preloadImages(animationImages, {
      decode: false,
      fetchPriority: "high",
      rejectOnError: true,
      timeoutMs: null,
    }),
    fontReady(),
    ...STARTUP_ASSETS.videos.map(preloadVideo),
  ]);
};

const loadDeferredStartupAssets = async () => {
  const criticalUrls = new Set(uniqueUrls(FIRST_PAINT_GAME_IMAGE_ASSETS));
  const deferredImages = uniqueUrls([
    ...STARTUP_ASSETS.images,
    ...DEFERRED_GAME_IMAGE_ASSETS,
    ...VIEW2_ASSETS,
    ...collectStylesheetImageUrls(),
  ]).filter((src) => !criticalUrls.has(src));

  await Promise.all([
    preloadDeferredImages(deferredImages),
    fontReady(),
    ...STARTUP_ASSETS.videos.map(preloadVideo),
  ]);
};

let deferredStartupAssetsPromise = null;

// Run on every gate entry so CSS loaded by a newly imported game chunk is included.
// Browser caching makes already loaded assets resolve immediately.
export const preloadStartupAssets = () => loadStartupAssets();

export const preloadDeferredStartupAssets = () => {
  deferredStartupAssetsPromise ??= loadDeferredStartupAssets().catch((error) => {
    deferredStartupAssetsPromise = null;
    throw error;
  });
  return deferredStartupAssetsPromise;
};
