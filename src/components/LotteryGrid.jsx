import { useEffect, useMemo, useState } from "react";
import "./LotteryGrid.css";
import {
  VIEW2_SYMBOL_ASSET_SOURCES,
  VIEW2_SYMBOL_COMPONENTS,
  VIEW2_SYMBOL_GROUP_CYCLE_MS,
} from "./view2Symbols/index.jsx";

const rows = ["A", "B", "C"];
const LINE_ASSETS = "/img/extracted/Линии-и-Кости-1_00";
const SYMBOL_12_COMBO_BORDER = `${LINE_ASSETS}/sprite_005_102x102_at_1847_432.png`;
const COMBO_BORDERS = [
  SYMBOL_12_COMBO_BORDER,
  `${LINE_ASSETS}/sprite_006_102x102_at_1728_503.png`,
  `${LINE_ASSETS}/sprite_007_102x102_at_1625_607.png`,
  `${LINE_ASSETS}/sprite_008_102x102_at_1521_631.png`,
  `${LINE_ASSETS}/sprite_009_102x102_at_1521_735.png`,
  `${LINE_ASSETS}/sprite_010_102x102_at_1403_824.png`,
  `${LINE_ASSETS}/sprite_011_102x102_at_1285_909.png`,
  `${LINE_ASSETS}/sprite_012_102x102_at_1285_1013.png`,
  `${LINE_ASSETS}/sprite_014_102x102_at_1195_1237.png`,
  `${LINE_ASSETS}/sprite_017_102x102_at_951_1937.png`,
];
const ELDORADO_GROUP_CYCLE_MS = VIEW2_SYMBOL_GROUP_CYCLE_MS;

const collectImageSources = (...values) =>
  values.flatMap((value) => {
    if (!value) return [];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return collectImageSources(...value);
    if (typeof value === "object" && typeof value.src === "string") {
      return [value.src];
    }
    if (typeof value === "object") return collectImageSources(...Object.values(value));
    return [];
  });

