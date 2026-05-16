import { useState } from "react";
import "./GameMenu.css";

export default function GameMenu({ history, onClose }) {
  const [view, setView] = useState("history");

  return (
    <div className="game-menu-layer" role="dialog" aria-modal="true" aria-label="Game history and rules">
      <div className="game-menu-panel">
        <div className="game-menu-head">
          <strong>Меню игры</strong>
          <button type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <div className="game-menu-tabs" role="tablist" aria-label="Game menu sections">
          <button className={view === "history" ? "active" : ""} type="button" role="tab" aria-selected={view === "history"} onClick={() => setView("history")}>
            История
          </button>
          <button className={view === "rules" ? "active" : ""} type="button" role="tab" aria-selected={view === "rules"} onClick={() => setView("rules")}>
            Правила
          </button>
        </div>
        <div className="game-menu-body">{view === "history" ? <HistoryView history={history} /> : <RulesView />}</div>
      </div>
    </div>
  );
}

function HistoryView({ history }) {
  return (
    <section className="game-menu-section">
      <h4>История спинов</h4>
      <div className="history-list">
        {history.length ? (
          history.map((item) => (
            <div key={`${item.id}-${item.time}`} className="history-row">
              <span>{item.time}</span>
              <strong>№ {item.id}</strong>
              <em>{item.combination}</em>
              <b>{Number(item.win).toFixed(2)}</b>
            </div>
          ))
        ) : (
          <p>Пока нет сыгранных тиражей.</p>
        )}
      </div>
    </section>
  );
}

function RulesView() {
  return (
    <section className="game-menu-section">
      <h4>Правила</h4>
      <ol className="rules-list">
        <li>Выберите комбинацию слева: 1, 3, 5 или 7 групп координат.</li>
        <li>Выберите ставку. Сумма покупки считается как ставка на каждую группу.</li>
        <li>После покупки билет участвует в тираже, а выигрыш считается по таблице выплат.</li>
        <li>Совпадение 4 одинаковых чисел в выбранной группе дает выигрыш по строке числа и колонке x4.</li>
        <li>Скаттеры запускают призовые спины с множителем x3, когда правило активируется в результате.</li>
        <li>После выигрыша можно забрать деньги или попробовать удвоение.</li>
      </ol>
    </section>
  );
}
