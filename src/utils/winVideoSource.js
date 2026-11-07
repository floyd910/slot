export const LARGE_DESKTOP_WIN_VIDEO_QUERY = "(min-width: 1600px) and (min-height: 900px)";

export const resolveWinVideoSource = (assets) => {
  if (!assets) return null;
  const useLargeDesktop = typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(LARGE_DESKTOP_WIN_VIDEO_QUERY).matches;
  return useLargeDesktop
    ? assets.videoSrcDesktop ?? assets.videoSrc ?? null
    : assets.videoSrc ?? assets.videoSrcDesktop ?? null;
};
