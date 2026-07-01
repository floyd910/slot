export function buildBottomBarControls({
  autoPlayOn,
  disabled,
  doubleOfferAvailable,
  doublingState,
  infoActive,
  isVisualDoubling,
  onAutoPlay,
  onCollect,
  onDouble,
  onIncreaseCombination,
  onIncreaseStake,
  onInfo,
  onMenu,
  onPickLeft,
  onPickRight,
  onSpin,
  onVisualToggle,
  paytableControlsLocked,
  spinDisabled,
  spinFeedbackActive,
  toggleLanguage,
  viewSwitchDisabled,
  visualMode,
}) {
  const canDouble =
    !disabled && doubleOfferAvailable && !doublingState?.loading;

  return [
    {
      kind: "takeMoney",
      disabled,
      onClick: onCollect,
      type: "takeMoney",
    },
    {
      active: infoActive,
      disabled,
      extraClass: "information-button",
      onClick: onInfo,
      type: "information",
    },
    {
      extraClass: "language-button",
      onClick: toggleLanguage,
      suppressPressFeedback: true,
      type: "language",
    },
    {
      disabled: disabled || !onMenu,
      extraClass: "language-button",
      onClick: onMenu,
      type: "menu",
    },
    {
      active: visualMode,
      disabled: disabled || viewSwitchDisabled,
      extraClass: "language-button",
      onClick: onVisualToggle,
      type: "visualization",
    },
    isVisualDoubling
      ? {
          disabled,
          extraClass: "language-button",
          onClick: onPickLeft,
          type: "left",
        }
      : doubleOfferAvailable
        ? {
            disabled: !canDouble,
            extraClass: "language-button",
            onClick: onDouble,
            type: "double",
          }
        : {
            disabled: disabled || paytableControlsLocked,
            extraClass: "language-button",
            onClick: onIncreaseStake,
            type: "betAmount",
          },
    isVisualDoubling
      ? {
          disabled,
          extraClass: "language-button",
          onClick: onPickRight,
          type: "right",
        }
      : {
          disabled: disabled || paytableControlsLocked,
          extraClass: "language-button",
          onClick: onIncreaseCombination,
          type: "lotteryCombination",
        },
    {
      active: autoPlayOn,
      disabled: disabled && !autoPlayOn,
      extraClass: "auto-express-button",
      onClick: onAutoPlay,
      type: "autoExpress",
    },
    {
      active: spinFeedbackActive,
      disabled: disabled || spinDisabled,
      extraClass: "spin-draw-button",
      onClick: onSpin,
      type: "spinDraw",
    },
  ];
}

export function getBottomBarLabel(type, { language, t }) {
  const labels = {
    autoExpress: t("autoExpress"),
    betAmount: t("betAmount"),
    double: t("double"),
    information: t("info"),
    language: language === "ru" ? "\u0422\u041e\u04b6\u0418\u041a\u04e2" : "\u0420\u0423\u0421\u0421\u041a\u0418\u0419",
    left: t("left"),
    lotteryCombination: t("lotteryCombination"),
    menu: t("menu"),
    right: t("right"),
    spinDraw: splitMultiline(t("participate")),
    takeMoney: t("takeMoney"),
    visualization: splitMultiline(t("visualization")),
  };

  return labels[type] ?? type;
}

function splitMultiline(text) {
  const [firstLine, secondLine] = text.split("\n");
  return { firstLine, secondLine };
}