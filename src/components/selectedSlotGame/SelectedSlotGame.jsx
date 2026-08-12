import { getGameRegistration } from "../../games/gameRegistry.js";

export default function SelectedSlotGame({ slotId, onBack }) {
  const registration = getGameRegistration(slotId);
  if (!registration) return null;

  const { Component, game } = registration;
  return <Component key={game.id} game={game} onBack={onBack} />;
}
