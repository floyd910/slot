import { useLanguage } from "../../i18n.jsx";

const BONUS_ROUND_TITLE = {
  ru: "\u0411\u041e\u041d\u0423\u0421\u041d\u042b\u0419 \u0420\u0410\u0423\u041d\u0414",
  tg: "\u0414\u0410\u0412\u0420\u0418 \u0411\u041e\u041d\u0423\u0421\u04e2",
};

const START_FREE_SPIN_ROUND = {
  ru: "\u041d\u0410\u0427\u0410\u0422\u042c \u0420\u0410\u0423\u041d\u0414 \u0424\u0420\u0418\u0421\u041f\u0418\u041d\u041e\u0412",
  tg: "\u041e\u0492\u041e\u0417\u0418 \u0414\u0410\u0412\u0420\u0418 \u0422\u0418\u0420\u0410\u0416\u04b2\u041e\u0418 \u0420\u041e\u0419\u0413\u041e\u041d",
};

const FREE_SPINS_REWARD_TEXT = {
  ru: "\u0412\u042b \u041f\u041e\u041b\u0423\u0427\u0418\u041b\u0418 15 \u0424\u0420\u0418\u0421\u041f\u0418\u041d\u041e\u0412",
  tg: "\u0428\u0423\u041c\u041e 15 \u0422\u0418\u0420\u0410\u0416\u0418 \u0420\u041e\u0419\u0413\u041e\u041d \u0413\u0418\u0420\u0418\u0424\u0422\u0415\u0414",
};

const FREE_SPINS_MULTIPLIER_TEXT = {
  ru: "\u041c\u041d\u041e\u0416\u0418\u0422\u0415\u041b\u042c X3",
  tg: "\u0417\u0410\u0420\u0411\u041a\u0423\u041d\u0410\u041d\u0414\u0410 X3",
};
export default function FreeSpinsPrompt({ onStart }) {
  const { language } = useLanguage();

  return (
    <div className="free-spins-modal" role="dialog" aria-modal="true">
      <div className="free-spins-modal__card">
        <h2 className="free-spins-modal__title">
          {BONUS_ROUND_TITLE[language] ?? BONUS_ROUND_TITLE.ru}
        </h2>
        <p className="free-spins-modal__text">
          {FREE_SPINS_REWARD_TEXT[language] ?? FREE_SPINS_REWARD_TEXT.ru}
        </p>
        <p className="free-spins-modal__multiplier">
          {FREE_SPINS_MULTIPLIER_TEXT[language] ??
            FREE_SPINS_MULTIPLIER_TEXT.ru}
        </p>
        <button
          className="free-spins-modal__start"
          type="button"
          onClick={onStart}
        >
          {START_FREE_SPIN_ROUND[language] ?? START_FREE_SPIN_ROUND.ru}
        </button>
      </div>
    </div>
  );
}