import { useMemo } from "react";
import { useLanguage } from "../i18n.jsx";
import {
  WINNING_DASHBOARD_COLUMNS,
  buildWinningDashboardRows,
} from "../viewModels/winningDashboardViewModel.js";
import "./WinningDashboard.css";

export default function WinningsDashboard({
  stake = 10,
  selectedCombination,
}) {
  const { t } = useLanguage();
  const tableRows = useMemo(
    () => buildWinningDashboardRows(stake, selectedCombination),
    [stake, selectedCombination],
  );

  return (
    <div>
      <div className="winnings-table">
        <h2 className="winnings-table__title">{t("winningsTable")}</h2>
        <table className="winnings-table__container">
          <colgroup>
            <col className="winnings-table__col --symbol" />
            {WINNING_DASHBOARD_COLUMNS.map((column) => (
              <col
                className={`winnings-table__col ${column.className}`}
                key={column.label}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th></th>
              {WINNING_DASHBOARD_COLUMNS.map((column) => (
                <th key={column.label}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                {WINNING_DASHBOARD_COLUMNS.map((column, index) => (
                  <td key={column.label}>{row.values[index]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}