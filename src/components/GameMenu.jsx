import { useLayoutEffect, useRef, useState } from "react";
import "./GameMenu.css";
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

export default function GameMenu({ onClose }) {
  const [showRules, setShowRules] = useState(false);
  const ruleBoxRefs = useRef([]);
  const ruleGridRefs = useRef([]);
  const ruleLabelRefs = useRef([]);

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
        const desiredLeft = gridRect.left + (gridRect.width - labelRect.width) / 2;
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
  }, [showRules]);

  if (showRules) {
    return (
      <section className="game-rules-screen" aria-label={"\u041f\u0440\u0430\u0432\u0438\u043b\u0430"}>
        <button
          className="game-rules-screen__close"
          type="button"
          aria-label={"\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043f\u0440\u0430\u0432\u0438\u043b\u0430"}
          onClick={onClose}
        >
          <img src="/img/ui/game-menu-close.png" alt="" />
        </button>
        <div className="game-rules-screen__content">
          <div className="game-rules-screen__intro">
            <h1>{'\u041f\u0420\u0410\u0412\u0418\u041b\u0410 \u0418\u0413\u0420\u042b'}</h1>
            <p>
              {'\u0412 \u0438\u0433\u0440\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f 9 \u0432\u044b\u0438\u0433\u0440\u044b\u0448\u043d\u044b\u0445 \u043b\u0438\u043d\u0438\u0439. \u0412\u044b\u0438\u0433\u0440\u044b\u0448 \u0432\u044b\u043f\u043b\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u043f\u043e \u0442\u0435\u043c \u043b\u0438\u043d\u0438\u044f\u043c, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u0430\u043a\u0442\u0438\u0432\u043d\u044b \u0432 \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u0441\u0442\u0430\u0432\u043a\u0435. \u041a\u0430\u0436\u0434\u0430\u044f \u0441\u0445\u0435\u043c\u0430 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442, \u043a\u0430\u043a\u0438\u0435 \u043f\u043e\u0437\u0438\u0446\u0438\u0438 \u0443\u0447\u0430\u0441\u0442\u0432\u0443\u044e\u0442 \u0432 \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044e\u0449\u0435\u0439 \u043b\u0438\u043d\u0438\u0438.'}
            </p>
          </div>
          <div className="game-rules-screen__boxes">
            {RULE_LINES.map((line, lineIndex) => (
              <div
                className="game-rules-screen__box"
                key={lineIndex}
                ref={(node) => {
                  ruleBoxRefs.current[lineIndex] = node;
                }}
                role="img"
                aria-label={`${"\u041b\u0438\u043d\u0438\u044f"} ${lineIndex + 1}`}
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
                  {lineIndex === 0
                    ? '\u0421\u0440\u0435\u0434\u043d\u044f\u044f \u0433\u043e\u0440\u0438\u0437\u043e\u043d\u0442\u0430\u043b\u044c'
                    : lineIndex === 1
                      ? '\u0412\u0435\u0440\u0445\u043d\u044f\u044f \u0433\u043e\u0440\u0438\u0437\u043e\u043d\u0442\u0430\u043b\u044c'
                      : lineIndex === 2
                        ? '\u041d\u0438\u0436\u043d\u044f\u044f \u0433\u043e\u0440\u0438\u0437\u043e\u043d\u0442\u0430\u043b\u044c'
                        : lineIndex === 3
                          ? 'V-\u043e\u0431\u0440\u0430\u0437\u043d\u0430\u044f \u043b\u0438\u043d\u0438\u044f'
                          : lineIndex === 4
                      ? '\u041f\u0435\u0440\u0435\u0432\u0451\u0440\u043d\u0443\u0442\u0430\u044f V-\u043e\u0431\u0440\u0430\u0437\u043d\u0430\u044f'
                      : lineIndex === 5
                        ? '\u0412\u0435\u0440\u0445\u043d\u044f\u044f \u0434\u0443\u0433\u0430'
                        : lineIndex === 6
                          ? '\u041d\u0438\u0436\u043d\u044f\u044f \u0434\u0443\u0433\u0430'
                          : lineIndex === 7
                            ? '\u041d\u0438\u0441\u0445\u043e\u0434\u044f\u0449\u0430\u044f \u0434\u0438\u0430\u0433\u043e\u043d\u0430\u043b\u044c'
                            : '\u0412\u043e\u0441\u0445\u043e\u0434\u044f\u0449\u0430\u044f \u0434\u0438\u0430\u0433\u043e\u043d\u0430\u043b\u044c'}
                </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      className="game-menu-layer"
      role="presentation"
      onClick={onClose}
    >
      <nav
        className="game-menu-panel"
        aria-label={"\u0418\u0433\u0440\u043e\u0432\u043e\u0435 \u043c\u0435\u043d\u044e"}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="game-menu-panel__close"
          type="button"
          aria-label={"\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e"}
          onClick={onClose}
        >
          <img src="/img/ui/game-menu-close.png" alt="" />
        </button>
        <button type="button">{'\u0418\u0421\u0422\u041e\u0420\u0418\u042f \u0422\u0418\u0420\u0410\u0416\u0415\u0419'}</button>
        <button type="button" onClick={() => setShowRules(true)}>
          {'\u041f\u0420\u0410\u0412\u0418\u041b\u0410'}
        </button>
      </nav>
    </div>
  );
}
