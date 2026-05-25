import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import "./Lobby.css";

export default function Lobby({ games, onSelectGame, loading, error }) {
  return (
    <main className="lobby-screen">
      <button className="nav-arrow left" type="button" aria-label="Previous games">
        <ChevronLeft size={28} />
      </button>
      <section className="game-grid" aria-busy={loading}>
        {loading && <div className="state-panel">Loading games...</div>}
        {error && <div className="state-panel error">{error}</div>}
        {!loading && !error && games.length === 0 && <div className="state-panel">No games available</div>}
        {!loading &&
          !error &&
          games.map((game) => (
            <button
              className="game-card"
              style={{ "--accent": game.accent }}
              type="button"
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              disabled={game.status === "coming"}
            >
              <span className="game-art">
                <span>{game.name.charAt(0)}</span>
              </span>
              <strong>{game.name}</strong>
              <small>{game.subtitle}</small>
              <span className="play-chip">
                <Play size={14} />
                {game.status === "coming" ? "Soon" : "Play"}
              </span>
            </button>
          ))}
      </section>
      <button className="nav-arrow right" type="button" aria-label="Next games">
        <ChevronRight size={28} />
      </button>
      <section className="super-prize">
        <Prize label="Super Prize" value="125 000" />
        <Prize label="Gold Bags" value="x3 Free Spins" />
        <Prize label="Daily Pool" value="42 500" />
      </section>
    </main>
  );
}

function Prize({ label, value }) {
  return (
    <div className="prize-box">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
