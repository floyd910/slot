const FREE_SPINS_PROMPT_LINES = [
  "\u0414\u043b\u044f \u043d\u0430\u0447\u0430\u043b\u0430 \u0440\u043e\u0437\u044b\u0433\u0440\u044b\u0448\u0430",
  "15 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0445 \u043b\u043e\u0442\u0435\u0440\u0435\u0439\u043d\u044b\u0445 \u043a\u0432\u0438\u0442\u0430\u043d\u0446\u0438\u0439",
  "\u043d\u0430\u0436\u043c\u0438\u0442\u0435 \u043d\u0430 \u043a\u043d\u043e\u043f\u043a\u0443 \"\u0423\u0447\u0430\u0441\u0442\u0432\u043e\u0432\u0430\u0442\u044c \u0432 \u0442\u0438\u0440\u0430\u0436\u0435\"",
];

export default function FreeSpinsPrompt() {
  return (
    <div className="free-spins-modal" role="dialog" aria-modal="true">
      <div className="free-spins-modal__card">
        <p className="free-spins-modal__text">
          {FREE_SPINS_PROMPT_LINES.map((line, index) => (
            <span key={line}>
              {line}
              {index < FREE_SPINS_PROMPT_LINES.length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
