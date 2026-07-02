import { useMemo } from "react";
import { useLanguage } from "../i18n.jsx";
import {
  WINNING_DASHBOARD_COLUMNS,
  buildWinningDashboardRows,
} from "../viewModels/winningDashboardViewModel.js";
import "./WinningDashboard.css";

export default function WinningsDashboard({ stake = 10, selectedCombination }) {
  const { t } = useLanguage();
  const tableRows = useMemo(
    () => buildWinningDashboardRows(stake, selectedCombination),
    [stake, selectedCombination],
  );

  return (
    <div>
      <div className="payouts">
        <h2 className="payouts_title">{t("winningsTable")}</h2>
        <table>
          <thead>
            <tr>
              {WINNING_DASHBOARD_COLUMNS.map((column) => (
                <th key={column.label}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="payout-cell">{row.id}</div>
                </td>

                {WINNING_DASHBOARD_COLUMNS.map((column, index) => (
                  <td key={column.label}>
                    <div className="payout-cell">{row.values[index]}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
