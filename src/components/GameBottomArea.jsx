import "./GameBottomArea.css";
import { useLanguage } from "../i18n.jsx";
import { getTicketWinAmount } from "../utils/gameResult.js";

const formatMoney = (value) => Number(value ?? 0).toFixed(2);

export default function GameBottomArea({
  player,
  stake,
  totalPurchase,
  selectedCombination,
  spinResult,
  revealComplete = true,
}) {
  const { t } = useLanguage();
  const combinationCount = selectedCombination?.groups?.length ?? 1;
  const cashback = Number(player?.balance ?? 0) * 0.1;
  const ticketWin = revealComplete ? getTicketWinAmount(spinResult) : 0;

  return (
    <section className="game-bottom-area" aria-label={t("gameStatus")}>
      <div className="game-bottom-area__top">
        <div className="game-bottom-area__message">{t("chooseCoordinateGroup")}</div>
        <div className="game-bottom-area__message">{t("minimumPurchase")}</div>
      </div>
      <div className="game-bottom-area__fields">
        <BottomField title={t("balance")} value={formatMoney(player?.balance)} />
        <BottomField title={t("purchaseAmount")} value={formatMoney(totalPurchase)} />
        <BottomField title={t("cashback")} value={formatMoney(cashback)} />
        <BottomField title="" value={formatMoney(ticketWin)} />
        <BottomField title={t("lotteryCombination")} value={combinationCount} compact />
        <BottomField title={t("lotteryBet")} value={formatMoney(stake)} />
      </div>
    </section>
  );
}

function BottomField({ title, value, compact = false }) {
  return (
    <div className={`game-bottom-field${compact ? " --compact" : ""}`}>
      <div className="game-bottom-field__title">{title}</div>
      <div className="game-bottom-field__value">{value}</div>
    </div>
  );
}
