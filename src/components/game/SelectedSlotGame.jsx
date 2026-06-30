import GameShell from "./GameShell.jsx";
import { useGameController } from "../../hooks/useGameController.js";
import "../../App.css";

export default function SelectedSlotGame({ slotId, onBack }) {
  const controller = useGameController(slotId);

  return (
    <>
      <button type="button" className="child-slot-back" onClick={onBack}>
        Slots
      </button>
      <GameShell controller={controller} onBackToSlots={onBack} />
    </>
  );
}
