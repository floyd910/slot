import { symbolMap } from "../data/mockData.js";

export default function SymbolIcon({ value, large = false }) {
  const symbol = symbolMap[value] ?? { label: String(value), role: "regular", color: "#ffffff" };
  const className = `symbol-icon symbol-${symbol.role}${large ? " symbol-large" : ""}`;

  return (
    <span className={className} style={{ "--symbol-color": symbol.color }} title={`${symbol.label} (${value})`}>
      <span className="symbol-mark">{symbol.label.slice(0, 2).toUpperCase()}</span>
    </span>
  );
}