export const ELDORADO_VIEW_ASSETS = [
  ...new Set(
    collectImageSources(
      VIEW2_SYMBOL_ASSET_SOURCES,
      COMBO_BORDERS,
      "/img/extracted/Слот_Интерфейс-ковер-для-розыгрыша-визуализации/sprite_001_1145x666_at_3_3.png",
      "/img/extracted/игра-Хушкол-элементы-игры-1_0/sprite_002_201x653_at_1289_1.png",
    ),
  ),
];

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
    }, ELDORADO_GROUP_CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [animationState, groupedWins.length]);

  const activeWinningCells =
    animationState === "settled" && groupedWins.length > 0
      ? (groupedWins[activeWinGroup] ?? groupedWins[0])
      : winningCells;
  const marked = new Set([...activeWinningCells, ...scatterCells]);
  const eldoradoWinningCells = new Set(winningCells);
  const activeComboBorderCells = new Set(
    animationState === "settled" && groupedWins.length > 0
      ? (groupedWins[activeWinGroup] ?? groupedWins[0])
      : [],
  );
  const activeComboBorder =
    animationState === "settled" && groupedWins.length > 0
      ? COMBO_BORDERS[activeWinGroup % COMBO_BORDERS.length]
      : null;
  const showScatterOnly = scatterCells.length >= 2;
  const visibleScatterCells = showScatterOnly ? scatterCells : [];
  const visibleComboBorderCells = showScatterOnly
    ? new Set()
    : activeComboBorderCells;
  const hasMarkedCells = marked.size > 0;
  const isRevealing = animationState === "revealing";
  const isSettled = animationState === "settled";
  const hideDigitsBeforeReveal = !isRevealing && !isSettled;

  // Keep the board visible until a real backend operation reports an error.
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
      <div
        className="scoreboard-wrapper"
        style={{ minHeight: "100%", height: "auto" }}
      >
        <div
          className="digital-scoreboard --error-lockout-view"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "340px",
            background: "#0a0a0a",
            border: "3px solid #ff3333",
            borderRadius: "12px",
          }}
        >
          <div
            className="backend-error-message"
            style={{
              textAlign: "center",
              color: "#ff3333",
              fontFamily: "system-ui, sans-serif",
              padding: "30px",
            }}
          >
            <h2
              style={{
                fontSize: "2.2rem",
                margin: "0 0 12px 0",
                letterSpacing: "3px",
                fontWeight: "800",
              }}
            >
              SYSTEM ERROR
            </h2>
            <p
              style={{
                color: "#aaa",
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: "500",
              }}
            >
              Game session out of sync. Disconnecting board...
            </p>
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

  // VIEW 1: Standard Digital View
  if (!visualMode) {
    return (
      <div className="scoreboard-wrapper">
        <div className={`digital-scoreboard${isRevealing ? " --closing" : ""}`}>
          <div className="digital-scoreboard__top">
            {topCells.map((cell, index) => (
              <GoldCell
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
          <div className="digital-scoreboard__bottom">
            {dRow.map((value, index) => (
              <GoldCell
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
                loading={false}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: Eldorado View
  return (
    <div className="scoreboard-wrapper --eldorado-view">
      <div className="eldorado-scoreboard">
        {topCells.map((cell, index) => (
          <EldoradoCell
            key={`${cell.coord}-${revealKey}`}
            digit={cell.value}
            idxNumber={index}
            highlighted={
              isSettled &&
              (showScatterOnly
                ? visibleScatterCells.includes(cell.coord)
                : eldoradoWinningCells.has(cell.coord))
            }
            comboBorder={
              isSettled && visibleComboBorderCells.has(cell.coord)
                ? activeComboBorder
                : null
            }
            animationKey={`${revealKey}-${cell.coord}-${cell.value}`}
          />
        ))}
        <CarpetNice
          animationState={animationState}
          closeMs={carpetCloseMs}
          openMs={carpetOpenMs}
        />
      </div>
    </div>
  );
}

function CarpetNice({ animationState, closeMs, openMs }) {
  const isRevealing = animationState === "revealing";
  const isSpinning = animationState === "spinning";

  return (
    <div
      className={`carpet-nice${animationState === "idle" || animationState === "settled" ? " carpet-nice__hidden" : ""}`}
      style={{
        "--carpet-close-duration": `${closeMs}ms`,
        "--carpet-open-duration": `${openMs}ms`,
      }}
    >
      <div
        className={`carpet-nice__item${isSpinning ? " --close" : ""}${isRevealing ? " --open" : ""}`}
      />
      <div
        className={`carpet-nice__roll${isSpinning ? " --close" : ""}${isRevealing ? " --open" : ""}`}
      />
    </div>
  );
}

function EldoradoCell({
  digit,
  animated = false,
  highlighted = false,
  dimmed = false,
  comboBorder = null,
  animationKey = "",
}) {
  const symbol = normalizeEldoradoDigit(digit);
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

function GoldCell({
  digit,
  idxNumber,
  idxString,
  showFlame = false,
  size = "",
  highlighted = false,
  dimmed = false,
  eraser = false,
  concealed = false,
  loading = false,
}) {
  const isScatter = digit === "SCATTER";
  const isDoublingMark = typeof digit === "string" && /^x[02]$/i.test(digit);
  const eraserClass = eraser ? eraserPhase(idxNumber, size) : "";
  const revealDelay = eraser ? revealDelayMs(idxNumber, size) : 0;
  const showClass = " --show";
  const displayDigit = digit;

  return (
    <div
      className={`gold-cell${size === "small" ? " --small" : ""}${isDoublingMark ? " --doubling-revealed" : ""}${!concealed && !eraser ? " --value-visible" : ""}${highlighted ? " --win-highlight" : ""}${eraserClass ? ` --revealing ${eraserClass}` : ""}${dimmed ? " --opacity" : ""}`}
    >
      <div
        className={`gold-cell__wrapper${highlighted ? " --glow" : ""}${dimmed ? " --opacity" : ""}`}
      >
        <div className="gold-cell__container" />
        <div
          className={`gold-cell__img${showClass}${eraserClass ? ` --revealing ${eraserClass}` : ""}${concealed ? " --concealed" : ""}${isScatter ? " --stepFire" : ""}`}
          style={
            eraser
              ? {
                  "--gold-cell-reveal-delay": `${revealDelay}ms`,
                }
              : undefined
          }
        >
          {!loading && !isScatter && (
            <div
              className={`gold-cell__item${isDoublingMark ? " --doubling" : ""}`}
            >
              {displayDigit}
            </div>
          )}
        </div>
      </div>
      {idxNumber < 5 && (
        <div className="gold-cell__idx-number">{idxNumber + 1}</div>
      )}
      {idxString && <div className="gold-cell__idx-string">{idxString}</div>}
      {showFlame && <div className="flame" />}
      {loading && <SpinnerLoad />}
    </div>
  );
}

function SpinnerLoad() {
  return (
    <div className="spinner-load">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} />
      ))}
    </div>
  );
}

function idxString(index) {
  if (index === 0) return "A";
  if (index === 5) return "B";
  if (index === 10) return "C";
  return "";
}

function eraserPhase(index, size) {
  if (size === "small") return "--first";
  const column = index % 5;
  return (
    ["--first", "--second", "--third", "--fourth", "--fifth"][column] ??
    "--first"
  );
}

function revealDelayMs(index, size) {
  if (size === "small") return 0;
  return (index % 5) * 420;
}

function normalizeEldoradoDigit(value) {
  if (value === "SCATTER") return 10;
  const digit = Number(value);
  return Number.isFinite(digit) && digit >= 0 && digit <= 12 ? digit : 0;
}
