import "./BottomBar.css";

export default function BottomBar({
  player,
  stake,
  totalPurchase,
  selectedCombination,
  spinResult,
  disabled,
  spinDisabled = false,
  doublingState,
  visualMode = false,
  onVisualToggle,
  onDecreaseCombination,
  onIncreaseCombination,
  onDecreaseStake,
  onIncreaseStake,
  onSpin,
  onDouble,
  onTakeMoney,
  onInfo,
}) {
  const pendingWin = Number(spinResult?.WinSum ?? 0) > 0;
  const isX2Pending = pendingWin;
  const currentAmount = Number(
    doublingState?.currentAmount || spinResult?.WinSum || 0,
  );
  const canDouble =
    !disabled && isX2Pending && !doublingState?.loading && currentAmount > 0;

  return (
    <footer className="bottom-bar">
      <div className="control-panel">
        <TakeMoney title="ЗАБРАТЬ ДЕНГИ" disabled={disabled} />
        <CombinationControl
          title="Комбинация"
          value={selectedCombination?.title ?? ""}
          disabled={disabled}
          onMinus={onDecreaseCombination}
          onPlus={onIncreaseCombination}
        />
        <NominalControl
          title="Лотерейная ставка"
          value={Number(stake ?? 0).toFixed(2)}
          disabled={disabled}
          onMinus={onDecreaseStake}
          onPlus={onIncreaseStake}
        />
        <DisplayField
          innerTitle="Выигрыш"
          value={spinResult?.WinSum ? Number(spinResult.WinSum).toFixed(2) : ""}
        />
        <DisplayField
          title="Сумма покупки"
          value={Number(totalPurchase ?? 0).toFixed(2)}
        />
        <DisplayField
          title="Баланс"
          value={Number(player?.balance ?? 0).toFixed(2)}
        />
        {isX2Pending ? (
          <ApplyDoubling disabled={!canDouble} onClick={onDouble} />
        ) : (
          <div
            className={`auto-game${disabled ? " --disabled" : ""}`}
            role="button"
            tabIndex={disabled ? -1 : 0}
          >
            <span className="auto-game__text">Авто игра</span>
          </div>
        )}
        <BasicButton
          type="information"
          extraClass="information-button"
          disabled={false}
          onClick={onInfo}
        />
        <BasicButton
          type="visual"
          extraClass="visual-button"
          disabled={disabled}
          active={visualMode}
          onClick={onVisualToggle}
        />
        <BasicButton
          type="game"
          extraClass="play-game"
          disabled={disabled || spinDisabled}
          onClick={onSpin}
        />
      </div>
    </footer>
  );
}

function CombinationControl({ title, value, disabled, onPlus }) {
  return (
    <div
      className={`combination-control${disabled ? " --disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onPlus();
      }}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onPlus();
      }}
    >
      <span className="combination-control__title">{title}</span>
      <div className="combination-control__wrapper">
        <span className="combination-control__value">{value}</span>
      </div>
    </div>
  );
}

function TakeMoney({ disabled, title }) {
  return (
    <div
      className={`action_button take-money${disabled ? " --disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onPlus();
      }}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onPlus();
      }}
    >
      <span className="action_btn_title take-money__title">{title}</span>
    </div>
  );
}

function NominalControl({ title, value, disabled, onPlus }) {
  return (
    <div
      className={`nominal-control${disabled ? " --disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onPlus();
      }}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onPlus();
      }}
    >
      <span className="nominal-control__title">{title}</span>
      <div className="nominal-control__wrapper">
        <span className="nominal-control__value">{value}</span>
      </div>
    </div>
  );
}

function DisplayField({ title, innerTitle, value, center = false }) {
  return (
    <div className="display-field">
      {title && <div className="display-field__title">{title}</div>}
      <div className="display-field__container">
        {innerTitle && (
          <div className="display-field__innerTitle">{innerTitle}</div>
        )}
        <div className="display-field__wrapper">
          {value && (
            <div className={`display-field__value${center ? " --center" : ""}`}>
              {value}
            </div>
          )}
        </div>
      </div>
    </div>
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
      <span className="apply-doubling__text">Удвоить</span>
    </div>
  );
}

function BasicButton({
  type,
  extraClass = "",
  disabled = false,
  active = false,
  onClick,
}) {
  const labels = {
    information: "Правила",
    visual: "Вид",
    game: "Играть",
    closer: "Забрать",
  };

  return (
    <div
      className={`basic-button ${extraClass}${active ? " --active" : ""}${disabled ? " --disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled && onClick) onClick();
      }}
      onKeyDown={(event) => {
        if (
          disabled ||
          !onClick ||
          (event.key !== "Enter" && event.key !== " ")
        )
          return;
        event.preventDefault();
        onClick();
      }}
    >
      <span className={`basic-button__label --${type}`}>
        {labels[type] ?? type}
      </span>
    </div>
  );
}
