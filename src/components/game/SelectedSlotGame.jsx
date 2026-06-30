import GameShell from "./GameShell.jsx";
import { useGameController } from "../../hooks/useGameController.js";
import "../../App.css";

export default function SelectedSlotGame({ slotId, onBack }) {
  const controller = useGameController(slotId);

  return <GameShell controller={controller} onBackToSlots={onBack} />;
}