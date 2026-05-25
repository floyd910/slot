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

function buildMessageRows(
  stake,
  selectedCombination,
  spinResult,
  doublingState,
) {
  const lineCount = getLineCount(selectedCombination);
  const totalBet = Number(stake || 0) * lineCount;
  const winSum = Number(spinResult?.WinSum ?? 0);

  if (doublingState?.lastStatus === "lose") {
    return [
      ["Выигрыш", formatAmount(0)],
      ["Возможный выигрыш x2", formatAmount(0)],
    ];
  }

  if (winSum > 0) {
    return [
      ["Тираж", spinResult?.idCard ?? "-"],
      ["Выигрыш", formatAmount(winSum)],
      ["Возможный выигрыш x2", formatAmount(winSum * 2)],
    ];
  }

  return [
    ["Тираж", spinResult?.idCard ?? "-"],
    [
      "Сумма покупки",
      `${Number(formatAmount(Number(stake))) * Number(lineCount)}`,
    ],
    [
      "Выбирая лотерейную комбинацию и совершая лотерейную ставку, Вы подтверждаете цвое согласие с действующими правилами проведения лотереии.",
      null,
    ],
  ];
}

function buildTableData(stake, selectedCombination) {
  const normalizedStake = Number(stake) || 0;
  const lineCount = getLineCount(selectedCombination);

  return paytable.map((row) => {
    return COLUMNS.reduce(
      (nextRow, key) => ({
        ...nextRow,
        [key]:
          row[key] == null
            ? ""
            : formatAmount(row[key] * normalizedStake * lineCount),
      }),
      { id: row.symbol },
    );
  });
}

export default function WinningsDashboard({
  stake = 10,
  selectedCombination,
  spinResult,
  doublingState,
}) {
  const tableData = useMemo(
    () => buildTableData(stake, selectedCombination),
    [stake, selectedCombination],
  );
  const messageRows = useMemo(
    () =>
      buildMessageRows(stake, selectedCombination, spinResult, doublingState),
    [stake, selectedCombination, spinResult, doublingState],
  );

  return (
    <div>
      <div className="winnings-table">
        <h2 className="winnings-table__title">ТАБЛИЦА ВЫИГРЫШЕЙ</h2>
        <table className="winnings-table__container">
          <colgroup>
            <col className="winnings-table__col --symbol" />
            <col className="winnings-table__col --x1" />
            <col className="winnings-table__col --x2" />
            <col className="winnings-table__col --x3" />
            <col className="winnings-table__col --x4" />
            <col className="winnings-table__col --x5" />
          </colgroup>
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

      <div className="msg_box">
        {messageRows.map(([label, value]) => (
          <div className="msg_box__row" key={label}>
            <span className="msg_box__label">{label}</span>
            <span className="msg_box__value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
