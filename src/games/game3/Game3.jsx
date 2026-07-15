import GameShell from "../../components/game/GameShell.jsx";
import Header from "../../components/header/Header.jsx";
import StartupLoader from "../../components/StartupLoader.jsx";
import { useGame3 } from "../../hooks/useGame3.js";
import "./Game3.css";

export default function Game3({ slotId, onBack }) {
  const { assetsReady, controller } = useGame3(slotId);

  if (!assetsReady) return <StartupLoader ready={false} leaving={false} />;

  return (
    <>
      <Header
        onSoundToggle={controller.actions.toggleSound}
        onViewToggle={controller.actions.toggleVisualMode}
        soundEnabled={controller.state.soundEnabled}
        viewSwitchDisabled={controller.derived.viewSwitchDisabled}
        visualMode={controller.state.visualMode}
      />
      <GameShell controller={controller} onBackToSlots={onBack} />
    </>
  );
}