export function getStartupPresentation({status, loaderExitComplete, checkingSession, hasPlayer, startupLoaderVisible, startupLoaderLeaving, layoutReady, backgroundPaintReady, isLanguageChanging}) {
  const guest = status === 'guest';
  const startupFailed = !['guest', 'initial-loading', 'bootstrap-loading', 'ready', 'empty', 'processing'].includes(status);
  return {
    guest,
    showStartupLoader: !startupFailed && !guest && !isLanguageChanging && (
      checkingSession || (!loaderExitComplete && (startupLoaderVisible || startupLoaderLeaving || !layoutReady || !backgroundPaintReady))
    ),
  };
}
