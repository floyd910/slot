import "./LotteryGrid.css";
import { VIEW2_SYMBOL_COMPONENTS } from "./view2Symbols/index.jsx";
import { useLotteryGridViewModel } from "../hooks/useLotteryGridViewModel.js";
import {
  getRevealDelayMs,
  normalizeView2Digit,
} from "../viewModels/lotteryGridViewModel.js";

export default function LotteryGrid({
  grid = {},
  revealKey = 0,
  animationState = "idle",
  visualMode,
  winningCells = [],
  winningGroups = [],
  scatterCells = [],
  doublingState,
  carpetCloseMs = 1455,
  carpetOpenMs = 1455,
}) {
  const model = useLotteryGridViewModel({
    animationState,
    carpetCloseMs,
    carpetOpenMs,
    doublingState,
    grid,
    revealKey,
    scatterCells,
    visualMode,
    winningCells,
    winningGroups,
  });

  if (model.isGridMissing) return null;

  if (model.mode === "view1") {
    const topRows = ["A", "B", "C"].map((label, index) => ({
      label,
      cells: model.topCells.slice(index * 5, index * 5 + 5),
    }));

    return (
      <div className="lottery-grid lottery-grid--view1">
        <div className="lottery-grid-view1">
          <div className="lottery-grid-view1__top">
            {topRows.map((row) => (
              <View1Row
                key={row.label}
                {...row}
                showColumnNumbers={row.label === "A"}
              />
            ))}
          </div>
          <div className="hr"></div>
          <div className="lottery-grid-view1__bottom">
            <View1Row label="D" cells={model.bottomCells} showColumnNumbers />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lottery-grid lottery-grid--view2">
      <div className="lottery-grid-view2">
        {model.cells.map((cell) => (
          <View2Cell key={cell.key} {...cell} />
        ))}
        <View2Cover {...model.cover} />
      </div>
    </div>
  );
}

function View2Cover({ animationState, closeMs, openMs }) {
  const isRevealing = animationState === "revealing";
  const isSpinning = animationState === "spinning";

  return (
    <div
      className={`lottery-grid-view2-cover${animationState === "idle" || animationState === "settled" ? " lottery-grid-view2-cover--hidden" : ""}`}
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
      comboBorder={comboBorder}
      animationKey={animationKey}
    />
  );
}

function View1Row({ label, cells, showColumnNumbers = false }) {
  return (
    <div
      className={`lottery-grid-view1__row${showColumnNumbers ? " lottery-grid-view1__row--numbered" : ""}`}
    >
      <div className="lottery-grid-view1__row-label" aria-hidden="true">
        {label}
      </div>
      <div className="lottery-grid-view1__row-content">
        {showColumnNumbers && (
          <div className="lottery-grid-view1__column-labels" aria-hidden="true">
            {cells.map((cell, index) => (
              <div
                key={`column-label-${cell.key}`}
                className="lottery-grid-view1__column-label"
              >
                {index + 1}
              </div>
            ))}
          </div>
        )}
        <div className="lottery-grid-view1__row-cells">
          {cells.map((cell) => (
            <View1Cell key={cell.key} {...cell} />
          ))}
        </div>
      </div>
    </div>
  );
}

function View1Cell({
  digit,
  idxNumber,
  size = "",
  highlighted = false,
  eraser = false,
  concealed = false,
}) {
  const isScatter = digit === "SCATTER";
  const isDoublingMark = typeof digit === "string" && /^x[02]$/i.test(digit);
  const revealDelay = eraser ? getRevealDelayMs(idxNumber, size) : 0;

  return (
    <div
      className={`lottery-grid-view1-cell${size === "small" ? " lottery-grid-view1-cell--small" : ""}${isDoublingMark ? " lottery-grid-view1-cell--doubling-revealed" : ""}${!concealed && !eraser ? " lottery-grid-view1-cell--value-visible" : ""}${highlighted ? " lottery-grid-view1-cell--win-highlight" : ""}${eraser ? " lottery-grid-view1-cell--revealing" : ""}`}
      style={
        eraser
          ? {
              "--view1-cell-reveal-delay": `${revealDelay}ms`,
            }
          : undefined
      }
    >
      <div
        className={`lottery-grid-view1-cell__wrapper${highlighted ? " lottery-grid-view1-cell__wrapper--glow" : ""}`}
      >
        <div className="lottery-grid-view1-cell__container" />
        <div
          className={`lottery-grid-view1-cell__image${concealed ? " lottery-grid-view1-cell__image--concealed" : ""}`}
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
    </div>
  );
}
