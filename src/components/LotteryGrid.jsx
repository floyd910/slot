import { useEffect, useMemo, useState } from "react";
import "./LotteryGrid.css";

const rows = ["A", "B", "C"];
const HUSHKOL_GAME_ASSETS =
  "/img/extracted/игра-Хушкол-элементы-игры-1";
const HUSHKOL_PAYTABLE_ASSETS =
  "/img/extracted/игра-Хушкол-элементы-таблица-выигрышей-1_0";
const DICE_ASSETS = "/img/extracted/Линии-и-Кости-2_0";
const LINE_ASSETS = "/img/extracted/Линии-и-Кости-1_00";
const VIDEO_DICE_SHINE_SPRITE = "/img/reference/dice-shine-video-sprite.png";
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
const diceCellBackgrounds = {
  1: `${DICE_ASSETS}/sprite_013_202x202_at_1_613.png`,
  2: `${DICE_ASSETS}/sprite_005_202x202_at_1_205.png`,
  3: `${DICE_ASSETS}/sprite_001_202x202_at_1_1.png`,
  4: `${DICE_ASSETS}/sprite_002_202x202_at_205_1.png`,
  5: `${DICE_ASSETS}/sprite_010_202x202_at_1_409.png`,
  6: `${DICE_ASSETS}/sprite_001_202x202_at_1_1.png`,
};
const eldoradoCellBackgrounds = {
  0: `${DICE_ASSETS}/sprite_010_202x202_at_1_409.png`,
  7: `${DICE_ASSETS}/sprite_002_202x202_at_205_1.png`,
  8: `${DICE_ASSETS}/sprite_005_202x202_at_1_205.png`,
  9: `${DICE_ASSETS}/sprite_013_202x202_at_1_613.png`,
  10: `${DICE_ASSETS}/sprite_001_202x202_at_1_1.png`,
  11: `${DICE_ASSETS}/sprite_010_202x202_at_1_409.png`,
  12: `${DICE_ASSETS}/sprite_016_202x202_at_1_817.png`,
};
const eldoradoStatic = {
  0: `${HUSHKOL_GAME_ASSETS}_1/sprite_002_202x202_at_963_1.png`,
  1: `${DICE_ASSETS}/sprite_009_143x165_at_207_379.png`,
  2: `${DICE_ASSETS}/sprite_006_144x166_at_205_207.png`,
  3: `${DICE_ASSETS}/sprite_007_143x165_at_355_207.png`,
  4: `${DICE_ASSETS}/sprite_008_143x169_at_356_376.png`,
  5: `${DICE_ASSETS}/sprite_014_143x164_at_356_720.png`,
  6: `${DICE_ASSETS}/sprite_011_142x167_at_356_549.png`,
  7: `${HUSHKOL_GAME_ASSETS}_2/sprite_015_202x202_at_817_205.png`,
  8: `${HUSHKOL_GAME_ASSETS}_3/sprite_019_202x202_at_1633_205.png`,
  9: `${HUSHKOL_GAME_ASSETS}_4/sprite_004_202x202_at_613_1.png`,
  10: `${HUSHKOL_GAME_ASSETS}_3/sprite_001_202x202_at_1_1.png`,
  11: `${HUSHKOL_GAME_ASSETS}_2/sprite_014_202x202_at_613_205.png`,
  12: `${HUSHKOL_GAME_ASSETS}_4/sprite_013_202x202_at_409_205.png`,
};
const eldoradoWinFrames = {};

const frameXs = [1, 205, 409, 613, 817, 1021, 1225, 1429, 1633, 1837];
const frameFile = (number, x, y = 1) =>
  `sprite_${String(number).padStart(3, "0")}_202x202_at_${x}_${y}.png`;
const characterFramePath = (folder, file) =>
  `${HUSHKOL_GAME_ASSETS}_${folder}/${file}`;
const characterFrameFiles = (folder, files) =>
  files.map((file) => characterFramePath(folder, file));
const firstRowFrames = (folder) =>
  frameXs.map((x, index) =>
    characterFramePath(folder, frameFile(index + 1, x)),
  );
const numberedCharacterFrames = (folder, frames) =>
  characterFrameFiles(
    folder,
    frames.map(([number, x, y]) => frameFile(number, x, y)),
  );
const coinBagWinFrames = characterFrameFiles(1, [
  "sprite_002_202x202_at_963_1.png",
  "sprite_003_202x202_at_1167_1.png",
  "sprite_004_202x202_at_1371_1.png",
  "sprite_005_202x202_at_1575_1.png",
  "sprite_006_202x202_at_1779_1.png",
  "sprite_007_202x202_at_963_205.png",
  "sprite_008_202x202_at_1167_205.png",
  "sprite_009_202x202_at_1371_205.png",
  "sprite_010_202x202_at_1575_205.png",
  "sprite_011_202x202_at_1779_205.png",
]);
const symbol9WinFrames = numberedCharacterFrames(4, [
  [1, 1, 1],
  [2, 205, 1],
  [3, 409, 1],
  [4, 613, 1],
  [5, 817, 1],
  [6, 1021, 1],
  [7, 1225, 1],
  [8, 1429, 1],
  [9, 1633, 1],
  [10, 1837, 1],
  [11, 1, 205],
  [12, 205, 205],
]);
const symbol12WinFrames = numberedCharacterFrames(4, [
  [13, 409, 205],
  [14, 613, 205],
  [15, 817, 205],
  [16, 1021, 205],
  [17, 1225, 205],
  [18, 1429, 205],
  [19, 1633, 205],
  [20, 1837, 205],
]);

