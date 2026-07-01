import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { getTicketWinAmount } from "../utils/gameResult.js";
import {
  PAYOUT_COLUMNS,
  PAYOUT_ROWS,
  formatPayoutValue,
  getCombinationNumber,
  getPayoutMultiplier,
} from "../utils/payoutTable.js";
import "./WinningDashboard.css";
import { useLanguage } from "../i18n.jsx";

const COLUMNS = PAYOUT_COLUMNS.map((label, index) => ({
  className: `--x${index + 1}`,
  label,
}));

function formatAmount(value) {
  if (value == null || value === "") return "";
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function fitMessageFontSize(text, baseSize, minSize, fullSizeLength) {
  const length = String(text ?? "").length;
  if (length <= fullSizeLength) return baseSize;

  return Math.max(minSize, Math.floor((baseSize * fullSizeLength) / length));
}

const getLineCount = getCombinationNumber;

function buildMessageRows(
  stake,
  selectedCombination,
  spinResult,
  doublingState,
  revealComplete,
  t,
) {
  const lineCount = getLineCount(selectedCombination);
  const winSum = getTicketWinAmount(spinResult, doublingState);
  const canShowWinAmounts =
    winSum > 0 &&
    (revealComplete ||
      doublingState?.entered ||
      Boolean(doublingState?.lastStatus));

  if (doublingState?.lastStatus === "lose") {
    return [
      [t("win"), formatAmount(0)],
      [t("possibleWin"), formatAmount(0)],
    ];
  }

  if (canShowWinAmounts) {
    return [
      [t("currentWin"), formatAmount(winSum)],
      [t("possibleWin"), formatAmount(winSum * 2)],
    ];
  }

  return [
    [t("draw"), spinResult?.idCard ?? "-"],
    [t("purchaseAmount"), `${formatAmount(stake * lineCount)}`],
    [],
  ];
}

function buildTableData(stake, selectedCombination) {
  const payoutMultiplier = getPayoutMultiplier(stake, selectedCombination);

  return PAYOUT_ROWS.map((row) => ({
    id: row.symbol,
    values: row.values.map((value) =>
      formatPayoutValue(value, payoutMultiplier),
    ),
  }));
}

export default function WinningsDashboard({
  stake = 10,
  selectedCombination,
  spinResult,
  doublingState,
  revealComplete = true,
}) {
  const { t } = useLanguage();
  const tableData = useMemo(
    () => buildTableData(stake, selectedCombination),
    [stake, selectedCombination],
  );
  const messageRows = useMemo(
    () =>
      buildMessageRows(
        stake,
        selectedCombination,
        spinResult,
        doublingState,
        revealComplete,
        t,
      ),
    [stake, selectedCombination, spinResult, doublingState, revealComplete, t],
  );
  const messageSignature = useMemo(
    () =>
      messageRows.map(([label, value]) => `${label}:${value ?? ""}`).join("|"),
    [messageRows],
  );
  const messageBoxRef = useRef(null);
  const [messageFit, setMessageFit] = useState({
    signature: messageSignature,
    scale: 1,
  });

  useLayoutEffect(() => {
    const box = messageBoxRef.current;
    if (!box) return;

    if (messageFit.signature !== messageSignature) {
      setMessageFit({ signature: messageSignature, scale: 1 });
      return;
    }

    const hasOverflow =
      box.scrollHeight > box.clientHeight + 1 ||
      box.scrollWidth > box.clientWidth + 1;

    if (hasOverflow && messageFit.scale > 0.28) {
      setMessageFit((current) => ({
        ...current,
        scale: Math.max(0.28, current.scale * 0.88),
      }));
    }
  }, [messageFit, messageSignature]);

  return (
    <div>
      <div className="winnings-table">
        <h2 className="winnings-table__title">{t("winningsTable")}</h2>
        <table className="winnings-table__container">
          <colgroup>
            <col className="winnings-table__col --symbol" />
            {COLUMNS.map((column) => (
              <col
                className={`winnings-table__col ${column.className}`}
                key={column.label}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th></th>
              {COLUMNS.map((column) => (
                <th key={column.label}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                {COLUMNS.map((column, index) => (
                  <td key={column.label}>{row.values[index]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* <div className="msg_box" ref={messageBoxRef}>
        {messageRows.map(([label, value], index) => {
          const labelFontSize = Math.max(
            5,
            fitMessageFontSize(label, 14, 8, 42) * messageFit.scale,
          );
          const valueFontSize = Math.max(
            7,
            fitMessageFontSize(value, 22, 10, 18) * messageFit.scale,
          );

          return (
            <div
              className="msg_box__row"
              key={`${label ?? "empty"}-${index}`}
              style={{
                "--msg-label-font-size": `${labelFontSize}px`,
                "--msg-value-font-size": `${valueFontSize}px`,
              }}
            >
              <span className="msg_box__label">{label}</span>
              <span className="msg_box__value">{value}</span>
            </div>
          );
        })}
        <p>{t("lotteryConsent")}</p>
      </div> */}
    </div>
  );
}
