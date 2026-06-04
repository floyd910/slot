import "./BottomBar.css";
import { useLanguage } from "../i18n.jsx";

export default function BottomBar({
  spinResult,
  disabled,
  spinDisabled = false,
  spinFeedbackActive = false,
  doublingState,
  revealComplete = false,
  visualMode = false,
  autoPlayOn = false,
  onVisualToggle,
  onAutoPlay,
  onIncreaseCombination,
  onIncreaseStake,
  onSpin,
  onDouble,
  onInfo,
}) {
  const { toggleLanguage } = useLanguage();
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
        <TakeMoney disabled={disabled} />
        <BasicButton
          type="information"
          extraClass="information-button"
          disabled={disabled}
          onClick={onInfo}
        />
        <BasicButton
          type="language"
          extraClass="language-button"
          onClick={toggleLanguage}
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
          active={autoPlayOn}
          disabled={disabled && !autoPlayOn}
          onClick={onAutoPlay}
        />
        <BasicButton
          type="spinDraw"
          extraClass="spin-draw-button"
          disabled={disabled || spinDisabled}
          active={spinFeedbackActive}
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

function TakeMoney({ disabled }) {
  const { t } = useLanguage();
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
      <span className="action_btn_title take-money__title">{t("takeMoney")}</span>
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
  const { language, t } = useLanguage();
  const labels = {
    information: t("info"),
    language: language === "ru" ? "\u0422\u041e\u04b6\u0418\u041a\u04e2" : "\u0420\u0423\u0421\u0421\u041a\u0418\u0419",
    menu: t("menu"),
    visualization: renderMultiline(t("visualization")),
    betAmount: t("betAmount"),
    double: t("double"),
    lotteryCombination: t("lotteryCombination"),
    autoExpress: t("autoExpress"),
    spinDraw: renderMultiline(t("participate")),
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

function renderMultiline(text) {
  const [firstLine, secondLine] = text.split("\n");
  return (
    <>
      {firstLine}
      {secondLine && <br />}
      {secondLine}
    </>
  );
}
