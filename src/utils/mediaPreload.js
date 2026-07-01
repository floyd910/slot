import { VIEW2_ASSETS } from "../config/view2Assets.js";
import {
  CRITICAL_GAME_IMAGE_ASSETS,
  STARTUP_ASSETS,
} from "../config/gameAssets.js";
import {
  CARPET_SOUND_FALLBACK_MS,
  IMAGE_PRELOAD_TIMEOUT_MS,
} from "../config/gameSettings.js";
import { wait } from "./async.js";

const CSS_URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/g;

export const toPreloadUrl = (src) => {
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

export const preloadImage = (
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

const loadStartupAssets = async () => {
  const fontReady =
    document.fonts?.ready?.catch?.(() => {}) ?? Promise.resolve();
  const criticalImages = [
    ...new Set(CRITICAL_GAME_IMAGE_ASSETS.map(toPreloadUrl)),
  ].filter(Boolean);
  const view2Images = [
    ...new Set(VIEW2_ASSETS.map(toPreloadUrl)),
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

let startupAssetsPromise = null;

export const preloadStartupAssets = () => {
  startupAssetsPromise ??= loadStartupAssets();
  return startupAssetsPromise;
};
