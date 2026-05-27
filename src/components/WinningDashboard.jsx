import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
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

function fitMessageFontSize(text, baseSize, minSize, fullSizeLength) {
  const length = String(text ?? "").length;
  if (length <= fullSizeLength) return baseSize;

  return Math.max(minSize, Math.floor((baseSize * fullSizeLength) / length));
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
  revealComplete,
) {
  const lineCount = getLineCount(selectedCombination);
  const totalBet = Number(stake || 0) * lineCount;
  const winSum = Number(spinResult?.WinSum ?? 0);
  const canShowWinAmounts =
    winSum > 0 &&
    (revealComplete ||
      doublingState?.entered ||
      Boolean(doublingState?.lastStatus));

  if (doublingState?.lastStatus === "lose") {
    return [
      ["ВЫИГРЫШ", formatAmount(0)],
      ["ВОЗМОЖНЫЙ ВЫИГРЫШ", formatAmount(0)],
    ];
  }

  if (canShowWinAmounts) {
    return [
      ["ТЕКУШИЙ ВЫИГРЫШ", formatAmount(winSum)],
      ["ВОЗМОЖНЫЙ ВЫИГРЫШ", formatAmount(winSum * 2)],
    ];
  }

  return [
    ["ТИРАЖ", spinResult?.idCard ?? "-"],
    ["СУММА ПОКУПКИ", `${formatAmount(stake * lineCount)}`],
    [],
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
  revealComplete = true,
}) {
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
      ),
    [stake, selectedCombination, spinResult, doublingState, revealComplete],
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

      <div className="msg_box" ref={messageBoxRef}>
        {messageRows.map(([label, value]) => {
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
              key={label}
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
        <p>
          Выбирая лотерейную комбинацию и совершая лотерейную ставку, Вы
          подтверждаете цвое согласие с действующими правилами проведения
          лотереии.
        </p>
      </div>
    </div>
  );
}
