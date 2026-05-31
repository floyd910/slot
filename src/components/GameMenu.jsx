import { useState } from "react";
import "./GameMenu.css";
import { useLanguage } from "../i18n.jsx";

const rules = {
  ru: [
    "Выберите комбинацию слева: 1, 3, 5 или 7 групп координат.",
    "Выберите ставку. Сумма покупки считается как ставка на каждую группу.",
    "После покупки билет участвует в тираже, а выигрыш считается по таблице выплат.",
    "Совпадение 4 одинаковых чисел в выбранной группе дает выигрыш по строке числа и колонке x4.",
    "Скаттеры запускают призовые тиражи с множителем x3, когда правило активируется в результате.",
    "После выигрыша можно забрать деньги или попробовать удвоение.",
  ],
  tg: [
    "Комбинатсияро аз тарафи чап интихоб кунед: 1, 3, 5 ё 7 гурӯҳи координатҳо.",
    "Шартро интихоб кунед. Маблағи харид ҳамчун шарт барои ҳар як гурӯҳ ҳисоб мешавад.",
    "Пас аз харид билет дар тираж иштирок мекунад ва бурд аз рӯи ҷадвали пардохт ҳисоб мешавад.",
    "Мувофиқ омадани 4 рақами якхела дар гурӯҳи интихобшуда аз рӯи сатри рақам ва сутуни x4 бурд медиҳад.",
    "Скаттерҳо ҳангоми фаъол шудани қоида тиражҳои ҷоизавиро бо зарбкунандаи x3 оғоз мекунанд.",
    "Пас аз бурд метавонед пулро гиред ё дучандкуниро санҷед.",
  ],
};

export default function GameMenu({ history, onClose }) {
  const [view, setView] = useState("history");
  const { language, t } = useLanguage();
  return (
    <div className="game-menu-layer" role="dialog" aria-modal="true" aria-label={t("gameMenu")}>
      <div className="game-menu-panel">
        <div className="game-menu-head"><strong>{t("gameMenu")}</strong><button type="button" onClick={onClose}>{t("close")}</button></div>
        <div className="game-menu-tabs" role="tablist" aria-label={t("gameMenu")}>
          <button className={view === "history" ? "active" : ""} type="button" role="tab" aria-selected={view === "history"} onClick={() => setView("history")}>{t("history")}</button>
          <button className={view === "rules" ? "active" : ""} type="button" role="tab" aria-selected={view === "rules"} onClick={() => setView("rules")}>{t("rules")}</button>
        </div>
        <div className="game-menu-body">{view === "history" ? <HistoryView history={history} t={t} /> : <RulesView language={language} t={t} />}</div>
      </div>
    </div>
  );
}

function HistoryView({ history, t }) {
  return <section className="game-menu-section"><h4>{t("gameHistory")}</h4><div className="history-list">{history.length ? history.map((item) => <div key={`${item.id}-${item.time}`} className="history-row"><span>{item.time}</span><strong>№ {item.id}</strong><em>{item.combination}</em><b>{Number(item.win).toFixed(2)}</b></div>) : <p>{t("noHistory")}</p>}</div></section>;
}

function RulesView({ language, t }) {
  return <section className="game-menu-section"><h4>{t("rules")}</h4><ol className="rules-list">{rules[language].map((rule) => <li key={rule}>{rule}</li>)}</ol></section>;
}
