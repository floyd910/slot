const DOUBLE_ASSETS =
  "/img/extracted/\u0442\u0443\u0442-\u0444\u043e\u043d--\u0432\u044b\u0431\u043e\u0440-\u0438\u0433\u0440-\u043f\u0435\u0440\u0432\u0430\u044f-\u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430-\u0438-\u0441\u0440\u0430\u0437\u0443-\u043b\u043e\u0442\u043e\u0440\u0435\u0439\u043d\u044b\u0439-\u0440\u0435\u0436\u0438\u043c_\u0443\u0434\u0432\u043e\u0435\u043d\u0438\u0435-5_0";

export const view2DoubleAsset = (file) => `${DOUBLE_ASSETS}/${file}`;

const CLOSED_CHEST = view2DoubleAsset("sprite_013_144x137_at_333_1554.png");
const WINNING_CHEST = view2DoubleAsset("sprite_014_164x160_at_1_1558.png");
const EMPTY_CHEST = view2DoubleAsset("sprite_006_144x160_at_1866_1.png");
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
      arches: view2DoubleAsset("sprite_010_1336x542_at_1_947.webp"),
      character: view2DoubleAsset("sprite_005_250x305_at_1611_1.png"),
      ladderLeft: view2DoubleAsset("sprite_002_21x194_at_1339_1.png"),
      ladderRight: view2DoubleAsset("sprite_003_21x194_at_1419_1.png"),
      landscape: view2DoubleAsset("sprite_001_1336x542_at_1_1.webp"),
      pickHighlight: view2DoubleAsset("sprite_004_159x351_at_1447_1.png"),
      resultFrame: view2DoubleAsset("sprite_012_203x57_at_4_1494.png"),
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
    lastPick,
    levels: LADDER_MULTIPLIERS.map((multiplier, index) => {
      const active = index >= LADDER_MULTIPLIERS.length - 1 - step;
      return {
        active,
        imageSrc: view2DoubleAsset(
          active
            ? "sprite_020_160x58_at_163_1826.png"
            : "sprite_011_160x59_at_211_1491.png",
        ),
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

  return CLOSED_CHEST;
}