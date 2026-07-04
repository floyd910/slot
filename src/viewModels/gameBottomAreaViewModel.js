import { getTicketWinAmount } from "../utils/gameResult.js";

const formatMoney = (value) => Number(value ?? 0).toFixed(2);

export function buildGameBottomAreaViewModel({
  player,
  revealComplete,
  selectedCombination,
  spinResult,
  stake,
  t,
}) {
  const combinationCount = selectedCombination?.groups?.length ?? 1;
  const cashback = Number(player?.balance ?? 0) * 0.1;
  const ticketWin = revealComplete ? getTicketWinAmount(spinResult) : 0;

  return {
    messages: [t("chooseCoordinateGroup"), t("minimumPurchase")],
    fields: [
      { title: t("cashback"), value: formatMoney(cashback) },
      { title: "", value: formatMoney(ticketWin) },
      {
        compact: true,
        title: t("lotteryCombination"),
        value: combinationCount,
      },
      { title: t("lotteryBet"), value: formatMoney(stake) },
    ],
  };
}