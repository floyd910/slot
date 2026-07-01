import { getGameComponent } from "../../games/gameRegistry.js";

export default function SelectedSlotGame({ slotId, onBack }) {
  const GameComponent = getGameComponent(slotId);

  if (!GameComponent) return null;

  return <GameComponent slotId={slotId} onBack={onBack} />;
}