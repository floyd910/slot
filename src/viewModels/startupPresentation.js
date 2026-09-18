export function getStartupPresentation({status, loaderExitComplete, checkingSession, hasPlayer, startupLoaderVisible, startupLoaderLeaving, layoutReady, backgroundPaintReady, isLanguageChanging}) {
  const guest = status === 'guest';
  return {
    guest,
    showStartupLoader: !guest && !loaderExitComplete && ((!hasPlayer && checkingSession) || startupLoaderVisible || startupLoaderLeaving || !layoutReady || !backgroundPaintReady) && !isLanguageChanging,
  };
}
