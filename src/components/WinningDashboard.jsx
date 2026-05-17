import React, { useMemo } from "react";
import { paytable } from "../data/mockData.js";
import "./WinningDashboard.css";

const COLUMNS = ["x1", "x2", "x3", "x4", "x5"];

function formatAmount(value) {
  if (value == null || value === "") return "";
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getLineCount(selectedCombination) {
  const lineCount = selectedCombination?.groups?.length;
  if (Number.isFinite(lineCount) && lineCount > 0) return lineCount;

  const title = Number(selectedCombination?.title ?? selectedCombination?.id);
  return Number.isFinite(title) && title > 0 ? title : 3;
}

function buildTableData(stake, selectedCombination) {
  const normalizedStake = Number(stake) || 0;
  const lineCount = getLineCount(selectedCombination);
  const regularMultiplier = normalizedStake * 10 * (lineCount / 3);

  return paytable.map((row) => {
    const multiplier = row.symbol === 0 ? regularMultiplier * 9 : regularMultiplier;

    return COLUMNS.reduce(
      (nextRow, key) => ({
        ...nextRow,
        [key]: row[key] == null ? "" : formatAmount(row[key] * multiplier),
      }),
      { id: row.symbol },
    );
  });
}

export default function WinningsDashboard({
  stake = 10,
  selectedCombination,
  spinResult,
}) {
  const tableData = useMemo(
    () => buildTableData(stake, selectedCombination),
    [stake, selectedCombination],
  );
  const winSum = Number(spinResult?.WinSum ?? 0);

  return (
    <div className="main-container__right">
      <div className="winnings-table">
        <h2 className="winnings-table__title">Таблица выигрышей</h2>
        <table className="winnings-table__container">
          <thead>
            <tr>
              <th></th>
              {COLUMNS.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                {COLUMNS.map((column) => (
                  <td key={column}>{row[column]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="simple-info --opened">
        <div className="simple-info__icon"></div>
        <div className="simple-info__container">
          <span className="simple-info__loto --opacity">
            Лотерейная квитанция №{" "}
          </span>
          <span className="simple-info__draw">Тираж № 4585676</span>
          <div className="simple-info__wrapper">
            <span className="simple-info__text">
              {winSum > 0
                ? `Выигрыш: ${formatAmount(winSum)}`
                : "Данных нет. Купите билет."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
