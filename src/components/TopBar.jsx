import { Coins, Maximize2 } from "lucide-react";

export default function TopBar({ player, mode, onFullscreen }) {
  return (
    <header className="top-bar">
      <div className="brand-lockup">
        <span className="brand-glyph">H</span>
        <span>
          <strong>Hiranmandi Hushhol</strong>
          <small>{mode}</small>
        </span>
      </div>
      <div className="top-actions">
        <div className="balance-pill">
          <Coins size={16} />
          <span>{Number(player?.balance ?? 0).toFixed(2)}</span>
          <small>{player?.currency ?? "GEL"}</small>
        </div>
        <button className="icon-button" type="button" onClick={onFullscreen} title="Fullscreen">
          <Maximize2 size={18} />
        </button>
      </div>
    </header>
  );
}
