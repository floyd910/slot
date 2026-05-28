import "./BottomBar.css";

export default function BottomBar({
  spinResult,
  disabled,
  spinDisabled = false,
  doublingState,
  revealComplete = false,
  visualMode = false,
  onVisualToggle,
  onIncreaseCombination,
  onIncreaseStake,
  onSpin,
  onDouble,
  onInfo,
}) {
  const pendingWin = Number(spinResult?.WinSum ?? 0) > 0;
  const showDouble = pendingWin && revealComplete;
  const currentAmount = Number(
    doublingState?.currentAmount || spinResult?.WinSum || 0,
  );
  const canDouble =
    !disabled && showDouble && !doublingState?.loading && currentAmount > 0;

  return (
    <footer className="bottom-bar">
      <div className="control-panel">
        <TakeMoney title="ЗАБРАТЬ ДЕНГИ" disabled={disabled} />
        <BasicButton
          type="information"
          extraClass="information-button"
          disabled={disabled}
          onClick={onInfo}
        />
        <BasicButton
          type="language"
          extraClass="language-button"
          disabled={disabled}
        />
        <BasicButton
          type="menu"
          extraClass="language-button"
          disabled={disabled}
        />
        <BasicButton
          type="visualization"
          extraClass="language-button"
          disabled={disabled}
          active={visualMode}
          onClick={onVisualToggle}
        />
        {showDouble ? (
          <BasicButton
            type="double"
            extraClass="language-button"
            disabled={!canDouble}
            onClick={onDouble}
          />
        ) : (
          <BasicButton
            type="betAmount"
            extraClass="language-button"
            disabled={disabled}
            onClick={onIncreaseStake}
          />
        )}
        <BasicButton
          type="lotteryCombination"
          extraClass="language-button"
          disabled={disabled}
          onClick={onIncreaseCombination}
        />
        <BasicButton
          type="autoExpress"
          extraClass="auto-express-button"
          disabled={disabled}
        />
        <BasicButton
          type="spinDraw"
          extraClass="spin-draw-button"
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
      onPointerDown={(event) => {
        if (!disabled) event.currentTarget.classList.add("--pressed");
      }}
      onPointerUp={(event) => {
        event.currentTarget.classList.remove("--pressed");
      }}
      onPointerLeave={(event) => {
        event.currentTarget.classList.remove("--pressed");
      }}
      onPointerCancel={(event) => {
        event.currentTarget.classList.remove("--pressed");
      }}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        event.currentTarget.classList.add("--pressed");
        onPlus();
      }}
      onKeyUp={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.currentTarget.classList.remove("--pressed");
      }}
      onBlur={(event) => {
        event.currentTarget.classList.remove("--pressed");
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


function BasicButton({
  type,
  extraClass = "",
  disabled = false,
  active = false,
  onClick,
}) {
  const labels = {
    information: "ИНФО",
    language: "Точикий",
    menu: "МЕНЮ",
    visualization: (
      <>
        РЕЖИМ
        <br />
        ВИЗУАЛИЗАЦИИ
      </>
    ),
    betAmount: "СУММА СТАВКИ",
    double: "\u0423\u0414\u0412\u041e\u0418\u0422\u042c",
    lotteryCombination: "ЛОТЕРЕЙННАЯ КОМБИНАЦИЯ",
    autoExpress: "АВТО ЭКСПРЕСС",
    spinDraw: (
      <>
        УЧАВСТВОВАТЬ
        <br />
        В ТИРАЖЕ
      </>
    ),
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
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        event.currentTarget.classList.add("--pressed");
        if (onClick) onClick();
      }}
      onKeyUp={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.currentTarget.classList.remove("--pressed");
      }}
      onBlur={(event) => {
        event.currentTarget.classList.remove("--pressed");
      }}
    >
      <span className={`basic-button__label --${type}`}>
        {labels[type] ?? type}
      </span>
    </div>
  );
}
