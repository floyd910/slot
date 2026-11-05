export function getPrimaryGameAction({isVisualDoubling, pendingTicketWin, hasRecoveredGrid, showFreeSpinPrompt, hasFreeSpinsPending}) {
  if (isVisualDoubling || (hasRecoveredGrid && pendingTicketWin)) return 'collect';
  if (showFreeSpinPrompt || hasFreeSpinsPending) return 'free-spins';
  return pendingTicketWin ? 'collect' : 'spin';
}

export function isSpinBlockedByFunds({
  canAffordSpin,
  freeSpinsLeft,
  pendingTicketWin,
  showFreeSpinPrompt,
}) {
  if (pendingTicketWin) return false;
  const hasFreeSpins = Number(freeSpinsLeft) > 0 || showFreeSpinPrompt === true;
  return !hasFreeSpins && !canAffordSpin;
}
