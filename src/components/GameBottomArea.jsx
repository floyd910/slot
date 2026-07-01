import "./GameBottomArea.css";
import { useLanguage } from "../i18n.jsx";
import { buildGameBottomAreaViewModel } from "../viewModels/gameBottomAreaViewModel.js";

export default function GameBottomArea({
  player,
  stake,
  totalPurchase,
  selectedCombination,
  spinResult,
  revealComplete = true,
}) {
  const { t } = useLanguage();
  const view = buildGameBottomAreaViewModel({
    player,
    revealComplete,
    selectedCombination,
    spinResult,
    stake,
    t,
    totalPurchase,
  });

  return (
    <section className="game-bottom-area" aria-label={t("gameStatus")}>
      <div className="game-bottom-area__top">
        {view.messages.map((message) => (
          <div className="game-bottom-area__message" key={message}>
            {message}
          </div>
        ))}
      </div>
      <div className="game-bottom-area__fields">
        {view.fields.map((field, index) => (
          <BottomField
            key={`${field.title}-${index}`}
            compact={field.compact}
            title={field.title}
            value={field.value}
          />
        ))}
      </div>
    </section>
  );
}

function BottomField({ title, value, compact = false }) {
  return (
    <div className={`game-bottom-field${compact ? " --compact" : ""}`}>
      <div className="game-bottom-field__title">{title}</div>
      <div className="game-bottom-field__value">{value}</div>
    </div>
  );
}