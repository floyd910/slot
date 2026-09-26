import { useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n.jsx';
export default function FreeSpinsSummary({ result, onContinue }) {
  const { t } = useLanguage();
  const button = useRef(null);
  const continueRef = useRef(onContinue);
  useEffect(() => { continueRef.current = onContinue; }, [onContinue]);
  useEffect(() => {
    if (!result.resumeAutoExpress) return undefined;
    const timer = setTimeout(() => continueRef.current(), 2000);
    return () => clearTimeout(timer);
  }, [result.id, result.resumeAutoExpress]);
  useEffect(() => {
    const previous = document.activeElement;
    button.current?.focus();
    return () => previous?.focus?.();
  }, []);
  return (
    <div className="free-spins-modal" role="dialog" aria-modal="true"
      aria-labelledby="free-spins-summary-title" aria-describedby="free-spins-summary-win"
      onKeyDown={event => {
        event.stopPropagation();
        if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); }
      }} onKeyUp={event => event.stopPropagation()}>
      <div className="free-spins-modal__card">
        <h2 id="free-spins-summary-title" className="free-spins-modal__title">{t('freeSpinsCompleted')}</h2>
        <p id="free-spins-summary-win" className="free-spins-modal__text">
          {t(Number(result.totalWin) === 0 ? 'freeSpinsZeroWin' : 'freeSpinsSessionWin')}: <strong>{result.totalWin} {result.currency}</strong>
        </p>
        {Number(result.totalWin) > 0 && <p className="free-spins-modal__text">{t('freeSpinsCredited')}</p>}
        <button ref={button} className="free-spins-modal__start" type="button" onClick={onContinue}>{t('freeSpinsContinue')}</button>
      </div>
    </div>
  );
}
