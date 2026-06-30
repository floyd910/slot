import "./BottomBar.css";
import { useLanguage } from "../i18n.jsx";

export default function BottomBar({
  spinResult,
  disabled,
  spinDisabled = false,
  spinFeedbackActive = false,
  doubleOfferAvailable = false,
  doublingState,
  visualMode = false,
  viewSwitchDisabled = false,
  paytableControlsLocked = false,
  isVisualDoubling = false,
  autoPlayOn = false,
  infoActive = false,
  onCollect,
  onPickLeft,
  onPickRight,
  onVisualToggle,
  onAutoPlay,
  onIncreaseCombination,
  onIncreaseStake,
  onSpin,
  onDouble,
  onInfo,
  onMenu,
}) {
  const { toggleLanguage } = useLanguage();
  const showDouble = doubleOfferAvailable;
  const canDouble = !disabled && showDouble && !doublingState?.loading;

  return (
    <footer className="bottom-bar">
      <div className="control-panel">
        <TakeMoney disabled={disabled} onClick={onCollect} />
        <BasicButton
          type="information"
          extraClass="information-button"
          disabled={disabled}
          active={infoActive}
          onClick={onInfo}
        />
        <BasicButton
          type="language"
          extraClass="language-button"
          suppressPressFeedback
          onClick={toggleLanguage}
        />
        <BasicButton
          type="menu"
          extraClass="language-button"
          disabled={disabled || !onMenu}
          onClick={onMenu}
        />
        <BasicButton
          type="visualization"
          extraClass="language-button"
          disabled={disabled || viewSwitchDisabled}
          active={visualMode}
          onClick={onVisualToggle}
        />
        {isVisualDoubling ? (
          <BasicButton type="left" extraClass="language-button" disabled={disabled} onClick={onPickLeft} />
        ) : showDouble ? (
          <BasicButton type="double" extraClass="language-button" disabled={!canDouble} onClick={onDouble} />
        ) : (
          <BasicButton type="betAmount" extraClass="language-button" disabled={disabled || paytableControlsLocked} onClick={onIncreaseStake} />
        )}
        {isVisualDoubling ? (
          <BasicButton type="right" extraClass="language-button" disabled={disabled} onClick={onPickRight} />
        ) : (
          <BasicButton type="lotteryCombination" extraClass="language-button" disabled={disabled || paytableControlsLocked} onClick={onIncreaseCombination} />
        )}
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

function TakeMoney({ disabled, onClick }) {
  const { t } = useLanguage();
  return (
    <div
      className={`action_button take-money${disabled ? " --disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) if (onClick) onClick();
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
      <span className="action_btn_title take-money__title">{t("takeMoney")}</span>
    </div>
  );
}


function BasicButton({
  type,
  extraClass = "",
  disabled = false,
  active = false,
  suppressPressFeedback = false,
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
    left: t("left"),
    right: t("right"),
    lotteryCombination: t("lotteryCombination"),
    autoExpress: t("autoExpress"),
    spinDraw: renderMultiline(t("participate")),
  };

  return (
    <div
      className={`basic-button ${extraClass}${active ? " --active" : ""}${disabled ? " --disabled" : ""}${suppressPressFeedback ? " --no-press-feedback" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled && onClick) onClick();
      }}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        if (!suppressPressFeedback) event.currentTarget.classList.add("--pressed");
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
