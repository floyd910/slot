import "./Paytable.css";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n.jsx";
import View2Paytable from "./View2Paytable.jsx";
import { useEscapeKey } from "../hooks/useEscapeKey.js";
import { BASE_PAYOUT_STAKE } from "../utils/payoutTable.js";
import { buildStandardPaytableViewModel } from "../viewModels/paytableViewModel.js";

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
  const { isLanguageChanging, language, t } = useLanguage();
  const copy = PAYTABLE_COPY[language] ?? PAYTABLE_COPY.ru;
  const view = buildStandardPaytableViewModel({ stake, selectedCombination });
  useEscapeKey(onClose);

  const modal = (
    <section
      className={`info-modal${visualMode ? " --view2" : ""}`}
      aria-label={copy.title}
    >
      <button
        className="info-modal__close"
        onClick={onClose}
        type="button"
        aria-label="Close info"
      >
        X
      </button>
      {loading && !isLanguageChanging && <div className="info-paytable-state">{t("loading")}</div>}
      {error && <div className="info-paytable-state --error">{error}</div>}
      {!loading && !error && visualMode && (
        <View2Paytable language={language} payoutMultiplier={view.payoutMultiplier} />
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
              {view.columns.map((column) => (
                <col className="info-paytable__payout-col" key={column} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th rowSpan="2">{renderLines(copy.stakeHeader)}</th>
                <th rowSpan="2">{renderLines(copy.combinationHeader)}</th>
                <th rowSpan="2">{renderLines(copy.groupsHeader)}</th>
                <th rowSpan="2">{renderLines(copy.symbolHeader)}</th>
                <th colSpan={view.columns.length}>{renderLines(copy.payoutHeader)}</th>
              </tr>
              <tr>
                {view.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.rows.map((row, index) => (
                <tr key={row.symbol}>
                  {index === 0 && (
                    <>
                      <td className="info-paytable__merged" rowSpan={view.rowSpan}>
                        {view.stakeLabel}
                      </td>
                      <td className="info-paytable__merged" rowSpan={view.rowSpan}>
                        {view.combinationNumber}
                      </td>
                      <td className="info-paytable__merged --groups" rowSpan={view.rowSpan}>
                        {view.groupLabels.map((groupLabel) => (
                          <span key={groupLabel}>{groupLabel}</span>
                        ))}
                      </td>
                    </>
                  )}
                  <td className="info-paytable__symbol">{row.symbol}</td>
                  {row.values.map((value, valueIndex) => (
                    <td className="info-paytable__value" key={`${row.symbol}-${view.columns[valueIndex]}`}>
                      {value}
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

  return createPortal(modal, document.body);
}
