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
  const ticketWinAmount = getTicketWinAmount(
    props.spinResult,
    props.doublingState,
  );
  const currentWin = formatMoney(
    props.revealComplete === false ? 0 : ticketWinAmount,
  );
  const normalSpinWinAmount = getTicketWinAmount(props.spinResult, null);
  const isFreeSpinResult =
    props.spinResult?.isFreeSpin === true ||
    Number(props.spinResult?.FreeSpin ?? 0) > 0;
  const showDoubleOffer =
    props.revealComplete !== false &&
    (props.doubleOfferAvailable ||
      (!props.autoPlayOn &&
        !isFreeSpinResult &&
        props.spinResult?.creditedToBalance !== true &&
        normalSpinWinAmount > 0));
  const chooserDisabled = props.disabled || props.paytableControlsLocked;
  const showFreeSpinCounter =
    props.freeSpinRoundStarted && Number(props.freeSpinsLeft ?? 0) > 0;

  return (
    <footer className="bottom-bar">
      <div className="footer-block footer-block-desktop">
        <BottomBarMetric title={t("balance")} value={balance} />
        <BottomBarMetric title={t("purchaseAmount")} value={totalPurchase} />
        <BottomBarMetric title={t("win")} value={currentWin} accent />
        {showFreeSpinCounter ? (
          <FooterFreeSpins
            count={props.freeSpinsLeft}
            label={t("freeSpinsFooter")}
            sizingLabel={t("lotteryBet")}
            sizingValue={formatMoney(props.stake)}
          />
        ) : showDoubleOffer ? (
          <TabletDoubleButton
            disabled={props.disabled || props.doublingState?.loading}
            label={language === "tg" ? "\u0414\u0423 \u0411\u0410\u0420\u041e\u0411\u0410\u0420" : "\u0423\u0414\u0412\u041e\u0418\u0422\u042c"}
            onClick={props.onDouble}
            sizingLabel={t("lotteryBet")}
            sizingValue={formatMoney(props.stake)}
          />
        ) : (
          <BottomBarStepper
            disabled={chooserDisabled}
            label={t("lotteryBet")}
            onDecrease={props.onDecreaseStake}
            onIncrease={props.onIncreaseStake}
            value={formatMoney(props.stake)}
            variant="bet"
          />
        )}
        <BottomBarStepper
          disabled={chooserDisabled}
          label={t("lotteryCombination")}
          onDecrease={props.onDecreaseCombination}
          onIncrease={props.onIncreaseCombination}
          value={formatCombinationValue(props.selectedCombination)}
          variant="combination"
        />
        <InfoButton
          active={props.infoActive}
          disabled={props.disabled}
          label={t("info")}
          onClick={props.onInfo}
        />

        {controls.map((control) =>
          renderBottomBarControl(control, { language, t }),
        )}
      </div>

      <div className="footer-block-tablet footer-block">
        <div className="footer-flex">
          <InfoButton
            active={props.infoActive}
            disabled={props.disabled}
            label={t("info")}
            onClick={props.onInfo}
          />
          <BottomBarMetric title={t("win")} value={currentWin} accent />
          <BottomBarMetric title={t("balance")} value={balance} />
          <BottomBarMetric title={t("purchaseAmount")} value={totalPurchase} />
        </div>

        <div className="footer-flex">
          {showFreeSpinCounter ? (
          <FooterFreeSpins
            count={props.freeSpinsLeft}
            label={t("freeSpinsFooter")}
            sizingLabel={t("lotteryBet")}
            sizingValue={formatMoney(props.stake)}
          />
        ) : showDoubleOffer ? (
            <TabletDoubleButton
              disabled={props.disabled || props.doublingState?.loading}
              label={language === "tg" ? "\u0414\u0423 \u0411\u0410\u0420\u041e\u0411\u0410\u0420" : "\u0423\u0414\u0412\u041e\u0418\u0422\u042c"}
              onClick={props.onDouble}
              sizingLabel={t("lotteryBet")}
              sizingValue={formatMoney(props.stake)}
            />
          ) : (
            <BottomBarStepper
              disabled={chooserDisabled}
              label={t("lotteryBet")}
              onDecrease={props.onDecreaseStake}
              onIncrease={props.onIncreaseStake}
              value={formatMoney(props.stake)}
              variant="bet"
            />
          )}
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
        </div>
      </div>

      <div className="footer-block-mobile footer-block">
        <InfoButton
          active={props.infoActive}
          disabled={props.disabled}
          label={t("info")}
          onClick={props.onInfo}
        />
        <BottomBarMetric title={t("win")} value={currentWin} accent />
        <div className="footer-flex">
          <BottomBarMetric title={t("balance")} value={balance} />
          <BottomBarMetric title={t("purchaseAmount")} value={totalPurchase} />
        </div>

        <div className="footer-flex">
          {showFreeSpinCounter ? (
          <FooterFreeSpins
            count={props.freeSpinsLeft}
            label={t("freeSpinsFooter")}
            sizingLabel={t("lotteryBet")}
            sizingValue={formatMoney(props.stake)}
          />
        ) : showDoubleOffer ? (
            <TabletDoubleButton
              disabled={props.disabled || props.doublingState?.loading}
              label={language === "tg" ? "\u0414\u0423 \u0411\u0410\u0420\u041e\u0411\u0410\u0420" : "\u0423\u0414\u0412\u041e\u0418\u0422\u042c"}
              onClick={props.onDouble}
              sizingLabel={t("lotteryBet")}
              sizingValue={formatMoney(props.stake)}
            />
          ) : (
            <BottomBarStepper
              disabled={chooserDisabled}
              label={t("lotteryBet")}
              onDecrease={props.onDecreaseStake}
              onIncrease={props.onIncreaseStake}
              value={formatMoney(props.stake)}
              variant="bet"
            />
          )}
          <BottomBarStepper
            disabled={chooserDisabled}
            label={t("lotteryCombination")}
            onDecrease={props.onDecreaseCombination}
            onIncrease={props.onIncreaseCombination}
            value={formatCombinationValue(props.selectedCombination)}
            variant="combination"
          />
        </div>
        <div className="footer-flex">
          {controls.map((control) =>
            renderBottomBarControl(control, { language, t }),
          )}
        </div>
      </div>
    </footer>
  );
}

