import "./DoubleMode.css";
import { useLanguage } from "../i18n.jsx";

export default function DoubleMode({ winSum, step, status, onPick, onCollect, loading }) {
  const { isLanguageChanging, t } = useLanguage();
  const levels = [0.2, 0.4, 0.8, 1.6, 3.2, 6.4, 12.8, 25.6];
  const statusText = loading
    ? (isLanguageChanging ? "" : t("loading"))
    : status === "Choose left or right"
      ? t("chooseSide")
      : status;

  return (
    <section className="double-stage">
      <aside className="double-levels">
        {levels.map((level, index) => <span key={level} className={index + 1 === step ? "active" : ""}>{level.toFixed(2)}</span>)}
      </aside>
      <div className="double-scene">
        <button type="button" className="chest left" disabled={loading} onClick={() => onPick("left")}>{t("left")}</button>
        <div className="double-amount">
          <small>{t("doubleAmount")}</small>
          <strong>{winSum.toFixed(2)}</strong>
          <span>{statusText}</span>
        </div>
        <button type="button" className="chest right" disabled={loading} onClick={() => onPick("right")}>{t("right")}</button>
        <button type="button" className="collect-button" disabled={loading} onClick={onCollect}>{t("takeMoney")}</button>
      </div>
    </section>
  );
}
