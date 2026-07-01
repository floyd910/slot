import GameShell from "../../components/game/GameShell.jsx";
import Header from "../../components/header/Header.jsx";
import { useGameController } from "../../hooks/useGameController.js";
import "./Game3.css";

export default function Game3({ slotId, onBack }) {
  const controller = useGameController(slotId);

  return (
    <>
      <Header />
      <GameShell controller={controller} onBackToSlots={onBack} />;
    </>
  );
}
