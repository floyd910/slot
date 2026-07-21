import { useEffect, useState } from "react";
import { WIN_LINE_HIGHLIGHT_MS } from "../../config/gameSettings.js";

export const VIEW2_SYMBOL_WIN_FRAME_MS = 85;
export const VIEW2_SYMBOL_WIN_CYCLE_MS = WIN_LINE_HIGHLIGHT_MS;
export const VIEW2_SYMBOL_ASSETS = "/img/view2-symbols";

export const view2SymbolAsset = (symbol, file) =>
  `${VIEW2_SYMBOL_ASSETS}/symbol${symbol}/${file}`;

export const view2SymbolFrames = (symbol, count) =>
  Array.from({ length: count }, (_, index) =>
    view2SymbolAsset(symbol, `${index + 1}.png`),
  );

export const view2SymbolAssetSources = (assets) =>
  [
    assets.background,
    assets.staticImage,
    assets.animatedImage,
    assets.shine,
    assets.videoSrc,
    assets.winFrames,
  ]
    .flat()
    .filter(Boolean);

const getPingPongFrameIndex = (tick, frameCount) => {
  if (frameCount <= 1) return 0;
  const cycleLength = frameCount * 2 - 2;
  const cycleIndex = tick % cycleLength;
  return cycleIndex < frameCount ? cycleIndex : cycleLength - cycleIndex;
};

const getFrameDurationMs = (frameMs, frameCount) => {
  if (frameMs) return frameMs;
  if (frameCount <= 1) return VIEW2_SYMBOL_WIN_FRAME_MS;
  return Math.max(
    VIEW2_SYMBOL_WIN_FRAME_MS,
    Math.round(VIEW2_SYMBOL_WIN_CYCLE_MS / (frameCount * 2 - 2)),
  );
};

export function View2SymbolBase({
  symbol,
  staticImage,
  animatedImage = null,
  background,
  winFrames = [],
  shine = null,
  isDice = false,
  forwardLoop = false,
  frameMs = null,
  cycleMs = null,
  singlePlayMs = null,
  animated = false,
  autoSequence = false,
  highlighted = false,
  scatterHighlighted = false,
  comboBorder = null,
  animationKey = "",
}) {
  const [animationFrameTick, setAnimationFrameTick] = useState(0);
  const [animatedImageDone, setAnimatedImageDone] = useState(false);
  const animationActive = highlighted || animated;
  const animatedImagePlayMs =
    singlePlayMs ?? cycleMs ?? VIEW2_SYMBOL_WIN_CYCLE_MS;
  const activeAnimatedImage = animationActive && (!autoSequence || !animatedImageDone) ? animatedImage : null;
  const activeWinFrames = animationActive ? winFrames : null;
  const frameCycleLength = activeWinFrames?.length > 1
    ? forwardLoop
      ? activeWinFrames.length
      : activeWinFrames.length * 2 - 2
    : 1;
  const frameDurationMs = activeWinFrames?.length > 1
    ? getFrameDurationMs(frameMs, activeWinFrames.length)
    : VIEW2_SYMBOL_WIN_FRAME_MS;

  useEffect(() => {
    setAnimatedImageDone(false);
    if (!autoSequence || !animationActive || !animatedImage) return undefined;
    const timeoutId = window.setTimeout(
      () => setAnimatedImageDone(true),
      animatedImagePlayMs,
    );
    return () => window.clearTimeout(timeoutId);
  }, [
    animatedImage,
    animatedImagePlayMs,
    animationActive,
    animationKey,
    symbol,
  ]);

  useEffect(() => {
    setAnimationFrameTick(0);
    if (!activeWinFrames || frameCycleLength <= 1) return undefined;
    const interval = window.setInterval(() => {
      setAnimationFrameTick((tick) => (tick + 1) % frameCycleLength);
    }, frameDurationMs);
    return () => window.clearInterval(interval);
  }, [
    animationKey,
    frameCycleLength,
    frameDurationMs,
    symbol,
    Boolean(activeWinFrames),
  ]);

  const frameIndex =
    activeWinFrames?.length > 1
      ? forwardLoop
        ? animationFrameTick % activeWinFrames.length
        : getPingPongFrameIndex(animationFrameTick, activeWinFrames.length)
      : 0;

  const rootClass = `lottery-grid-view2-cell lottery-grid-view2-cell--symbol-${symbol}${isDice ? " lottery-grid-view2-cell--dice" : ""}${highlighted ? " lottery-grid-view2-cell--highlighted" : ""}${scatterHighlighted ? " lottery-grid-view2-cell--scatter-highlighted" : ""}`;

  return (
    <div className={rootClass}>
      <div className="lottery-grid-view2-cell__container">
        {background && (
          <img
            alt=""
            aria-hidden="true"
            className="lottery-grid-view2-cell__background"
            src={background}
          />
        )}
        {activeAnimatedImage ? (
          <img
            key={`${animationKey}-${activeAnimatedImage}`}
            alt=""
            aria-hidden="true"
            src={activeAnimatedImage}
            className="lottery-grid-view2-cell__image"
          />
        ) : activeWinFrames?.length > 1 ? (
          <span className="lottery-grid-view2-cell__animation" aria-label="image">
            <img
              alt=""
              aria-hidden="true"
              src={activeWinFrames[frameIndex]}
              className="lottery-grid-view2-cell__image"
            />
          </span>
        ) : staticImage ? (
          <img
            alt="image"
            src={staticImage}
            className="lottery-grid-view2-cell__image"
          />
        ) : (
          <span className="lottery-grid-view2-cell__fallback">
            {symbol}
          </span>
        )}
      </div>
    </div>
  );
}
