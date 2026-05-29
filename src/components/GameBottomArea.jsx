import "./GameBottomArea.css";

const formatMoney = (value) => Number(value ?? 0).toFixed(2);

export default function GameBottomArea({
  player,
  stake,
  totalPurchase,
  selectedCombination,
  spinResult,
}) {
  const combinationCount = selectedCombination?.groups?.length ?? 1;
  const cashback = Number(player?.balance ?? 0) * 0.1;
  const ticketWin = Number(spinResult?.WinSum ?? 0);

  return (
    <section className="game-bottom-area" aria-label="Game status">
      <div className="game-bottom-area__top">
        <div className="game-bottom-area__message">
          ВЫБЕРИТЕ ГРУППУ КООРДИНАТ
        </div>
        <div className="game-bottom-area__message">
          МИНИМАЛЬНАЯ СУММА ПОКУПКИ 0.10
        </div>
      </div>

      <div className="game-bottom-area__fields">
        <BottomField title="БАЛАНС." value={formatMoney(player?.balance)} />
        <BottomField title="СУММА ПОКУПКИ" value={formatMoney(totalPurchase)} />
        <BottomField title="КЭШБЕК." value={formatMoney(cashback)} />
        <BottomField title="" value={formatMoney(ticketWin)} />
        <BottomField
          title="ЛОТЕРЕЙНАЯ КОМБИНАЦИЯ"
          value={combinationCount}
          compact
        />
        <BottomField title="ЛОТЕРЕЙНАЯ СТАВКА" value={formatMoney(stake)} />
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
