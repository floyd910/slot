import { useEffect } from "react";
import "./Paytable.css";
import { useLanguage } from "../i18n.jsx";
import View2Paytable from "./View2Paytable.jsx";
import {
  BASE_PAYOUT_STAKE,
  PAYOUT_COLUMNS,
  PAYOUT_ROWS,
  formatPayoutGroup,
  formatPayoutStake,
  formatPayoutValue,
  getCombinationGroups,
  getCombinationNumber,
  getPayoutMultiplier,
} from "../utils/payoutTable.js";

const PAYTABLE_COPY = {
  ru: {
    title: "Таблица выплат",
    stakeHeader: ["Номинал", "лотерейной ставки"],
    combinationHeader: ["Номер лотерейной", "комбинации"],
    groupsHeader: [
      "Группа координат основного",
      "игрового поля, составляющие",
      "лотерейную комбинацию",
    ],
    symbolHeader: ["Экран", "числового значения"],
    payoutHeader: [
      "Количество выпадений цифровых значений в одной группе",
      "координат лотерейной комбинации",
    ],
  },
  tg: {
    title: "Ҷадвали пардохтҳо",
    stakeHeader: ["Номинали", "шарти лотерея"],
    combinationHeader: ["Рақами комбинатсияи", "лотерея"],
    groupsHeader: [
      "Гурӯҳи координатҳои майдони",
      "асосии бозӣ, ки комбинатсияи",
      "лотереяро ташкил медиҳанд",
    ],
    symbolHeader: ["Экрани", "арзиши рақамӣ"],
    payoutHeader: [
      "Миқдори баромадани арзишҳои рақамӣ дар як гурӯҳи",
      "координатҳои комбинатсияи лотерея",
    ],
  },
};

const renderLines = (lines) =>
  lines.map((line, index) => (
    <span key={line}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ));

export default function Paytable({
  loading,
  error,
  visualMode = false,
  stake = BASE_PAYOUT_STAKE,
  selectedCombination,
  onClose,
}) {
  const { language, t } = useLanguage();
  const copy = PAYTABLE_COPY[language] ?? PAYTABLE_COPY.ru;
  const combinationNumber = getCombinationNumber(selectedCombination);
  const combinationGroups = getCombinationGroups(
    selectedCombination,
    combinationNumber,
  );
  const payoutMultiplier = getPayoutMultiplier(stake, selectedCombination);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <section
      className={`info-modal${visualMode ? " --view2" : ""}`}
      aria-label={copy.title}
    >
      {loading && <div className="info-paytable-state">{t("loading")}</div>}
      {error && <div className="info-paytable-state --error">{error}</div>}
      {!loading && !error && visualMode && (
        <View2Paytable language={language} payoutMultiplier={payoutMultiplier} />
      )}
      {!loading && !error && !visualMode && (
        <div className="info-paytable">
          <h2 className="info-paytable__title">{copy.title}</h2>
          <table className="info-paytable__table">
            <colgroup>
              <col className="info-paytable__stake-col" />
              <col className="info-paytable__combo-col" />
              <col className="info-paytable__groups-col" />
              <col className="info-paytable__symbol-col" />
              {PAYOUT_COLUMNS.map((column) => (
                <col className="info-paytable__payout-col" key={column} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th rowSpan="2">{renderLines(copy.stakeHeader)}</th>
                <th rowSpan="2">{renderLines(copy.combinationHeader)}</th>
                <th rowSpan="2">{renderLines(copy.groupsHeader)}</th>
                <th rowSpan="2">{renderLines(copy.symbolHeader)}</th>
                <th colSpan={PAYOUT_COLUMNS.length}>{renderLines(copy.payoutHeader)}</th>
              </tr>
              <tr>
                {PAYOUT_COLUMNS.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYOUT_ROWS.map((row, index) => (
                <tr key={row.symbol}>
                  {index === 0 && (
                    <>
                      <td className="info-paytable__merged" rowSpan={PAYOUT_ROWS.length}>
                        {formatPayoutStake(stake)}
                      </td>
                      <td className="info-paytable__merged" rowSpan={PAYOUT_ROWS.length}>
                        {combinationNumber}
                      </td>
                      <td className="info-paytable__merged --groups" rowSpan={PAYOUT_ROWS.length}>
                        {combinationGroups.map((group) => (
                          <span key={formatPayoutGroup(group)}>{formatPayoutGroup(group)}</span>
                        ))}
                      </td>
                    </>
                  )}
                  <td className="info-paytable__symbol">{row.symbol}</td>
                  {row.values.map((value, valueIndex) => (
                    <td className="info-paytable__value" key={`${row.symbol}-${PAYOUT_COLUMNS[valueIndex]}`}>
                      {formatPayoutValue(value, payoutMultiplier)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
