import SymbolIcon from "./SymbolIcon.jsx";

const rows = ["A", "B", "C"];

export default function LotteryGrid({ grid, revealKey = 0, visualMode, winningCells = [], scatterCells = [] }) {
  const marked = new Set([...winningCells, ...scatterCells]);

  return (
    <section className="lottery-machine">
      <div className="machine-title">
        <span>LOTO</span>
        <strong>Hiranmandi Hushhol</strong>
      </div>
      <div className={`lottery-board${visualMode ? " visual-board" : ""}`}>
        <div className="column-head" />
        {[1, 2, 3, 4, 5].map((column) => (
          <div className="column-head" key={column}>
            {column}
          </div>
        ))}
        {rows.map((row, rowIndex) => (
          <Row key={row} row={row} rowIndex={rowIndex} revealKey={revealKey} values={grid[row]} visualMode={visualMode} marked={marked} />
        ))}
        <div className="row-head">D</div>
        {grid.D.map((value, index) => (
          <div className={`grid-cell cell-reveal modifier${value === "SCATTER" ? " bonus-scatter" : ""}`} key={`D${index}-${revealKey}`} style={{ "--cell-delay": `${520 + index * 90}ms` }}>
            {value === "SCATTER" ? "" : value}
          </div>
        ))}
      </div>
    </section>
  );
}

function Row({ row, rowIndex, revealKey, values, visualMode, marked }) {
  return (
    <>
      <div className="row-head">{row}</div>
      {values.map((value, index) => {
        const coord = `${row}${index + 1}`;
        const delay = rowIndex * 90 + index * 120;
        return (
          <div className={`grid-cell cell-reveal${marked.has(coord) ? " highlighted" : ""}`} key={`${coord}-${revealKey}`} style={{ "--cell-delay": `${delay}ms` }}>
            {visualMode ? <SymbolIcon value={value} large /> : value}
          </div>
        );
      })}
    </>
  );
}
