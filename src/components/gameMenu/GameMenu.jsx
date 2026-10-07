import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../i18n";
import "./GameMenu.css";
const RULES_COPY = {
  ru: {
    title: "ПРАВИЛА ИГРЫ",
    fruitsDescription: "В игре используется 5 выигрышных линий. Каждая схема показывает позиции символов, участвующие в соответствующей выигрышной линии.",
    description:
      "В игре используется 9 выигрышных линий. Выигрыш выплачивается только по тем линиям, которые активны в текущей ставке. Каждая схема показывает, какие позиции участвуют в соответствующей линии.",
    lineNames: [
      "Средняя горизонталь",
      "Верхняя горизонталь",
      "Нижняя горизонталь",
      "V-образная линия",
      "Перевёрнутая V-образная",
      "Верхняя дуга",
      "Нижняя дуга",
      "Нисходящая диагональ",
      "Восходящая диагональ",
    ],
    rulesLabel: "Правила",
    closeRulesLabel: "Закрыть правила",
    lineLabel: "Линия",
    payoutTitle: '\u041a\u043e\u044d\u0444\u0444\u0438\u0446\u0438\u0435\u043d\u0442\u044b \u0432\u044b\u043f\u043b\u0430\u0442',
    payoutSymbolHeader: '\u0421\u0438\u043c\u0432\u043e\u043b',
    payoutEmptyValue: '-',
    menuLabel: "Игровое меню",
    closeMenuLabel: "Закрыть меню",
    historyButton: "ИСТОРИЯ ТИРАЖЕЙ",
    rulesButton: "ПРАВИЛА",
  },
  tg: {
    title: "ҚОИДАҲОИ БОЗӢ",
    fruitsDescription: "Дар бозӣ 5 хатти бурднок истифода мешавад. Ҳар як схема мавқеъҳои рамзҳоеро нишон медиҳад, ки дар хатти бурдноки мувофиқ иштирок мекунанд.",
    description:
      "Дар бозӣ 9 хатти бурднок истифода мешавад. Бурд танҳо аз рӯи он хатҳое пардохт карда мешавад, ки дар шарти ҷорӣ фаъол мебошанд. Ҳар як схема нишон медиҳад, ки кадом мавқеъҳо ба хатти мувофиқ дохил мешаванд.",
    lineNames: [
      "Хати уфуқии миёна",
      "Хати уфуқии боло",
      "Хати уфуқии поён",
      "Хати V-шакл",
      "Хати V-шакли баръакс",
      "Камони боло",
      "Камони поён",
      "Диагонали поёнрав",
      "Диагонали болорав",
    ],
    rulesLabel: "Қоидаҳо",
    closeRulesLabel: "Пӯшидани қоидаҳо",
    lineLabel: "Хат",
    payoutTitle: '\u041a\u043e\u044d\u0444\u0444\u0438\u0442\u0441\u0438\u0435\u043d\u0442\u04b3\u043e\u0438 \u043f\u0430\u0440\u0434\u043e\u0445\u0442',
    payoutSymbolHeader: '\u0420\u0430\u043c\u0437',
    payoutEmptyValue: '-',
    menuLabel: "Менюи бозӣ",
    closeMenuLabel: "Пӯшидани меню",
    historyButton: "ТАЪРИХИ ТИРОЖҲО",
    rulesButton: "ҚОИДАҲО",
  },
};
function RulesPayoutTable({ copy, view }) {
  if (!view?.rows?.length || !view?.columns?.length) return null;

  return (
    <section className='game-rules-screen__payouts' aria-label={copy.payoutTitle}>
      <h2>{copy.payoutTitle}</h2>
      <div className='game-rules-screen__payout-table-wrap'>
        <table className='game-rules-screen__payout-table'>
          <thead>
            <tr>
              <th scope='col'>{copy.payoutSymbolHeader}</th>
              {view.columns.map((column) => (
                <th scope='col' key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr key={row.symbol}>
                <th scope='row'>{row.symbol}</th>
                {row.values.map((value, index) => (
                  <td key={String(row.symbol) + '-' + view.columns[index]}>
                    {value || copy.payoutEmptyValue}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const RULE_LINES = [
  [5, 6, 7, 8, 9],
  [0, 1, 2, 3, 4],
  [10, 11, 12, 13, 14],
  [0, 6, 12, 8, 4],
  [10, 6, 2, 8, 14],
  [5, 1, 2, 3, 9],
  [5, 11, 12, 13, 9],
  [0, 1, 7, 13, 14],
  [10, 11, 7, 3, 4],
];

export default function GameMenu({ gameId, onClose, paytableView }) {
  const { language } = useLanguage();
  const rulesCopy = RULES_COPY[language] ?? RULES_COPY.ru;
  const [showRules, setShowRules] = useState(false);
  const ruleBoxRefs = useRef([]);
  const ruleGridRefs = useRef([]);
  const ruleLabelRefs = useRef([]);
  const ruleLines = gameId === "fruits" ? RULE_LINES.slice(0, 5) : RULE_LINES;

  useLayoutEffect(() => {
    if (!showRules) return undefined;

    const alignLabels = () => {
      const labels = ruleLabelRefs.current.filter(Boolean);
      if (!labels.length) return;

      labels.forEach((label) => {
        label.style.fontSize = "";
        label.style.transform = "";
      });

      const baseFontSize = Number.parseFloat(
        window.getComputedStyle(labels[0]).fontSize,
      );
      const uniformScale = labels.reduce((scale, label, index) => {
        const box = ruleBoxRefs.current[index];
        if (!box) return scale;
        const availableWidth = box.clientWidth - 32;
        return Math.min(scale, availableWidth / label.scrollWidth);
      }, 1);
      const uniformFontSize = Math.max(6, baseFontSize * uniformScale);

      labels.forEach((label, index) => {
        const box = ruleBoxRefs.current[index];
        const grid = ruleGridRefs.current[index];
        if (!box || !grid) return;

        label.style.fontSize = `${uniformFontSize}px`;
        const boxRect = box.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();
        const desiredLeft =
          gridRect.left + (gridRect.width - labelRect.width) / 2;
        const minimumLeft = boxRect.left + 16;
        const maximumLeft = boxRect.right - 16 - labelRect.width;
        const clampedLeft = Math.min(
          Math.max(desiredLeft, minimumLeft),
          maximumLeft,
        );

        label.style.transform = `translateX(${clampedLeft - desiredLeft}px)`;
      });
    };

    alignLabels();
    const observer = new ResizeObserver(alignLabels);
    ruleBoxRefs.current.filter(Boolean).forEach((box) => observer.observe(box));
    window.addEventListener("resize", alignLabels);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", alignLabels);
    };
  }, [gameId, language, showRules]);

  if (showRules) {
    return createPortal(
      <section
        className="game-rules-screen"
        data-game-id={gameId}
        aria-label={rulesCopy.rulesLabel}
      >
        <button
          className="game-rules-screen__close"
          type="button"
          aria-label={rulesCopy.closeRulesLabel}
          onClick={onClose}
        >
          <img src="/img/ui/game-menu-close.png" alt="" />
        </button>
        <div className="game-rules-screen__content">
          <div className="game-rules-screen__intro">
            <h1>{rulesCopy.title}</h1>
            <p>{gameId === "fruits" ? rulesCopy.fruitsDescription : rulesCopy.description}</p>
          </div>
          <div className="game-rules-screen__boxes">
            {ruleLines.map((line, lineIndex) => (
              <div
                className="game-rules-screen__box"
                key={lineIndex}
                ref={(node) => {
                  ruleBoxRefs.current[lineIndex] = node;
                }}
                role="img"
                aria-label={`${rulesCopy.lineLabel} ${lineIndex + 1}`}
              >
                <div className="game-rules-screen__diagram">
                  <div className="game-rules-screen__line-number">
                    {lineIndex + 1}
                  </div>
                  <div
                    className="game-rules-screen__grid"
                    ref={(node) => {
                      ruleGridRefs.current[lineIndex] = node;
                    }}
                  >
                    {Array.from({ length: 15 }, (_, cellIndex) => (
                      <span
                        className={`game-rules-screen__cell${line.includes(cellIndex) ? " game-rules-screen__cell--highlighted" : ""}`}
                        key={cellIndex}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p
                    className="game-rules-screen__box-label"
                    ref={(node) => {
                      ruleLabelRefs.current[lineIndex] = node;
                    }}
                  >
                    {rulesCopy.lineNames[lineIndex]}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <RulesPayoutTable copy={rulesCopy} view={paytableView} />
        </div>
      </section>,
      document.body,
    );
  }

  return createPortal(
    <div className="game-menu-layer" role="presentation" onClick={onClose}>
      <nav
        className="game-menu-panel"
        aria-label={rulesCopy.menuLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="game-menu-panel__close"
          type="button"
          aria-label={rulesCopy.closeMenuLabel}
          onClick={onClose}
        >
          <img src="/img/ui/game-menu-close.png" alt="" />
        </button>
        <button type="button">{rulesCopy.historyButton}</button>
        <button type="button" onClick={() => setShowRules(true)}>
          {rulesCopy.rulesButton}
        </button>
      </nav>
    </div>,
    document.body,
  );
}