function InfoButton({ active, disabled, label, onClick }) {
  return (
    <button
      aria-pressed={active}
      className="information-button"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span> {label}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
      >
        <path
          d="M15 2.5C21.9035 2.5 27.5 8.09644 27.5 15C27.5 21.9035 21.9035 27.5 15 27.5C8.09644 27.5 2.5 21.9035 2.5 15C2.5 8.09644 8.09644 2.5 15 2.5ZM11.875 13.75V16.25H13.75V18.75H11.875V21.25H18.125V18.75H16.25V15C16.25 14.3096 15.6904 13.75 15 13.75H11.875ZM14.6875 8.75C13.8245 8.75 13.125 9.44955 13.125 10.3125C13.125 11.1755 13.8245 11.875 14.6875 11.875C15.5505 11.875 16.25 11.1755 16.25 10.3125C16.25 9.44955 15.5505 8.75 14.6875 8.75Z"
          fill="white"
        />
      </svg>
    </button>
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

function FooterFreeSpins({ count, label, sizingLabel, sizingValue }) {
  return (
    <div className="tablet-double-offer footer-free-spins">
      <div className="tablet-double-offer__sizer" aria-hidden="true">
        <BottomBarStepper
          disabled
          label={sizingLabel}
          onDecrease={() => {}}
          onIncrease={() => {}}
          value={sizingValue}
          variant="bet"
        />
      </div>
      <div
        className="tablet-double-offer__button footer-free-spins__content"
        role="status"
        aria-live="polite"
      >
        {label}: {count}
      </div>
    </div>
  );
}
function TabletDoubleButton({ disabled, label, onClick, sizingLabel, sizingValue }) {
  return (
    <div className="tablet-double-offer">
      <div className="tablet-double-offer__sizer" aria-hidden="true">
        <BottomBarStepper
          disabled
          label={sizingLabel}
          onDecrease={() => {}}
          onIncrease={() => {}}
          value={sizingValue}
          variant="bet"
        />
      </div>
      <button
        className="tablet-double-offer__button"
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        {label}
      </button>
    </div>
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
      <div className="bottom-bar-stepper__title">
        {label.split(" ").map((word, index, words) => (
          <span key={`${word}-${index}`}>
            {word}
            {index < words.length - 1 && (
              <>
                <span className="bottom-bar-stepper__title-space"> </span>
                <br className="bottom-bar-stepper__title-break" />
              </>
            )}
          </span>
        ))}
      </div>
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
