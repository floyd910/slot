export function buildGameContentViewModel({ derived, state, t = (key) => key }) {
  const gridMissing = !derived.isVisualDoubling && !hasPlayableGrid(state.grid);

  return {
    // Paid history keeps its symbols and receipt, but must not replay win effects.
    highlightResult: state.hasRecoveredGrid && state.spinResult?.creditedToBalance === true
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