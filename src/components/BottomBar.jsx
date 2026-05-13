import { Info, Minus, Plus, Repeat2 } from "lucide-react";

export default function BottomBar({
  player,
  stake,
  totalPurchase,
  selectedCombination,
  spinResult,
  disabled,
  onDecreaseCombination,
  onIncreaseCombination,
  onDecreaseStake,
  onIncreaseStake,
  onSpin,
  onBuyPrizeGame,
}) {
  return (
    <footer className="bottom-bar">
      <button className="round-info" type="button" title="Информация">
        <Info size={34} />
      </button>
      <Control label="Комбинация" value={selectedCombination?.title ?? "-"} active onMinus={onDecreaseCombination} onPlus={onIncreaseCombination} disabled={disabled} />
      <Control label="Лотерейная ставка" value={stake.toFixed(2)} onMinus={onDecreaseStake} onPlus={onIncreaseStake} disabled={disabled} />
      <Panel label="Выигрыш" value={spinResult?.WinSum ? spinResult.WinSum.toFixed(2) : ""} />
      <Panel label="Сумма покупки" value={Number(totalPurchase ?? 0).toFixed(2)} />
      <Panel label="Баланс" value={Number(player?.balance ?? 0).toFixed(2)} />
      <button className="auto-button" type="button" disabled={disabled}>
        АВТО
        <span>ИГРА</span>
      </button>
      <button className="prize-button" type="button" disabled={disabled || !spinResult?.WinSum} onClick={onBuyPrizeGame}>
        Купить
        <span>призовую игру</span>
      </button>
      <button className="double-button" type="button" disabled={disabled} onClick={onSpin} title="Участвовать в тираже">
        <Repeat2 size={34} />
      </button>
    </footer>
  );
}

function Control({ label, value, active = false, onMinus, onPlus, disabled }) {
  return (
    <div className={`control-cell${active ? " active-control" : ""}`}>
      <button type="button" disabled={disabled} onClick={onMinus} aria-label={`${label} минус`}>
        <Minus size={28} />
      </button>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
      <button type="button" disabled={disabled} onClick={onPlus} aria-label={`${label} плюс`}>
        <Plus size={28} />
      </button>
    </div>
  );
}

function Panel({ label, value }) {
  return (
    <div className="info-cell">
      <small>{label}</small>
      <strong>{value || ""}</strong>
    </div>
  );
}
