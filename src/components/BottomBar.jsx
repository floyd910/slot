import "./BottomBar.css";
import { useLanguage } from "../i18n.jsx";
import { getTicketWinAmount } from "../utils/gameResult.js";
import BasicControlButton from "./controls/BasicControlButton.jsx";
import TakeMoneyButton from "./controls/TakeMoneyButton.jsx";
import {
  buildBottomBarControls,
  getBottomBarLabel,
} from "../viewModels/bottomBarControls.js";

export default function BottomBar(props) {
  const { language, t, toggleLanguage } = useLanguage();
  const controls = buildBottomBarControls({
    ...props,
    toggleLanguage,
  });
  const balance = formatMoney(props.player?.balance);
  const totalPurchase = formatMoney(props.totalPurchase);
  const currentWin = formatMoney(
    props.revealComplete === false
      ? 0
      : getTicketWinAmount(props.spinResult, props.doublingState),
  );
  const chooserDisabled = props.disabled || props.paytableControlsLocked;

  return (
    <footer className="bottom-bar">
      <BottomBarMetric title={t("balance")} value={balance} />
      <BottomBarMetric title={t("purchaseAmount")} value={totalPurchase} />
      <BottomBarMetric title={t("win")} value={currentWin} accent />
      <BottomBarStepper
        disabled={chooserDisabled}
        label={t("lotteryBet")}
        onDecrease={props.onDecreaseStake}
        onIncrease={props.onIncreaseStake}
        value={formatMoney(props.stake)}
        variant="bet"
      />
      <BottomBarStepper
        disabled={chooserDisabled}
        label={t("lotteryCombination")}
        onDecrease={props.onDecreaseCombination}
        onIncrease={props.onIncreaseCombination}
        value={formatCombinationValue(props.selectedCombination)}
        variant="combination"
      />

      {controls.map((control) =>
        renderBottomBarControl(control, { language, t }),
      )}
    </footer>
  );
}

function renderBottomBarControl(control, { language, t }) {
  const label = getBottomBarLabel(control.type, { language, t });

  if (control.kind === "takeMoney") {
    return (
      <TakeMoneyButton
        key={control.type}
        disabled={control.disabled}
        label={label}
        onClick={control.onClick}
      />
    );
  }

  return (
    <BasicControlButton
      key={control.type}
      active={control.active}
      disabled={control.disabled}
      extraClass={control.extraClass}
      label={label}
      onClick={control.onClick}
      suppressPressFeedback={control.suppressPressFeedback}
      type={control.type}
    />
  );
}

function BottomBarStepper({
  disabled,
  label,
  onDecrease,
  onIncrease,
  value,
  variant,
}) {
  return (
    <div
      className={`bottom-bar-stepper --${variant}${disabled ? " --disabled" : ""}`}
    >
      <div className="bottom-bar-stepper__title">{label}</div>
      <div
        className="bottom-bar-stepper__control"
        role="group"
        aria-label={label}
      >
        <button
          type="button"
          className="bottom-bar-stepper__button --minus"
          disabled={disabled}
          onClick={onDecrease}
          aria-label={`${label} minus`}
        >
          -
        </button>
        <output className="bottom-bar-stepper__value" aria-live="polite">
          {value}
        </output>
        <button
          type="button"
          className="bottom-bar-stepper__button --plus"
          disabled={disabled}
          onClick={onIncrease}
          aria-label={`${label} plus`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function BottomBarMetric({ title, value, accent = false }) {
  return (
    <div
      className={`bottom-bar-metric${accent ? " --accent" : ""}`}
      aria-label={`${title} ${value}`}
    >
      <div className="bottom-bar-metric__title">{title}</div>
      <div className="bottom-bar-metric__value">{value}</div>
    </div>
  );
}

function formatCombinationValue(selectedCombination) {
  return String(
    selectedCombination?.title ?? selectedCombination?.groups?.length ?? 0,
  );
}

function formatMoney(value) {
  return Number(value ?? 0).toFixed(2);
}
