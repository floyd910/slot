import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import "./Lobby.css";
import { useLanguage } from "../i18n.jsx";

export default function Lobby({ games, onSelectGame, loading, error }) {
  const { t } = useLanguage();
  return (
    <main className="lobby-screen">
      <button className="nav-arrow left" type="button" aria-label={t("previousGames")}><ChevronLeft size={28} /></button>
      <section className="game-grid" aria-busy={loading}>
        {loading && <div className="state-panel">{t("loadingGames")}</div>}
        {error && <div className="state-panel error">{error}</div>}
        {!loading && !error && games.length === 0 && <div className="state-panel">{t("noGames")}</div>}
        {!loading && !error && games.map((game) => (
          <button className="game-card" style={{ "--accent": game.accent }} type="button" key={game.id} onClick={() => onSelectGame(game.id)} disabled={game.status === "coming"}>
            <span className="game-art"><span>{game.name.charAt(0)}</span></span>
            <strong>{game.name}</strong><small>{game.subtitle}</small>
            <span className="play-chip"><Play size={14} />{game.status === "coming" ? t("soon") : t("play")}</span>
          </button>
        ))}
      </section>
      <button className="nav-arrow right" type="button" aria-label={t("nextGames")}><ChevronRight size={28} /></button>
      <section className="super-prize">
        <Prize label={t("superPrize")} value="125 000" /><Prize label={t("goldBags")} value={t("freeSpins")} /><Prize label={t("dailyPool")} value="42 500" />
      </section>
    </main>
  );
}

function Prize({ label, value }) {
  return <div className="prize-box"><small>{label}</small><strong>{value}</strong></div>;
}
