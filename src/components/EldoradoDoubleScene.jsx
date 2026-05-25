import "./EldoradoDoubleScene.css";

export default function EldoradoDoubleScene({
  amount,
  step,
  loading,
  lastPick,
  lastStatus,
  onPick,
}) {
  const levels = [0.2, 0.4, 0.8, 1.6, 3.2, 6.4, 12.8, 25.6];

  return (
    <section className="eldorado-double doubling-desktop">
      <div className="doubling-header">
        <img
          className="doubling-header__hero --en"
          src="https://lotogame.lotosport.tj/img/eldorado-logo.31ee1229.webp"
          alt="eldorado"
        />
      </div>
      <div className="doubling-desktop__group">
        {levels.map((level, index) => (
          <div
            key={level}
            className={`eldorado-double__level${
              index + 1 === step ? " --active" : ""
            }${index + 1 < step ? " --passed" : ""}`}
          >
            {level.toFixed(2)}
          </div>
        ))}
      </div>
      <div className="eldorado-double__choices" aria-busy={loading}>
        <button
          type="button"
          className={`eldorado-double__choice --left${
            lastPick === "left" ? ` --${lastStatus}` : ""
          }`}
          disabled={loading}
          onClick={() => onPick("left")}
        >
          <span>{lastPick === "left" ? revealText(lastStatus) : ""}</span>
        </button>
        <button
          type="button"
          className={`eldorado-double__choice --right${
            lastPick === "right" ? ` --${lastStatus}` : ""
          }`}
          disabled={loading}
          onClick={() => onPick("right")}
        >
          <span>{lastPick === "right" ? revealText(lastStatus) : ""}</span>
        </button>
      </div>
      <div className="doubling-desktop__result">
        <span>{loading ? "..." : Number(amount ?? 0).toFixed(2)}</span>
      </div>
    </section>
  );
}

function revealText(status) {
  if (status === "win") return "X2";
  if (status === "lose") return "0";
  return "";
}
