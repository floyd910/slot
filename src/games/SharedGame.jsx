import GameShell from "../components/game/GameShell.jsx";
import Header from "../components/header/Header.jsx";
import { toGameColorVariables } from "../config/gameColors.js";
import { useSharedGame } from "../hooks/useSharedGame.js";
import "./game3/Game3.css";

export default function SharedGame({ game, onBack }) {
  const { controller } = useSharedGame(game);

  return (
    <div
      className="configured-game"
      data-game-id={game.id}
      style={toGameColorVariables(game.colors)}
    >
      <div hidden={controller.state.startupLoaderVisible}>
        <Header
        menuOpen={controller.state.showGameMenu}
        onMenuOpen={() => controller.actions.setShowGameMenu(true)}
        onBackToSlots={onBack}
        onSoundToggle={controller.actions.toggleSound}
        onViewToggle={controller.actions.toggleVisualMode}
        soundEnabled={controller.state.soundEnabled}
        viewSwitchDisabled={controller.derived.viewSwitchDisabled}
        visualMode={controller.state.visualMode}
      />
      </div>
      <GameShell controller={controller} game={game} onBackToSlots={onBack} />
    </div>
  );
}
