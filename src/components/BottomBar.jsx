import "./BottomBar.css";

export default function BottomBar({
  player,
  stake,
  totalPurchase,
  selectedCombination,
  spinResult,
  disabled,
  doublingState,
  onDecreaseCombination,
  onIncreaseCombination,
  onDecreaseStake,
  onIncreaseStake,
  onSpin,
  onDouble,
  onTakeMoney,
}) {
  const pendingWin = Number(spinResult?.WinSum ?? 0) > 0;
  const canDouble = !disabled && pendingWin && doublingState?.active && !doublingState?.loading;
  const canTakeMoney = !disabled && pendingWin;

  return (
    <footer className="bottom-bar">
      <div className="control-panel">
        <CombinationControl
          title="Комбинация"
          value={selectedCombination?.title ?? ""}
          disabled={disabled}
          onMinus={onDecreaseCombination}
          onPlus={onIncreaseCombination}
        />
        <NominalControl title="Лотерейная ставка" value={Number(stake ?? 0).toFixed(2)} disabled={disabled} onMinus={onDecreaseStake} onPlus={onIncreaseStake} />
        <DisplayField innerTitle="Выигрыш" value={spinResult?.WinSum ? Number(spinResult.WinSum).toFixed(2) : ""} />
        <DisplayField title="Сумма покупки" value={Number(totalPurchase ?? 0).toFixed(2)} />
        <DisplayField title="Баланс" value={Number(player?.balance ?? 0).toFixed(2)} />
        <div
          className={`auto-game${canDouble ? " --double" : ""}${disabled || (pendingWin && !canDouble) ? " --disabled" : ""}`}
          role="button"
          tabIndex={canDouble ? 0 : -1}
          onClick={() => {
            if (canDouble) onDouble();
          }}
          onKeyDown={(event) => {
            if (!canDouble || (event.key !== "Enter" && event.key !== " ")) return;
            event.preventDefault();
            onDouble();
          }}
        >
          <span className="auto-game__text">{canDouble ? "X2" : "Авто игра"}</span>
        </div>
        <BasicButton type="information" extraClass="information-button" disabled={false} />
        <BasicButton type={canTakeMoney ? "closer" : "game"} extraClass={canTakeMoney ? "refuse-doubling" : "play-game"} disabled={disabled} onClick={canTakeMoney ? onTakeMoney : onSpin} />
      </div>
    </footer>
  );
}

function CombinationControl({ title, value, disabled, onMinus, onPlus }) {
  return (
    <div className="combination-control">
      <span className="combination-control__title">{title}</span>
      <div className="combination-control__wrapper">
        <CircleButton disabled={disabled} onClick={onMinus} />
        <span className="combination-control__value">{value}</span>
        <CircleButton plus disabled={disabled} onClick={onPlus} />
      </div>
    </div>
  );
}

function NominalControl({ title, value, disabled, onMinus, onPlus }) {
  return (
    <div className="nominal-control">
      <span className="nominal-control__title">{title}</span>
      <div className="nominal-control__wrapper">
        <CircleButton disabled={disabled} onClick={onMinus} />
        <span className="nominal-control__value">{value}</span>
        <CircleButton plus disabled={disabled} onClick={onPlus} />
      </div>
    </div>
  );
}

function CircleButton({ plus = false, disabled, onClick }) {
  return (
    <div
      className={`circle-button${disabled ? " --disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onClick();
      }}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onClick();
      }}
    >
      <div className="circle-button__vertical" />
      {plus && <div className="circle-button__horizontal" />}
    </div>
  );
}

function DisplayField({ title, innerTitle, value }) {
  return (
    <div className="display-field">
      {title && <div className="display-field__title">{title}</div>}
      <div className="display-field__container">
        {innerTitle && <div className="display-field__innerTitle">{innerTitle}</div>}
        <div className="display-field__wrapper">{value && <div className="display-field__value">{value}</div>}</div>
      </div>
    </div>
  );
}

function BasicButton({ type, extraClass = "", disabled = false, onClick }) {
  return (
    <div
      className={`basic-button ${extraClass}${disabled ? " --disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled && onClick) onClick();
      }}
      onKeyDown={(event) => {
        if (disabled || !onClick || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onClick();
      }}
    >
      <div className="basic-button__background" />
      <div className={`basic-button__text --${type}`} />
      <div className={`basic-button__icon --${type}`} />
    </div>
  );
}
