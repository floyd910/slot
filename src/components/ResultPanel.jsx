import "./ResultPanel.css";
import { useLanguage } from "../i18n.jsx";

export default function ResultPanel({ result, freeSpinsTotal, freeSpinsLeft }) {
  const { t } = useLanguage();
  const message = result ? getResultMessage(result, freeSpinsTotal, freeSpinsLeft, t) : t("chooseTicket");
  return <div className="main-container__wrapper"><div className="main-container__info"><span>{message}</span></div></div>;
}

function getResultMessage(result, freeSpinsTotal, freeSpinsLeft, t) {
  const multiplier = Number(result.multiplier ?? 1);
  const baseWin = Number(result.BaseWinSum ?? result.WinSum ?? 0);
  const finalWin = Number(result.WinSum ?? 0);
  const scatterWin = Number(result.scatterWin?.totalWin ?? result.scatterWin?.baseWin ?? 0);
  if (result.scatterCount >= 3 && !result.isFreeSpin) {
    return `${t("scatters")}: ${result.scatterCount}. ${t("win")}: ${scatterWin.toFixed(2)}. ${t("prizeSpins")}: 15.`;
  }
  if (freeSpinsTotal > 0) {
    return `${t("prizeSpins")}: ${freeSpinsLeft}/${freeSpinsTotal}. x3. ${t("win")}: ${baseWin.toFixed(2)} -> ${finalWin.toFixed(2)}.`;
  }
  if (result.scatterCount >= 2) return `${t("scatters")}: ${result.scatterCount}. ${t("win")}: ${scatterWin.toFixed(2)}.`;
  if (multiplier > 1) return `${t("win")}: ${baseWin.toFixed(2)}. x${multiplier}. ${finalWin.toFixed(2)}.`;
  if (result.WinSum > 0) return `${t("congratulations")}: ${result.WinSum.toFixed(2)}.`;
  return t("ticketLost");
}
