import { useEffect, useState } from "react";
import { WIN_LINE_HIGHLIGHT_MS } from "../../config/gameSettings.js";

export const ELDORADO_WIN_FRAME_MS = 85;
export const ELDORADO_WIN_CYCLE_MS = WIN_LINE_HIGHLIGHT_MS;
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
  if (frameCount <= 1) return ELDORADO_WIN_FRAME_MS;
  return Math.max(
    ELDORADO_WIN_FRAME_MS,
    Math.round(ELDORADO_WIN_CYCLE_MS / (frameCount * 2 - 2)),
  );
};

export function View2SymbolBase({
  symbol,
  staticImage,
  background,
  winFrames = [],
  shine = null,
  isDice = false,
  forwardLoop = false,
  frameMs = null,
  animated = false,
  highlighted = false,
  dimmed = false,
  comboBorder = null,
  animationKey = "",
}) {
  const [animationFrameTick, setAnimationFrameTick] = useState(0);
  const activeWinFrames = (highlighted || animated) ? winFrames : null;
  const frameCycleLength = activeWinFrames?.length > 1
    ? forwardLoop
      ? activeWinFrames.length
      : activeWinFrames.length * 2 - 2
    : 1;
  const frameDurationMs = activeWinFrames?.length > 1
    ? getFrameDurationMs(frameMs, activeWinFrames.length)
    : ELDORADO_WIN_FRAME_MS;

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

  return (
    <div
      className={`eldorado-cell${isDice ? " --dice" : ""}${highlighted || animated ? " --glow" : ""}${isDice && (highlighted || animated) ? " --dice-video-selected" : ""}${dimmed ? " --opacity" : ""}`}
    >
      <div className="eldorado-cell__container">
        {background && (
          <img
            alt=""
            aria-hidden="true"
            className="eldorado-cell__background"
            src={background}
          />
        )}
        {comboBorder && (
          <img
            alt=""
            aria-hidden="true"
            className="eldorado-cell__combo-border"
            src={comboBorder}
          />
        )}
        {isDice && shine && (highlighted || animated) && (
          <span
            className="eldorado-cell__video-dice"
            style={{ "--eldorado-dice-shine-image": `url("${shine}")` }}
            aria-hidden="true"
          />
        )}
        {activeWinFrames?.length > 1 ? (
          <span className="eldorado-cell__animation" aria-label="image">
            <img
              alt=""
              aria-hidden="true"
              src={activeWinFrames[frameIndex]}
              className={`eldorado-cell__item --${symbol} --frame`}
            />
          </span>
        ) : staticImage ? (
          <img
            alt="image"
            src={staticImage}
            className={`eldorado-cell__item --${symbol}`}
          />
        ) : (
          <span className={`eldorado-cell__fallback --${symbol}`}>
            {symbol}
          </span>
        )}
      </div>
    </div>
  );
}
