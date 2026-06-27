import { useEffect } from "react";
import "./Paytable.css";
import { useLanguage } from "../i18n.jsx";

const BASE_STAKE = 0.1;
const PAYOUT_COLUMNS = ["x", "x2", "x3", "x4", "x5"];

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

const PAYOUT_ROWS = [
  { symbol: 0, values: [null, 0.2, 0.5, 2, 50] },
  { symbol: 1, values: [null, 0.2, 0.5, 2.5, 10] },
  { symbol: 2, values: [null, null, 0.5, 2.5, 10] },
  { symbol: 3, values: [null, null, 0.5, 2.5, 10] },
  { symbol: 4, values: [null, null, 0.5, 2.5, 10] },
  { symbol: 5, values: [null, null, 1, 5, 12.5] },
  { symbol: 6, values: [null, null, 1, 5, 12.5] },
  { symbol: 7, values: [null, null, 1.5, 7.5, 25] },
  { symbol: 8, values: [null, null, 1.5, 7.5, 25] },
  { symbol: 9, values: [null, null, 2, 10, 40] },
  { symbol: 10, values: [null, 0.2, 2.5, 12.5, 75] },
  { symbol: 11, values: [null, 0.2, 2.5, 12.5, 75] },
  { symbol: 12, values: [null, 1, 25, 250, 900] },
];

const FALLBACK_GROUPS = {
  1: [["B1", "B2", "B3", "B4", "B5"]],
  3: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["B1", "B2", "B3", "B4", "B5"],
    ["C1", "C2", "C3", "C4", "C5"],
  ],
  5: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["B1", "B2", "B3", "B4", "B5"],
    ["C1", "C2", "C3", "C4", "C5"],
    ["A1", "B2", "C3", "B4", "A5"],
    ["C1", "B2", "A3", "B4", "C5"],
  ],
  7: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["B1", "B2", "B3", "B4", "B5"],
    ["C1", "C2", "C3", "C4", "C5"],
    ["A1", "B2", "C3", "B4", "A5"],
    ["C1", "B2", "A3", "B4", "C5"],
    ["B1", "A2", "A3", "A4", "B5"],
    ["B1", "C2", "C3", "C4", "B5"],
  ],
  9: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["B1", "B2", "B3", "B4", "B5"],
    ["C1", "C2", "C3", "C4", "C5"],
    ["A1", "B2", "C3", "B4", "A5"],
    ["C1", "B2", "A3", "B4", "C5"],
    ["B1", "A2", "A3", "A4", "B5"],
    ["B1", "C2", "C3", "C4", "B5"],
    ["A1", "A2", "B3", "C4", "C5"],
    ["C1", "C2", "B3", "A4", "A5"],
  ],
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getCombinationNumber = (selectedCombination) => {
  const groupCount = selectedCombination?.groups?.length;
  if (Number.isFinite(groupCount) && groupCount > 0) return groupCount;

  const title = Number(selectedCombination?.title);
  if (Number.isFinite(title) && title > 0) return title;

  const id = Number(selectedCombination?.id);
  return Number.isFinite(id) && id > 0 ? id : 1;
};

const getCombinationGroups = (selectedCombination, combinationNumber) => {
  if (Array.isArray(selectedCombination?.groups) && selectedCombination.groups.length > 0) {
    return selectedCombination.groups;
  }

  return FALLBACK_GROUPS[combinationNumber] ?? FALLBACK_GROUPS[1];
};

const formatStake = (stake) => toNumber(stake, BASE_STAKE).toFixed(2);

const formatPayout = (baseValue, multiplier) => {
  if (baseValue == null) return "";
  return (baseValue * multiplier).toFixed(2);
};

const formatGroup = (group) => group.join("-");

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
  stake = BASE_STAKE,
  selectedCombination,
  onClose,
}) {
  const { language, t } = useLanguage();
  const copy = PAYTABLE_COPY[language] ?? PAYTABLE_COPY.ru;
  const stakeValue = toNumber(stake, BASE_STAKE);
  const combinationNumber = getCombinationNumber(selectedCombination);
  const combinationGroups = getCombinationGroups(
    selectedCombination,
    combinationNumber,
  );
  const payoutMultiplier = (stakeValue / BASE_STAKE) * combinationNumber;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <section className="info-modal" aria-label={copy.title}>
      {loading && <div className="info-paytable-state">{t("loading")}</div>}
      {error && <div className="info-paytable-state --error">{error}</div>}
      {!loading && !error && (
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
                        {formatStake(stakeValue)}
                      </td>
                      <td className="info-paytable__merged" rowSpan={PAYOUT_ROWS.length}>
                        {combinationNumber}
                      </td>
                      <td className="info-paytable__merged --groups" rowSpan={PAYOUT_ROWS.length}>
                        {combinationGroups.map((group) => (
                          <span key={formatGroup(group)}>{formatGroup(group)}</span>
                        ))}
                      </td>
                    </>
                  )}
                  <td className="info-paytable__symbol">{row.symbol}</td>
                  {row.values.map((value, valueIndex) => (
                    <td className="info-paytable__value" key={`${row.symbol}-${PAYOUT_COLUMNS[valueIndex]}`}>
                      {formatPayout(value, payoutMultiplier)}
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