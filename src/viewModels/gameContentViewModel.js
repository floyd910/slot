export function buildGameContentViewModel({ derived, state, t = (key) => key }) {
  const gridMissing = !derived.isVisualDoubling && !hasPlayableGrid(state.grid);

  const restoredHistory = state.hasRecoveredGrid && !derived.isRoundRecoveryBlocked && (
    state.spinResult?.creditedToBalance === true ||
    !state.spinResult ||
    (state.spinResult.WinSum != null && Number(state.spinResult.WinSum) <= 0 && !(state.freeSpinsLeft > 0))
  );
  const restoredUnpaidWin = state.hasRecoveredGrid && Boolean(state.spinResult?.idCard) &&
    state.spinResult?.creditedToBalance !== true && Number(state.spinResult?.WinSum ?? 0) > 0;
  const hideView1Symbols = !state.hasSessionSpin && !restoredUnpaidWin;

  return {
    hideView1Symbols,
    view1Grid: hideView1Symbols
      ? Object.fromEntries(Object.entries(state.grid ?? {}).map(([row, cells]) => [row, Array.isArray(cells) ? cells.map(() => "") : cells]))
      : state.grid,
    // Completed history stays available to View 2, but must not replay win effects.
    highlightResult: restoredHistory
      ? null
      : state.spinResult,
    alertMessage:
      state.error ||
      (derived.isRoundRecoveryBlocked ? t("operationPendingRecovery") : "") ||
      (state.freeSpinHistoryMissing ? t("freeSpinHistoryMissing") : "") ||
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
