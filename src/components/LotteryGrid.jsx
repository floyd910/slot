import SymbolIcon from "./SymbolIcon.jsx";

const rows = ["A", "B", "C"];

export default function LotteryGrid({ grid, visualMode, winningCells = [], scatterCells = [] }) {
  const marked = new Set([...winningCells, ...scatterCells]);

  return (
    <section className={`lottery-board${visualMode ? " visual-board" : ""}`}>
      <div className="column-head" />
      {[1, 2, 3, 4, 5].map((column) => (
        <div className="column-head" key={column}>
          {column}
        </div>
      ))}
      {rows.map((row) => (
        <Row key={row} row={row} values={grid[row]} visualMode={visualMode} marked={marked} />
      ))}
      <div className="row-head">D</div>
      {grid.D.map((value, index) => (
        <div className={`grid-cell modifier ${value === "X0" ? "danger" : ""}`} key={`D${index}`}>
          {value}
        </div>
      ))}
    </section>
  );
}

function Row({ row, values, visualMode, marked }) {
  return (
    <>
      <div className="row-head">{row}</div>
      {values.map((value, index) => {
        const coord = `${row}${index + 1}`;
        return (
          <div className={`grid-cell${marked.has(coord) ? " highlighted" : ""}`} key={coord}>
            {visualMode ? <SymbolIcon value={value} large /> : value}
          </div>
        );
      })}
    </>
  );
}
