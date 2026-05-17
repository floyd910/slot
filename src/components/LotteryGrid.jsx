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

export default function LotteryGrid({ grid, revealKey = 0, animationState = "idle", visualMode, winningCells = [], scatterCells = [], doublingState }) {
  const marked = new Set([...winningCells, ...scatterCells]);
  const hasMarkedCells = marked.size > 0;
  const isRevealing = animationState === "revealing";
  const isSettled = animationState === "settled";
  const topCells = rows.flatMap((row) => (grid[row] ?? []).map((value, index) => ({ value, coord: `${row}${index + 1}` })));
  const doublingMarks = doublingState?.marks ?? [];
  const hasDoublingMarks = doublingMarks.some(Boolean) || doublingState?.active || doublingState?.loading;
  const dRow = hasDoublingMarks ? doublingMarks : (grid.D ?? []);

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
                dimmed={isSettled && hasMarkedCells && !marked.has(cell.coord)}
                eraser={isRevealing}
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
                highlighted={hasDoublingMarks ? value === "x2" && index === doublingState.step - 1 : value === "SCATTER"}
                dimmed={hasDoublingMarks ? index > doublingState.step : isSettled && value !== "SCATTER" && scatterCells.length > 0}
                eraser={hasDoublingMarks ? doublingState.changedIndex === index && Boolean(value) : isRevealing}
                loading={hasDoublingMarks && doublingState.loading && index === doublingState.step}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scoreboard-wrapper --eldorado-view">
      <div className="eldorado-scoreboard">
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
    <div className={`carpet-nice${animationState === "idle" || animationState === "settled" ? " carpet-nice__hidden" : ""}`}>
      <div className={`carpet-nice__item${isSpinning ? " --close" : ""}${isRevealing ? " --open" : ""}`} />
      <div className={`carpet-nice__roll${isSpinning ? " --close" : ""}${isRevealing ? " --open" : ""}`} />
    </div>
  );
}

function EldoradoCell({ digit, animated = false, dimmed = false, showFire = false }) {
  const symbol = normalizeEldoradoDigit(digit);
  const image = animated ? eldoradoAnim[symbol] : eldoradoStatic[symbol];

  return (
    <div className={`eldorado-cell${animated ? " --glow" : ""}${dimmed ? " --opacity" : ""}${showFire ? " --fire" : ""}`}>
      <div className="eldorado-cell__container">
        <img alt="image" src={`https://lotogame.lotosport.tj/img/${image}`} className={`eldorado-cell__item --${symbol}`} />
      </div>
    </div>
  );
}

function GoldCell({ digit, idxNumber, idxString, showFlame = false, size = "", highlighted = false, dimmed = false, eraser = false, loading = false }) {
  const isScatter = digit === "SCATTER";
  const isDoublingMark = typeof digit === "string" && /^x[02]$/i.test(digit);
  const eraserClass = eraser ? eraserPhase(idxNumber, size) : "";
  const showClass = eraser ? "" : " --show";
  const displayDigit = Number(digit) === 10 ? 11 : digit;

  return (
    <div className={`gold-cell${size === "small" ? " --small" : ""}${dimmed ? " --opacity" : ""}`}>
      <div className={`gold-cell__wrapper${highlighted ? " --glow" : ""}${dimmed ? " --opacity" : ""}`}>
        <div className="gold-cell__container" />
        <div className={`gold-cell__img${showClass}${eraserClass ? ` ${eraserClass}` : ""}${isScatter ? " --stepFire" : ""}`}>
          {!loading && !isScatter && (
            <div className={`gold-cell__item${isDoublingMark ? " --doubling" : ""}`}>{displayDigit}</div>
          )}
        </div>
      </div>
      {idxNumber < 5 && <div className="gold-cell__idx-number">{idxNumber + 1}</div>}
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
  return ["--first", "--second", "--third", "--fourth", "--fifth"][column] ?? "--first";
}

function normalizeEldoradoDigit(value) {
  if (value === "SCATTER") return 10;
  const digit = Number(value);
  return Number.isFinite(digit) && digit >= 0 && digit <= 10 ? digit : 0;
}
