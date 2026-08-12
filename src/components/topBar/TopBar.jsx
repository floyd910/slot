import "./TopBar.css";

export default function TopBar({ player }) {
  return (
    <header className="top-bar">
      <div className="brand-lockup">
        <span>
          <strong>betproduct.com</strong>
        </span>
      </div>
      <div className="top-actions">
        <span className="top-balance">{Number(player?.balance ?? 0).toFixed(2)} c.</span>
      </div>
    </header>
  );
}
