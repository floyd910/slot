import "./DoubleMode.css";

export default function DoubleMode({ winSum, step, status, onPick, onCollect, loading }) {
  const levels = [0.2, 0.4, 0.8, 1.6, 3.2, 6.4, 12.8, 25.6];

  return (
    <section className="double-stage">
      <aside className="double-levels">
        {levels.map((level, index) => (
          <span key={level} className={index + 1 === step ? "active" : ""}>
            {level.toFixed(2)}
          </span>
        ))}
      </aside>
      <div className="double-scene">
        <button type="button" className="chest left" disabled={loading} onClick={() => onPick("left")}>
          Left
        </button>
        <div className="double-amount">
          <small>Double Amount</small>
          <strong>{winSum.toFixed(2)}</strong>
          <span>{loading ? "Loading..." : status}</span>
        </div>
        <button type="button" className="chest right" disabled={loading} onClick={() => onPick("right")}>
          Right
        </button>
        <button type="button" className="collect-button" disabled={loading} onClick={onCollect}>
          Take Money
        </button>
      </div>
    </section>
  );
}
