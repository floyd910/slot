import { useEffect, useState } from "react";
import WinLineOverlay from "../winLineOverlay/WinLineOverlay.jsx";
import { WIN_LINE_HIGHLIGHT_MS } from "../../config/gameSettings.js";
import { logGameError } from "../../utils/gameErrorDiagnostics.js";

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
  fillCell = false,
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
  winLineDimmed = false,
  winLineOverlay = null,
}) {
  const animationActive = highlighted || animated;
  const [animationClockMs, setAnimationClockMs] = useState(() =>
    typeof window === "undefined" ? 0 : window.performance.now(),
  );
  const [animatedImageDone, setAnimatedImageDone] = useState(false);
  // Winning artwork is decoded by the Spin controller before the result is
  // revealed. Start visible synchronously so React does not add a one-frame
  // opacity delay while waiting for an onLoad event from the browser cache.
  const [animationVisualReady, setAnimationVisualReady] = useState(true);

  const animatedImagePlayMs =
    singlePlayMs ?? cycleMs ?? VIEW2_SYMBOL_WIN_CYCLE_MS;
  // Both visual layers stay mounted for the lifetime of the cell. Highlighting
  // only changes opacity; it never creates or destroys either image node.
  const renderedAnimatedImage = animatedImage
    ? autoSequence && animatedImageDone
      ? null
      : animatedImage
    : null;
  const renderedWinFrames = winFrames;
  const frameCycleLength = winFrames.length > 1
    ? forwardLoop
      ? winFrames.length
      : winFrames.length * 2 - 2
    : 1;
  const frameDurationMs = winFrames.length > 1
    ? getFrameDurationMs(frameMs, winFrames.length)
    : VIEW2_SYMBOL_WIN_FRAME_MS;

  useEffect(() => {
    setAnimationVisualReady(true);
  }, [animationActive, animationKey, symbol]);


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
    if (!animationActive || winFrames.length <= 1) return undefined;

    // Use one absolute clock instead of a per-cell counter. A symbol returning
    // on another win line therefore resumes at its current frame, and matching
    // symbols remain frame-synchronised throughout the complete win sequence.
    const updateClock = () => setAnimationClockMs(window.performance.now());
    updateClock();
    const interval = window.setInterval(updateClock, frameDurationMs);
    return () => window.clearInterval(interval);
  }, [animationActive, frameDurationMs, winFrames.length]);

  const animationFrameTick = Math.floor(animationClockMs / frameDurationMs);
  const frameIndex =
    winFrames.length > 1
      ? forwardLoop
        ? animationFrameTick % winFrames.length
        : getPingPongFrameIndex(animationFrameTick, winFrames.length)
      : 0;

  const fullCellStyle = fillCell ? {
    inset: 0, width: "100%", height: "100%", maxWidth: "none", maxHeight: "none",
    objectFit: "fill", transform: "none", display: "block",
  } : undefined;
  const animationLayerStyle = {
    ...fullCellStyle,
    opacity: animationActive && animationVisualReady ? 1 : 0,
    transition: "none",
    willChange: "opacity",
  };
  const rootClass = `lottery-grid-view2-cell lottery-grid-view2-cell--symbol-${symbol}${isDice ? " lottery-grid-view2-cell--dice" : ""}${highlighted ? " lottery-grid-view2-cell--highlighted" : ""}${scatterHighlighted ? " lottery-grid-view2-cell--scatter-highlighted" : ""}${winLineDimmed ? " lottery-grid-view2-cell--win-dimmed" : ""}`;

  return (
    <div className={rootClass}>
      <WinLineOverlay overlay={winLineOverlay} variant="view2" />
      <div className="lottery-grid-view2-cell__container">
        {background && (
          <img
            alt=""
            aria-hidden="true"
            className="lottery-grid-view2-cell__background"
            src={background}
          />
        )}
        {staticImage ? (
          <span className="lottery-grid-view2-cell__static-layer" aria-label="image">
            <img
              alt=""
              aria-hidden="true"
              src={staticImage}
              className="lottery-grid-view2-cell__image lottery-grid-view2-cell__image--static"
              onError={() => {
                logGameError({
                  operation: "ANIMATION",
                  reason: "asset_load_failed",
                  file: staticImage,
                  error: Object.assign(new Error("View 2 symbol asset failed to load"), {
                    file: staticImage,
                  }),
                });
              }}
              style={fullCellStyle}
            />
          </span>
        ) : null}

        {renderedAnimatedImage ? (
          <span className="lottery-grid-view2-cell__animation" style={animationLayerStyle} aria-label="image">
            <img
              key={renderedAnimatedImage}
              alt=""
              aria-hidden="true"
              src={renderedAnimatedImage}
              className="lottery-grid-view2-cell__image"
              onLoad={() => setAnimationVisualReady(true)}
              onError={() => {
                setAnimationVisualReady(false);
                logGameError({
                  operation: "ANIMATION",
                  reason: "asset_load_failed",
                  file: renderedAnimatedImage,
                });
              }}
              style={{...fullCellStyle, opacity: animationVisualReady ? 1 : 0}}
            />
          </span>
        ) : renderedWinFrames?.length > 1 ? (
          <span className="lottery-grid-view2-cell__animation" style={animationLayerStyle} aria-label="image">
            <img
              alt=""
              aria-hidden="true"
              src={renderedWinFrames[frameIndex]}
              className="lottery-grid-view2-cell__image"
              onLoad={() => setAnimationVisualReady(true)}
              onError={() => {
                setAnimationVisualReady(false);
                logGameError({
                  operation: "ANIMATION",
                  reason: "asset_load_failed",
                  file: renderedWinFrames[frameIndex],
                });
              }}
              style={{...fullCellStyle, opacity: animationVisualReady ? 1 : 0}}
            />
          </span>
        ) : null}
      </div>
    </div>
  );
}
