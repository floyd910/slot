export function getPrimaryGameAction({isVisualDoubling, pendingTicketWin, hasRecoveredGrid, showFreeSpinPrompt, hasFreeSpinsPending}) {
  if (isVisualDoubling || (hasRecoveredGrid && pendingTicketWin)) return 'collect';
  if (showFreeSpinPrompt || hasFreeSpinsPending) return 'free-spins';
  return pendingTicketWin ? 'collect' : 'spin';
}
