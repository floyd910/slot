import "./ResultPanel.css";
import { useLanguage } from "../i18n.jsx";

export default function ResultPanel({ result, freeSpinsTotal, freeSpinsLeft }) {
  const { t } = useLanguage();
  const message = result ? getResultMessage(result, freeSpinsTotal, freeSpinsLeft, t) : t("chooseTicket");
  return <div className="main-container__wrapper"><div className="main-container__info"><span>{message}</span></div></div>;
}

function getResultMessage(result, freeSpinsTotal, freeSpinsLeft, t) {
  if (freeSpinsTotal > 0) return `${t("prizeSpins")}: ${freeSpinsLeft}/${freeSpinsTotal}. ${t("win")}: ${result.WinSum.toFixed(2)}.`;
  if (result.scatterCount >= 2) return `${t("scatters")}: ${result.scatterCount}. ${t("win")}: ${result.WinSum.toFixed(2)}.`;
  if (result.WinSum > 0) return `${t("congratulations")}: ${result.WinSum.toFixed(2)}.`;
  return t("ticketLost");
}
