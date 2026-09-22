export function buildGameContentViewModel({ derived, state, t = (key) => key }) {
  const gridMissing = !derived.isVisualDoubling && !hasPlayableGrid(state.grid);

  const restoredPaid = state.hasRecoveredGrid && state.spinResult?.creditedToBalance === true;

  return {
    view1Grid: restoredPaid
      ? Object.fromEntries(Object.entries(state.grid ?? {}).map(([row, cells]) => [row, Array.isArray(cells) ? cells.map(() => "") : cells]))
      : state.grid,
    // Paid history keeps its symbols and receipt, but must not replay win effects.
    highlightResult: restoredPaid
      ? null
      : state.spinResult,
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