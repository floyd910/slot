import { useEffect, useMemo, useState } from "react";
import "./LotteryGrid.css";

const rows = ["A", "B", "C"];
const eldoradoStatic = {
  0: "static-0.e9b0187b.webp",
  1: "static-1.370ebc88.webp",
  2: "static-2.56b6cf39.webp",
  3: "static-3.73bd4f2a.webp",
  4: "static-4.2aa19f0d.webp",
  5: "static-5.635a476d.webp",
  6: "static-6.36840f86.webp",
  7: "static-7.9910247d.webp",
  8: "static-8.2ed034f6.webp",
  9: "static-9.12aded74.webp",
  10: "static-10.b42777fd.webp",
};
const eldoradoAnim = {
  0: "anim-0.41ab1375.webp",
  1: "anim-1.5abba0ce.webp",
  2: "anim-2.7329c493.webp",
  3: "anim-3.727bf396.webp",
  4: "anim-4.8f496ec7.webp",
  5: "anim-5.87c816a2.webp",
  6: "anim-6.bd317c5e.webp",
  7: "anim-7.4e98e307.webp",
  8: "anim-8.d7089d52.webp",
  9: "anim-9.2d545620.webp",
  10: "anim-10.d692585e.webp",
};

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
}) {
  const groupedWins = useMemo(
    () =>
      winningGroups
        .map((group) =>
          Array.isArray(group?.winningCells) ? group.winningCells : group,
        )
        .filter((group) => Array.isArray(group) && group.length > 0),
    [winningGroups],
  );
  const [activeWinGroup, setActiveWinGroup] = useState(0);

  useEffect(() => {
    setActiveWinGroup(0);
    if (groupedWins.length <= 1 || animationState !== "settled") return;
    const interval = window.setInterval(() => {
      setActiveWinGroup((index) => (index + 1) % groupedWins.length);
    }, 700);
    return () => window.clearInterval(interval);
  }, [animationState, groupedWins.length]);

  const activeWinningCells =
    animationState === "settled" && groupedWins.length > 0
      ? (groupedWins[activeWinGroup] ?? groupedWins[0])
      : winningCells;
  const marked = new Set([...activeWinningCells, ...scatterCells]);
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
    doublingMarks.some(Boolean) ||
    doublingState?.active ||
    doublingState?.loading;
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
                dimmed={
                  hasDoublingMarks
                    ? index > doublingState.step
                    : false
                }
                eraser={
                  hasDoublingMarks
                    ? doublingState.changedIndex === index && Boolean(value)
                    : isRevealing
                }
                concealed={!hasDoublingMarks && hideDigitsBeforeReveal}
                loading={
                  hasDoublingMarks &&
                  doublingState.loading &&
                  index === doublingState.step
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: Eldorado View
  // Added inline matching directives to bind container height constraints to View 1's bounding box rules
  return (
    <div
      className="scoreboard-wrapper --eldorado-view"
      style={{
        minHeight: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="eldorado-scoreboard"
        style={{ flexGrow: 1, minHeight: "340px" }}
      >
        {topCells.map((cell, index) => (
          <EldoradoCell
            key={`${cell.coord}-${revealKey}`}
            digit={cell.value}
            idxNumber={index}
            animated={isSettled && marked.has(cell.coord)}
            dimmed={isSettled && hasMarkedCells && !marked.has(cell.coord)}
            showFire={isSettled && marked.has(cell.coord)}
          />
        ))}
        <CarpetNice animationState={animationState} />
      </div>
    </div>
  );
}

function CarpetNice({ animationState }) {
  const isRevealing = animationState === "revealing";
  const isSpinning = animationState === "spinning";

  return (
    <div
      className={`carpet-nice${animationState === "idle" || animationState === "settled" ? " carpet-nice__hidden" : ""}`}
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
  dimmed = false,
  showFire = false,
}) {
  const symbol = normalizeEldoradoDigit(digit);
  const image = animated ? eldoradoAnim[symbol] : eldoradoStatic[symbol];

  return (
    <div
      className={`eldorado-cell${animated ? " --glow" : ""}${dimmed ? " --opacity" : ""}${showFire ? " --fire" : ""}`}
    >
      <div className="eldorado-cell__container">
        {image ? (
          <img
            alt="image"
            src={`https://lotogame.lotosport.tj/img/${image}`}
            className={`eldorado-cell__item --${symbol}`}
          />
        ) : (
          <span className={`eldorado-cell__fallback --${symbol}`}>
            {symbol}
          </span>
        )}
      </div>
    </div>
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
      className={`gold-cell${size === "small" ? " --small" : ""}${!concealed && !eraser ? " --value-visible" : ""}${highlighted ? " --win-highlight" : ""}${eraserClass ? ` --revealing ${eraserClass}` : ""}${dimmed ? " --opacity" : ""}`}
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
