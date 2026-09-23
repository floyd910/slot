import { useLanguage } from "../../i18n.jsx";








export default function FreeSpinsPrompt({ onStart, count }) {
  const { t } = useLanguage();

  return (
    <div className="free-spins-modal" role="dialog" aria-modal="true">
      <div className="free-spins-modal__card">
        <h2 className="free-spins-modal__title">
          {t("bonusRoundTitle")}
        </h2>
        <p className="free-spins-modal__text">
          {t("freeSpinsFooter")}: {count}
        </p>

        <button
          className="free-spins-modal__start"
          type="button"
          onClick={onStart}
        >
          {t("startFreeSpinRound")}
        </button>
      </div>
    </div>
  );
}
