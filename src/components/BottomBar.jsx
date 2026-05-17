import "./BottomBar.css";

export default function BottomBar({
  player,
  stake,
  totalPurchase,
  selectedCombination,
  spinResult,
  disabled,
  doublingState,
  visualMode = false,
  onDecreaseCombination,
  onIncreaseCombination,
  onDecreaseStake,
  onIncreaseStake,
  onSpin,
  onDouble,
  onSplitDouble,
  onResetSplit,
  onTakeMoney,
  onInfo,
}) {
  const pendingWin = Number(spinResult?.WinSum ?? 0) > 0;
  const isX2Pending = pendingWin;
  const isDoublingMode = isX2Pending && Boolean(doublingState?.entered || doublingState?.loading || doublingState?.step > 0);
  const currentAmount = Number(doublingState?.currentAmount || spinResult?.WinSum || 0);
  const canDouble = !disabled && isX2Pending && !doublingState?.loading && currentAmount > 0;
  const canTakeMoney = !disabled && pendingWin;
  const splitDisabled = !canDouble || (doublingState?.split ?? 0) >= 3 || currentAmount <= 0;
  const resetSplitDisabled = !canDouble || !(doublingState?.split ?? 0);

  return (
    <footer className="bottom-bar">
      <div className={`control-panel${isDoublingMode ? " --doubling" : ""}`}>
        {isDoublingMode ? (
          <>
            <DisplayField title="Сумма покупки" value={Number(totalPurchase ?? 0).toFixed(2)} />
            <DisplayField title="Баланс" value={Number(player?.balance ?? 0).toFixed(2)} />
            <DisplayField innerTitle="Выигрыш" value={spinResult?.WinSum ? Number(spinResult.WinSum).toFixed(2) : "0.00"} />
            <SplitButton label="1/2" disabled={splitDisabled} onClick={onSplitDouble} />
            <SplitButton reset disabled={resetSplitDisabled} onClick={onResetSplit} />
            <DisplayField title="На X2" value={currentAmount.toFixed(2)} center />
            <DisplayField title="В баланс" value={Number(doublingState?.deferredBalance ?? 0).toFixed(2)} />
            <ApplyDoubling disabled={!canDouble} onClick={onDouble} />
          </>
        ) : (
          <>
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
            {isX2Pending ? (
              <ApplyDoubling disabled={!canDouble} onClick={onDouble} />
            ) : (
              <div className={`auto-game${disabled ? " --disabled" : ""}`} role="button" tabIndex={disabled ? -1 : 0}>
                <span className="auto-game__text">Авто игра</span>
              </div>
            )}
          </>
        )}
        <BasicButton type="information" extraClass="information-button" disabled={false} onClick={onInfo} />
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

function DisplayField({ title, innerTitle, value, center = false }) {
  return (
    <div className="display-field">
      {title && <div className="display-field__title">{title}</div>}
      <div className="display-field__container">
        {innerTitle && <div className="display-field__innerTitle">{innerTitle}</div>}
        <div className="display-field__wrapper">{value && <div className={`display-field__value${center ? " --center" : ""}`}>{value}</div>}</div>
      </div>
    </div>
  );
}

function SplitButton({ label, reset = false, disabled, onClick }) {
  return (
    <div
      className={`split-button${disabled ? " --disabled" : ""}${reset ? " --reset" : ""}`}
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
      {reset ? <IconBrush /> : <span className="split-button__content">{label}</span>}
    </div>
  );
}

function IconBrush() {
  return (
    <svg className="split-button__brush" width="31" height="26" viewBox="0 0 31 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.5 11.1719L16.5781 16.2812C16.5781 16.2812 15.7812 21.1094 12.9688 23.3594C10.1562 25.5625 0.5 24.9531 0.5 24.9531C0.5 24.9531 0.640625 23.875 1.01562 22.3281L5.42188 17.0781C5.60938 16.8438 5.375 16.5156 5.09375 16.6562L2.28125 17.6875C2.98438 15.7188 3.82812 13.9375 4.85938 13.0938C7.67188 10.8438 12.5 11.1719 12.5 11.1719ZM30.3125 2.5C30.5938 2.78125 30.5 3.25 30.1719 3.53125L19.2969 11.875L20.8906 13.8906C21.125 14.1719 20.9844 14.6406 20.6094 14.6875L17.8438 15.2969L13.7656 10.1875L14.9844 7.60938C15.125 7.28125 15.5938 7.1875 15.8281 7.51562L17.4219 9.53125L28.3438 1.1875C28.6719 0.90625 29.1406 1 29.375 1.32812L30.3125 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ApplyDoubling({ disabled, onClick }) {
  return (
    <div
      className={`apply-doubling${disabled ? " --disabled" : " --blink"}`}
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
      <span className="apply-doubling__text">X2</span>
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
