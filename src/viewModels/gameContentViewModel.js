export function buildGameContentViewModel({ derived, state }) {
  const gridMissing = !derived.isVisualDoubling && !hasPlayableGrid(state.grid);

  return {
    alertMessage:
      state.error ||
      (gridMissing ? "Game session out of sync. Disconnecting board..." : ""),
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