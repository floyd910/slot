const DOUBLE_ASSETS =
  "/img/extracted/\u0442\u0443\u0442-\u0444\u043e\u043d--\u0432\u044b\u0431\u043e\u0440-\u0438\u0433\u0440-\u043f\u0435\u0440\u0432\u0430\u044f-\u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430-\u0438-\u0441\u0440\u0430\u0437\u0443-\u043b\u043e\u0442\u043e\u0440\u0435\u0439\u043d\u044b\u0439-\u0440\u0435\u0436\u0438\u043c_\u0443\u0434\u0432\u043e\u0435\u043d\u0438\u0435-5_0";

export const view2DoubleAsset = (file) => `${DOUBLE_ASSETS}/${file}`;

const LEFT_CLOSED_CHEST = "/assets/img/double-left-chest.png";
const RIGHT_CLOSED_CHEST = "/assets/img/double-right-chest.png";
const WINNING_CHEST = "/assets/img/double-winning-chest.png";
const EMPTY_CHEST = "/assets/img/double-empty-chest.png";
const LADDER_MULTIPLIERS = [32, 16, 8, 4, 2, 1];
const SIDES = ["left", "right"];

export function buildView2DoubleSceneViewModel({
  amount,
  ladderAmount,
  lastPick,
  lastStatus,
  showOtherWinningChest,
  step,
}) {
  const numericAmount = lastStatus === "lose" ? 0 : Number(amount ?? 0);
  const ladderBaseAmount = Number(ladderAmount ?? amount ?? 0);
  const hasResolvedResult = lastStatus === "win" || lastStatus === "lose";

  return {
    amountLabel: numericAmount === 0 ? "0" : numericAmount.toFixed(2),
    assets: {
      landscape: "/assets/img/double-scene-bg.png",
      lossLandscape: "/assets/img/double-scene-loss-bg.png",
      pickHighlight: view2DoubleAsset("sprite_004_159x351_at_1447_1.png"),
    },
    choices: SIDES.map((side) => ({
      chestSource: getChestSource({
        hasResolvedResult,
        lastPick,
        lastStatus,
        showOtherWinningChest,
        side,
      }),
      lastStatus: lastPick === side ? lastStatus : "",
      side,
    })),
    isLoss: lastStatus === "lose",
    lastPick,
    levels: LADDER_MULTIPLIERS.map((multiplier, index) => {
      const active = index >= LADDER_MULTIPLIERS.length - 1 - step;
      return {
        active,
        value: (ladderBaseAmount * multiplier).toFixed(2),
      };
    }),
  };
}

function getChestSource({
  hasResolvedResult,
  lastPick,
  lastStatus,
  showOtherWinningChest,
  side,
}) {
  if (lastPick === side && hasResolvedResult) {
    return lastStatus === "win" ? WINNING_CHEST : EMPTY_CHEST;
  }

  if (lastStatus === "lose" && lastPick && showOtherWinningChest) {
    return WINNING_CHEST;
  }

  return side === "left" ? LEFT_CLOSED_CHEST : RIGHT_CLOSED_CHEST;
}