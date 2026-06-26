import GameShell from "./components/game/GameShell.jsx";
import { useGameController } from "./hooks/useGameController.js";
import "./App.css";

export default function App() {
  const controller = useGameController();
  return <GameShell controller={controller} />;
}
