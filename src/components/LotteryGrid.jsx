import { useEffect, useMemo, useState } from "react";
import "./LotteryGrid.css";

const rows = ["A", "B", "C"];
const HUSHKOL_GAME_ASSETS =
  "/img/extracted/игра-Хушкол-элементы-игры-1";
const HUSHKOL_PAYTABLE_ASSETS =
  "/img/extracted/игра-Хушкол-элементы-таблица-выигрышей-1_0";
const DICE_ASSETS = "/img/extracted/Линии-и-Кости-2_0";
const eldoradoStatic = {
  0: `${HUSHKOL_GAME_ASSETS}_1/sprite_002_202x202_at_963_1.png`,
  1: `${DICE_ASSETS}/sprite_009_143x165_at_207_379.png`,
  2: `${DICE_ASSETS}/sprite_006_144x166_at_205_207.png`,
  3: `${DICE_ASSETS}/sprite_007_143x165_at_355_207.png`,
  4: `${DICE_ASSETS}/sprite_008_143x169_at_356_376.png`,
  5: `${DICE_ASSETS}/sprite_011_142x167_at_356_549.png`,
  6: `${DICE_ASSETS}/sprite_034_144x168_at_298_1401.png`,
  7: `${HUSHKOL_PAYTABLE_ASSETS}/sprite_003_179x179_at_1_1045.png`,
  8: {
    src: `${HUSHKOL_PAYTABLE_ASSETS}/sprite_002_1258x1012_at_15_1031.png`,
    className: " --instrument",
    crop: true,
  },
  9: `${HUSHKOL_GAME_ASSETS}_4/sprite_001_202x202_at_1_1.png`,
  10: `${HUSHKOL_GAME_ASSETS}_3/sprite_001_202x202_at_1_1.png`,
  11: `${HUSHKOL_GAME_ASSETS}_2/sprite_001_202x202_at_1_1.png`,
  12: `${HUSHKOL_PAYTABLE_ASSETS}/sprite_004_178x179_at_1089_1045.png`,
};
const eldoradoWinFrames = {
  1: [
    `${DICE_ASSETS}/sprite_009_143x165_at_207_379.png`,
    `${DICE_ASSETS}/sprite_023_144x166_at_1_1023.png`,
    `${DICE_ASSETS}/sprite_024_143x165_at_151_1023.png`,
    `${DICE_ASSETS}/sprite_030_143x166_at_3_1195.png`,
  ],
  2: [
    `${DICE_ASSETS}/sprite_006_144x166_at_205_207.png`,
    `${DICE_ASSETS}/sprite_033_143x166_at_3_1367.png`,
    `${DICE_ASSETS}/sprite_036_144x166_at_1_1539.png`,
    `${DICE_ASSETS}/sprite_039_142x166_at_3_1711.png`,
  ],
  3: [
    `${DICE_ASSETS}/sprite_007_143x165_at_355_207.png`,
    `${DICE_ASSETS}/sprite_012_143x165_at_207_550.png`,
    `${DICE_ASSETS}/sprite_015_143x165_at_207_721.png`,
    `${DICE_ASSETS}/sprite_029_144x165_at_150_1194.png`,
  ],
  4: [
    `${DICE_ASSETS}/sprite_008_143x169_at_356_376.png`,
    `${DICE_ASSETS}/sprite_014_143x164_at_356_720.png`,
    `${DICE_ASSETS}/sprite_025_142x166_at_300_1061.png`,
    `${DICE_ASSETS}/sprite_031_142x166_at_300_1231.png`,
  ],
  5: [
    `${DICE_ASSETS}/sprite_011_142x167_at_356_549.png`,
    `${DICE_ASSETS}/sprite_017_143x167_at_300_892.png`,
    `${DICE_ASSETS}/sprite_037_143x168_at_300_1571.png`,
    `${DICE_ASSETS}/sprite_011_142x167_at_356_549.png`,
  ],
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
            animated={isSettled && marked.has(cell.coord)}
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
}) {
  const symbol = normalizeEldoradoDigit(digit);
  const image = eldoradoStatic[symbol];
  const imageSrc = typeof image === "string" ? image : image?.src;
  const imageClass = typeof image === "string" ? "" : (image?.className ?? "");
  const isCroppedImage = typeof image === "object" && image?.crop;
  const winFrames = animated ? eldoradoWinFrames[symbol] : null;

  return (
    <div
      className={`eldorado-cell${animated ? " --glow" : ""}${dimmed ? " --opacity" : ""}`}
    >
      <div className="eldorado-cell__container">
        {winFrames?.length > 1 ? (
          <span className="eldorado-cell__animation" aria-label="image">
            {winFrames.map((frame, index) => (
              <img
                alt=""
                aria-hidden="true"
                key={frame}
                src={frame}
                className={`eldorado-cell__item --${symbol} --frame --frame-${index + 1}`}
              />
            ))}
          </span>
        ) : imageSrc && isCroppedImage ? (
          <span
            aria-label="image"
            className={`eldorado-cell__item --${symbol}${imageClass}`}
            style={{ "--eldorado-symbol-image": `url("${imageSrc}")` }}
          />
        ) : imageSrc ? (
          <img
            alt="image"
            src={imageSrc}
            className={`eldorado-cell__item --${symbol}${imageClass}`}
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
