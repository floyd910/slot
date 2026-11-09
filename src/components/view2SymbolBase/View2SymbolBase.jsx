import { useEffect, useRef, useState } from "react";
import WinLineOverlay from "../winLineOverlay/WinLineOverlay.jsx";
import { WIN_LINE_HIGHLIGHT_MS } from "../../config/gameSettings.js";
import { logGameError } from "../../utils/gameErrorDiagnostics.js";
import { resolveWinVideoSource } from "../../utils/winVideoSource.js";

export const VIEW2_SYMBOL_WIN_FRAME_MS = 85;
export const VIEW2_SYMBOL_WIN_CYCLE_MS = WIN_LINE_HIGHLIGHT_MS;

export const view2SymbolAssetSources = (assets) =>
  [
    assets.background,
    assets.staticImage,
    assets.animatedImage,
    assets.shine,
    assets.videoSrc,
    assets.videoSrcDesktop,
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

const sharedVideoStarts = new Map();
const getSharedVideoStart = (symbol) => {
  const now = window.performance.now();
  const existing = sharedVideoStarts.get(symbol);
  if (existing && now - existing.claimedAt < 200) return existing.startAt;
  const next = { claimedAt: now, startAt: now + 80 };
  sharedVideoStarts.set(symbol, next);
  return next.startAt;
};

export function View2SymbolBase({
  symbol,
  staticImage,
  animatedImage = null,
  videoSrc = null,
  videoSrcDesktop = null,
  artworkBorderInset = 0,
  videoBorderCropInset = 0,
  seamlessVideoPoster = false,
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
  const resolvedVideoSrc = resolveWinVideoSource({ videoSrc, videoSrcDesktop });
  const hasArtworkBorder = Number(artworkBorderInset) > 0;
  const videoRef = useRef(null);
  const videoStartRef = useRef(null);
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
    const video = videoRef.current;
    if (!video || !resolvedVideoSrc) return undefined;
    if (!animationActive) {
      video.pause();
      video.currentTime = 0;
      videoStartRef.current = null;
      return undefined;
    }

    setAnimationVisualReady(false);
    const sharedStart = getSharedVideoStart(symbol);
    videoStartRef.current = sharedStart;
    video.currentTime = 0;
    const startSynchronizedPlayback = () => {
      if (videoStartRef.current !== sharedStart) return;
      const elapsedSeconds = Math.max(0, window.performance.now() - sharedStart) / 1000;
      const cycleSeconds = Math.max(0.001, Number(singlePlayMs ?? VIEW2_SYMBOL_WIN_CYCLE_MS) / 1000);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = elapsedSeconds % Math.min(video.duration, cycleSeconds);
      }
      const playPromise = video.play();
      playPromise?.catch?.(() => {
        setAnimationVisualReady(false);
        logGameError({ operation: "ANIMATION", reason: "asset_play_failed", file: resolvedVideoSrc });
      });
    };
    const delay = Math.max(0, sharedStart - window.performance.now());
    const timer = window.setTimeout(startSynchronizedPlayback, delay);
    return () => {
      window.clearTimeout(timer);
      video.pause();
    };
  }, [animationActive, animationKey, symbol, resolvedVideoSrc, singlePlayMs]);


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
  const horizontalInset = Number(artworkBorderInset) / 384 * 100;
  const verticalInset = Number(artworkBorderInset) / 250 * 100;
  const staticImageStyle = hasArtworkBorder ? {
    ...fullCellStyle,
    inset: `${verticalInset}% ${horizontalInset}%`,
    width: `${100 - horizontalInset * 2}%`,
    height: `${100 - verticalInset * 2}%`,
  } : fullCellStyle;
  const animationLayerStyle = {
    ...fullCellStyle,
    opacity: (animationActive || seamlessVideoPoster) && animationVisualReady ? 1 : 0,
    // Keep the decoded static symbol underneath and blend the ready video over
    // it. An instant opacity swap makes the first encoded video frame look
    // like a size/resolution jump even though both layers fill the same cell.
    transition: "opacity 100ms ease-out",
    willChange: "opacity",
  };
  const videoCropHorizontal = Number(videoBorderCropInset) / 384 * 100;
  const videoCropVertical = Number(videoBorderCropInset) / 250 * 100;
  const croppedVideoWidth = 100 / (1 - videoCropHorizontal * 2 / 100);
  const croppedVideoHeight = 100 / (1 - videoCropVertical * 2 / 100);
  const videoStyle = Number(videoBorderCropInset) > 0 ? {
    inset: "auto",
    top: `${-(croppedVideoHeight - 100) / 2}%`,
    left: `${-(croppedVideoWidth - 100) / 2}%`,
    width: `${croppedVideoWidth}%`,
    height: `${croppedVideoHeight}%`,
    maxWidth: "none",
    maxHeight: "none",
    objectFit: "fill",
    transform: "none",
    display: "block",
  } : fullCellStyle;
  const rootClass = `lottery-grid-view2-cell lottery-grid-view2-cell--symbol-${symbol}${isDice ? " lottery-grid-view2-cell--dice" : ""}${hasArtworkBorder ? " lottery-grid-view2-cell--artwork-border" : ""}${highlighted ? " lottery-grid-view2-cell--highlighted" : ""}${scatterHighlighted ? " lottery-grid-view2-cell--scatter-highlighted" : ""}${winLineDimmed ? " lottery-grid-view2-cell--win-dimmed" : ""}`;

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
          <span className={`lottery-grid-view2-cell__static-layer${resolvedVideoSrc && hasArtworkBorder ? " lottery-grid-view2-cell__static-layer--borderless" : ""}`} aria-label="image">
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
              style={staticImageStyle}
            />
          </span>
        ) : null}

        {resolvedVideoSrc ? (
          <span className="lottery-grid-view2-cell__animation" style={animationLayerStyle} aria-label="video">
            <video
              ref={videoRef}
              aria-hidden="true"
              src={resolvedVideoSrc}
              className="lottery-grid-view2-cell__image"
              muted
              playsInline
              loop
              preload={seamlessVideoPoster ? "auto" : "none"}
              onCanPlay={(event) => {
                const video = event.currentTarget;
                const sharedStart = videoStartRef.current;
                if (animationActive && sharedStart != null && window.performance.now() >= sharedStart) {
                  const elapsedSeconds = (window.performance.now() - sharedStart) / 1000;
                  const cycleSeconds = Math.max(0.001, Number(singlePlayMs ?? VIEW2_SYMBOL_WIN_CYCLE_MS) / 1000);
                  if (Number.isFinite(video.duration) && video.duration > 0) {
                    video.currentTime = elapsedSeconds % Math.min(video.duration, cycleSeconds);
                  }
                  video.play().catch(() => {});
                }
                setAnimationVisualReady(true);
              }}
              onError={() => {
                setAnimationVisualReady(false);
                logGameError({
                  operation: "ANIMATION",
                  reason: "asset_load_failed",
                  file: resolvedVideoSrc,
                });
              }}
              style={{...videoStyle, opacity: animationVisualReady ? 1 : 0}}
            />
          </span>
        ) : renderedAnimatedImage ? (
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
