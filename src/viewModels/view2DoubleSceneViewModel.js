import { DOUBLE_SCENE_ASSET_SOURCES } from "../config/gameAssets.js";

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
  const ladderBaseAmount = Number(ladderAmount ?? amount ?? 0);
  const hasResolvedResult = lastStatus === "win" || lastStatus === "lose";

  return {
    backgroundSource: DOUBLE_SCENE_ASSET_SOURCES.background,
    choices: SIDES.map((side) =>
      buildChestChoice({
        hasResolvedResult,
        lastPick,
        lastStatus,
        showOtherWinningChest,
        side,
      }),
    ),
    levels: LADDER_MULTIPLIERS.map((multiplier, index) => ({
      id: multiplier,
      active: index >= LADDER_MULTIPLIERS.length - 1 - step,
      value: (ladderBaseAmount * multiplier).toFixed(2),
    })),
  };
}

function buildChestChoice({
  hasResolvedResult,
  lastPick,
  lastStatus,
  showOtherWinningChest,
  side,
}) {
  const isSelected = lastPick === side;
  const status = isSelected ? lastStatus : "";
  const chest = getChestPresentation({
    hasResolvedResult,
    isSelected,
    lastPick,
    lastStatus,
    showOtherWinningChest,
    side,
  });

  return {
    ...chest,
    isSelected,
    side,
    status,
  };
}

function getChestPresentation({
  hasResolvedResult,
  isSelected,
  lastPick,
  lastStatus,
  showOtherWinningChest,
  side,
}) {
  if (isSelected && hasResolvedResult) {
    if (lastStatus === "win") {
      return {
        mirrored: side === "right",
        source: DOUBLE_SCENE_ASSET_SOURCES.winningChest,
        variant: "winning",
      };
    }

    return {
      mirrored: side === "left",
      source: DOUBLE_SCENE_ASSET_SOURCES.emptyChest,
      variant: "empty",
    };
  }

  if (lastStatus === "lose" && lastPick && showOtherWinningChest) {
    return {
      mirrored: side === "right",
      source: DOUBLE_SCENE_ASSET_SOURCES.winningChest,
      variant: "winning",
    };
  }

  return {
    mirrored: false,
    source:
      side === "left" ? DOUBLE_SCENE_ASSET_SOURCES.leftClosedChest : DOUBLE_SCENE_ASSET_SOURCES.rightClosedChest,
    variant: "closed",
  };
}
