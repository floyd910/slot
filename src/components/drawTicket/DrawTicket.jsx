import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n.jsx";

const COPY = {
  ru: {
    closeDetails: "Закрыть подробности",
    receiptLabel: "Лотерейная квитанция №",
    drawLabel: "Тираж №",
    description: "Национальная электронная тиражная лотерея «Лото»",
  },
  tg: {
    closeDetails: "Пӯшидани тафсилот",
    receiptLabel: "Чиптаи лотерея №",
    drawLabel: "Тираж №",
    description: "Лотереяи электронии миллии тиражии «Лото»",
  },
};

export default function DrawTicket({ spinResult }) {
  const { language } = useLanguage();
  const copy = COPY[language] ?? COPY.ru;
  const [expanded, setExpanded] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);

  useEffect(() => {
    if (!spinResult?.idCard) return;
    setLastTicket({
      drawNumber: spinResult.idCard,
      receiptNumber: spinResult.Number ?? "—",
    });
  }, [spinResult?.Number, spinResult?.idCard]);

  const expand = () => setExpanded(true);

  return (
    <div
      data-ticket-position="screen-corner"
      aria-expanded={expanded}
      role={!expanded ? "button" : undefined}
      tabIndex={!expanded ? 0 : undefined}
      onClick={!expanded ? expand : undefined}
      onKeyDown={!expanded ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          expand();
        }
      } : undefined}
      className={`grid-bottom-panel grid-bottom-panel--screen-corner${expanded ? " grid-bottom-panel--expanded" : ""}`}
    >
      {expanded && (
        <button
          aria-label={copy.closeDetails}
          className="grid-bottom-panel__close"
          onClick={() => setExpanded(false)}
          type="button"
        >
          <img src="/img/ui/draw-details-close.png" alt="" />
        </button>
      )}
      {expanded && (
        <div className="grid-bottom-panel__receipt">
          {copy.receiptLabel} {lastTicket?.receiptNumber ?? "—"} {copy.description}
        </div>
      )}
      <div className="grid-bottom-panel__footer">
        <div className="grid-bottom-panel__draw">
          <img className="grid-bottom-panel__icon" src="/img/ui/draw-info-icon.png" alt="" />
          {expanded && (
            <span className="grid-bottom-panel__draw-number">
              {copy.drawLabel}{lastTicket?.drawNumber ?? "—"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

