import { useEffect, useMemo, useState } from "react";
import "./LotteryGrid.css";
import {
  VIEW2_SYMBOL_COMPONENTS,
  VIEW2_SYMBOL_GROUP_CYCLE_MS,
} from "./view2Symbols/index.jsx";
import { COMBO_BORDERS } from "../config/view2Assets.js";

const rows = ["A", "B", "C"];
const VIEW2_GROUP_CYCLE_MS = VIEW2_SYMBOL_GROUP_CYCLE_MS;

export default function LotteryGrid({
  grid = {},
  revealKey = 0,
  animationState = "idle",
  visualMode,
  winningCells = [],
  winningGroups = [],
  scatterCells = [],
  doublingState,
  backendError = false,
  carpetCloseMs = 1455,
  carpetOpenMs = 1455,
}) {
  const groupedWins = useMemo(() => {
    const groups = winningGroups
      .map((group) =>
        Array.isArray(group?.winningCells) ? group.winningCells : group,
      )
      .filter((group) => Array.isArray(group) && group.length > 0);

    return groups.length > 0 ? groups : winningCells.length > 0 ? [winningCells] : [];
  }, [winningGroups, winningCells]);
  const [activeWinGroup, setActiveWinGroup] = useState(0);

  useEffect(() => {
    setActiveWinGroup(0);
    if (groupedWins.length <= 1 || animationState !== "settled") return;
    const interval = window.setInterval(() => {
      setActiveWinGroup((index) => (index + 1) % groupedWins.length);
    }, VIEW2_GROUP_CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [animationState, groupedWins.length]);

  const activeWinningCells =
    animationState === "settled" && groupedWins.length > 0
      ? (groupedWins[activeWinGroup] ?? groupedWins[0])
      : winningCells;
  const marked = new Set([...activeWinningCells, ...scatterCells]);
  const view2WinningCells = new Set(winningCells);
  const activeComboBorderCells = new Set(
    animationState === "settled" && groupedWins.length > 0
      ? (groupedWins[activeWinGroup] ?? groupedWins[0])
      : [],
  );
  const showScatterOnly = scatterCells.length >= 2;
  const activeComboBorder =
    animationState === "settled" && (groupedWins.length > 0 || showScatterOnly)
      ? COMBO_BORDERS[activeWinGroup % COMBO_BORDERS.length]
      : null;
  const visibleScatterCells = showScatterOnly ? scatterCells : [];
  const visibleComboBorderCells = new Set([
    ...activeComboBorderCells,
    ...(showScatterOnly ? scatterCells : []),
  ]);
  const isRevealing = animationState === "revealing";
  const isSettled = animationState === "settled";
  const hideDigitsBeforeReveal = !isRevealing && !isSettled;

  const isGridMissing =
    !grid ||
    !grid.A ||
    grid.A.length === 0 ||
    !grid.B ||
    grid.B.length === 0 ||
    !grid.C ||
    grid.C.length === 0;

  if (backendError || isGridMissing) {
    return (
      <div className="lottery-grid lottery-grid--error">
        <div className="lottery-grid-view1 lottery-grid-view1--error">
          <div className="lottery-grid__error-message">
            <h2>SYSTEM ERROR</h2>
            <p>Game session out of sync. Disconnecting board...</p>
          </div>
        </div>
      </div>
    );
  }

  const topCells = rows.flatMap((row) =>
    grid[row].map((value, index) => ({
      value,
      coord: `${row}${index + 1}`,
    })),
  );

  const doublingMarks = doublingState?.marks ?? [];
  const hasDoublingMarks =
    animationState !== "spinning" &&
    (doublingMarks.some(Boolean) ||
      doublingState?.active ||
      doublingState?.loading);
  const dRow = hasDoublingMarks ? doublingMarks : (grid.D ?? []);

  if (!visualMode) {
    return (
      <div className="lottery-grid lottery-grid--view1">
        <div
          className={`lottery-grid-view1${isRevealing ? " lottery-grid-view1--closing" : ""}`}
        >
          <div className="lottery-grid-view1__top">
            {topCells.map((cell, index) => (
              <View1Cell
                key={`${cell.coord}-${revealKey}`}
                digit={cell.value}
                idxNumber={index}
                idxString={idxString(index)}
                highlighted={marked.has(cell.coord)}
                eraser={isRevealing}
                concealed={hideDigitsBeforeReveal}
              />
            ))}
          </div>
          <div className="lottery-grid-view1__bottom">
            {dRow.map((value, index) => (
              <View1Cell
                key={`D${index}-${hasDoublingMarks ? doublingState.revealKey : revealKey}-${value}`}
                digit={value}
                idxNumber={index}
                idxString={index === 0 ? "D" : ""}
                size="small"
                highlighted={
                  hasDoublingMarks
                    ? value === "x2" && index === doublingState.step - 1
                    : value === "SCATTER"
                }
                dimmed={false}
                eraser={
                  hasDoublingMarks
                    ? doublingState.changedIndex === index && Boolean(value)
                    : isRevealing
                }
                concealed={!hasDoublingMarks && hideDigitsBeforeReveal}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lottery-grid lottery-grid--view2">
      <div className="lottery-grid-view2">
        {topCells.map((cell) => (
          <View2Cell
            key={`${cell.coord}-${revealKey}`}
            digit={cell.value}
            highlighted={
              isSettled &&
              (showScatterOnly
                ? visibleScatterCells.includes(cell.coord)
                : view2WinningCells.has(cell.coord))
            }
            comboBorder={
              isSettled && visibleComboBorderCells.has(cell.coord)
                ? activeComboBorder
                : null
            }
            animationKey={`${revealKey}-${cell.coord}-${cell.value}`}
          />
        ))}
        <View2Cover
          animationState={animationState}
          closeMs={carpetCloseMs}
          openMs={carpetOpenMs}
        />
      </div>
    </div>
  );
}

function View2Cover({ animationState, closeMs, openMs }) {
  const isRevealing = animationState === "revealing";
  const isSpinning = animationState === "spinning";

  return (
    <div
      className={`lottery-grid-view2-cover${isSpinning ? " lottery-grid-view2-cover--spinning" : ""}${isRevealing ? " lottery-grid-view2-cover--revealing" : ""}${animationState === "idle" || animationState === "settled" ? " lottery-grid-view2-cover--hidden" : ""}`}
      style={{
        "--carpet-close-duration": `${closeMs}ms`,
        "--carpet-open-duration": `${openMs}ms`,
      }}
    >
      <div
        className={`lottery-grid-view2-cover__sheet${isSpinning ? " lottery-grid-view2-cover__sheet--close" : ""}${isRevealing ? " lottery-grid-view2-cover__sheet--open" : ""}`}
      />
      <div
        className={`lottery-grid-view2-cover__roll${isSpinning ? " lottery-grid-view2-cover__roll--close" : ""}${isRevealing ? " lottery-grid-view2-cover__roll--open" : ""}`}
      />
    </div>
  );
}

function View2Cell({
  digit,
  animated = false,
  highlighted = false,
  dimmed = false,
  comboBorder = null,
  animationKey = "",
}) {
  const symbol = normalizeView2Digit(digit);
  const SymbolComponent =
    VIEW2_SYMBOL_COMPONENTS[symbol] ?? VIEW2_SYMBOL_COMPONENTS[0];

  return (
    <SymbolComponent
      animated={animated}
      highlighted={highlighted}
      dimmed={dimmed}
      comboBorder={comboBorder}
      animationKey={animationKey}
    />
  );
}

function View1Cell({
  digit,
  idxNumber,
  idxString,
  size = "",
  highlighted = false,
  dimmed = false,
  eraser = false,
  concealed = false,
}) {
  const isScatter = digit === "SCATTER";
  const isDoublingMark = typeof digit === "string" && /^x[02]$/i.test(digit);
  const revealDelay = eraser ? revealDelayMs(idxNumber, size) : 0;

  return (
    <div
      className={`lottery-grid-view1-cell${size === "small" ? " lottery-grid-view1-cell--small" : ""}${isDoublingMark ? " lottery-grid-view1-cell--doubling-revealed" : ""}${!concealed && !eraser ? " lottery-grid-view1-cell--value-visible" : ""}${highlighted ? " lottery-grid-view1-cell--win-highlight" : ""}${eraser ? " lottery-grid-view1-cell--revealing" : ""}${dimmed ? " lottery-grid-view1-cell--dimmed" : ""}`}
      style={
        eraser
          ? {
              "--view1-cell-reveal-delay": `${revealDelay}ms`,
            }
          : undefined
      }
    >
      <div
        className={`lottery-grid-view1-cell__wrapper${highlighted ? " lottery-grid-view1-cell__wrapper--glow" : ""}${dimmed ? " lottery-grid-view1-cell__wrapper--dimmed" : ""}`}
      >
        <div className="lottery-grid-view1-cell__container" />
        <div
          className={`lottery-grid-view1-cell__image${concealed ? " lottery-grid-view1-cell__image--concealed" : ""}${isScatter ? " lottery-grid-view1-cell__image--scatter" : ""}`}
        >
          {!isScatter && (
            <div
              className={`lottery-grid-view1-cell__value${isDoublingMark ? " lottery-grid-view1-cell__value--doubling" : ""}`}
            >
              {digit}
            </div>
          )}
        </div>
      </div>
      {idxNumber < 5 && (
        <div className="lottery-grid-view1-cell__index-number">{idxNumber + 1}</div>
      )}
      {idxString && (
        <div className="lottery-grid-view1-cell__index-label">{idxString}</div>
      )}
    </div>
  );
}

function idxString(index) {
  if (index === 0) return "A";
  if (index === 5) return "B";
  if (index === 10) return "C";
  return "";
}

function revealDelayMs(index, size) {
  if (size === "small") return 0;
  return (index % 5) * 420;
}

function normalizeView2Digit(value) {
  if (value === "SCATTER") return 10;
  const digit = Number(value);
  return Number.isFinite(digit) && digit >= 0 && digit <= 12 ? digit : 0;
}