const eldoradoSpecialWinFrames = {
  0: coinBagWinFrames,
  7: numberedCharacterFrames(2, [
    [15, 817, 205],
    [16, 1021, 205],
    [17, 1225, 205],
    [18, 1429, 205],
    [19, 1633, 205],
    [20, 1837, 205],
  ]),
  8: numberedCharacterFrames(3, [
    [19, 1633, 205],
    [20, 1837, 205],
  ]),
  9: symbol9WinFrames,
  10: firstRowFrames(3),
  11: numberedCharacterFrames(2, [
    [14, 613, 205],
    [13, 409, 205],
    [12, 205, 205],
    [11, 1, 205],
  ]),
  12: symbol12WinFrames,
};
const eldoradoSpecialSymbols = new Set([0, 7, 8, 9, 10, 11, 12]);
const eldoradoForwardLoopSymbols = new Set([9, 12]);
const eldoradoSpecialFrameMs = {
  9: 167,
  12: 250,
};

const ELDORADO_WIN_FRAME_MS = 85;
const ELDORADO_WIN_CYCLE_MS = 1530;
const ELDORADO_GROUP_CYCLE_MS =
  (Math.max(
    ...Object.values(eldoradoSpecialWinFrames).map((frames) =>
      Math.max(frames.length * 2 - 2, 1),
    ),
  ) +
    1) *
  ELDORADO_WIN_FRAME_MS;

const getPingPongFrameIndex = (tick, frameCount) => {
  if (frameCount <= 1) return 0;
  const cycleLength = frameCount * 2 - 2;
  const cycleIndex = tick % cycleLength;
  return cycleIndex < frameCount ? cycleIndex : cycleLength - cycleIndex;
};

const getEldoradoFrameIndex = (symbol, tick, frameCount) => {
  if (eldoradoForwardLoopSymbols.has(symbol)) {
    return tick % frameCount;
  }
  return getPingPongFrameIndex(tick, frameCount);
};

const getHighlightedWinFrames = (symbol) => {
  if (eldoradoSpecialSymbols.has(symbol)) {
    return eldoradoSpecialWinFrames[symbol] ?? null;
  }
  return eldoradoWinFrames[symbol] ?? null;
};

const getFrameDurationMs = (symbol, frameCount) => {
  if (eldoradoSpecialFrameMs[symbol]) return eldoradoSpecialFrameMs[symbol];
  if (frameCount <= 1) return ELDORADO_WIN_FRAME_MS;
  return Math.max(
    ELDORADO_WIN_FRAME_MS,
    Math.round(ELDORADO_WIN_CYCLE_MS / (frameCount * 2 - 2)),
  );
};

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
      diceCellBackgrounds,
      eldoradoCellBackgrounds,
      eldoradoStatic,
      eldoradoWinFrames,
      eldoradoSpecialWinFrames,
      COMBO_BORDERS,
      VIDEO_DICE_SHINE_SPRITE,
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
            highlighted={isSettled && eldoradoWinningCells.has(cell.coord)}
            comboBorder={
              isSettled && activeComboBorderCells.has(cell.coord)
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
  const [animationFrameTick, setAnimationFrameTick] = useState(0);
  const image = eldoradoStatic[symbol];
  const imageSrc = typeof image === "string" ? image : image?.src;
  const imageClass = typeof image === "string" ? "" : (image?.className ?? "");
  const isCroppedImage = typeof image === "object" && image?.crop;
  const winFrames =
    ((highlighted || animated) && getHighlightedWinFrames(symbol)) ||
    null;
  const frameCycleLength = winFrames?.length > 1
    ? eldoradoForwardLoopSymbols.has(symbol)
      ? winFrames.length
      : winFrames.length * 2 - 2
    : 1;
  const frameDurationMs = winFrames?.length > 1
    ? getFrameDurationMs(symbol, winFrames.length)
    : ELDORADO_WIN_FRAME_MS;

  useEffect(() => {
    setAnimationFrameTick(0);
    if (!winFrames || frameCycleLength <= 1) return undefined;
    const interval = window.setInterval(() => {
      setAnimationFrameTick((tick) => (tick + 1) % frameCycleLength);
    }, frameDurationMs);
    return () => window.clearInterval(interval);
  }, [
    animationKey,
    frameCycleLength,
    frameDurationMs,
    symbol,
    Boolean(winFrames),
  ]);

  const frameIndex =
    winFrames?.length > 1
      ? getEldoradoFrameIndex(symbol, animationFrameTick, winFrames.length)
      : 0;
  const isDice = symbol >= 1 && symbol <= 6;
  const backgroundSrc = isDice
    ? diceCellBackgrounds[symbol]
    : eldoradoCellBackgrounds[symbol];

  return (
    <div
      className={`eldorado-cell${isDice ? " --dice" : ""}${highlighted || animated ? " --glow" : ""}${isDice && (highlighted || animated) ? " --dice-video-selected" : ""}${dimmed ? " --opacity" : ""}`}
    >
      <div className="eldorado-cell__container">
        {backgroundSrc && (
          <img
            alt=""
            aria-hidden="true"
            className="eldorado-cell__background"
            src={backgroundSrc}
          />
        )}
        {comboBorder && (
          <img
            alt=""
            aria-hidden="true"
            className="eldorado-cell__combo-border"
            src={comboBorder}
          />
        )}
        {isDice && (highlighted || animated) && (
          <span className="eldorado-cell__video-dice" aria-hidden="true" />
        )}
        {winFrames?.length > 1 ? (
          <span className="eldorado-cell__animation" aria-label="image">
            <img
              alt=""
              aria-hidden="true"
              src={
                winFrames[frameIndex]
              }
              className={`eldorado-cell__item --${symbol} --frame`}
            />
          </span>
        ) : imageSrc && isCroppedImage ? (
          <span
            aria-label="image"
            className={`eldorado-cell__item --${symbol}${isDice ? " --dice" : ""}${imageClass}`}
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
