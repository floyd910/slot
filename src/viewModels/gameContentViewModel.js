export function buildGameContentViewModel({ derived, state, t = (key) => key }) {
  const gridMissing = !derived.isVisualDoubling && !hasPlayableGrid(state.grid);

  return {
    alertMessage:
      state.error ||
      (gridMissing ? t("gridOutOfSync") : ""),
    gridMissing,
    showLobby: !state.currentGame,
    showRightPanel: !derived.isVisualDoubling,
    showStandardGame: !derived.isVisualDoubling && !gridMissing,
    showVisualDouble: derived.isVisualDoubling,
  };
}

export function hasPlayableGrid(grid) {
  return Boolean(grid?.A?.length && grid?.B?.length && grid?.C?.length);
}