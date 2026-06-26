import "./ResultPanel.css";
import { useLanguage } from "../i18n.jsx";
import { asNumber } from "../utils/number.js";

export default function ResultPanel({ result, freeSpinsTotal, freeSpinsLeft }) {
  const { t } = useLanguage();
  const message = result
    ? getResultMessage(result, freeSpinsTotal, freeSpinsLeft, t)
    : t("chooseTicket");

  return (
    <div className="main-container__wrapper">
      <div className="main-container__info">
        <span>{message}</span>
      </div>
    </div>
  );
}

function getResultMessage(result, freeSpinsTotal, freeSpinsLeft, t) {
  const multiplier = asNumber(result.multiplier, 1);
  const baseWin = asNumber(result.BaseWinSum ?? result.WinSum);
  const finalWin = asNumber(result.WinSum);
  const scatterWin = asNumber(
    result.scatterWin?.totalWin ?? result.scatterWin?.baseWin,
  );

  if (result.scatterCount >= 3 && !result.isFreeSpin) {
    return (
      t("scatters") +
      ": " +
      result.scatterCount +
      ". " +
      t("win") +
      ": " +
      scatterWin.toFixed(2) +
      ". " +
      t("prizeSpins") +
      ": 15."
    );
  }

  if (freeSpinsTotal > 0) {
    return (
      t("prizeSpins") +
      ": " +
      freeSpinsLeft +
      "/" +
      freeSpinsTotal +
      ". x3. " +
      t("win") +
      ": " +
      baseWin.toFixed(2) +
      " -> " +
      finalWin.toFixed(2) +
      "."
    );
  }

  if (result.scatterCount >= 2) {
    return (
      t("scatters") +
      ": " +
      result.scatterCount +
      ". " +
      t("win") +
      ": " +
      scatterWin.toFixed(2) +
      "."
    );
  }

  if (multiplier > 1) {
    return (
      t("win") +
      ": " +
      baseWin.toFixed(2) +
      ". x" +
      multiplier +
      ". " +
      finalWin.toFixed(2) +
      "."
    );
  }

  if (finalWin > 0) {
    return t("congratulations") + ": " + finalWin.toFixed(2) + ".";
  }

  return t("ticketLost");
}
