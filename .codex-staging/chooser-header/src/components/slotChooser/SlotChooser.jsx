import { useEffect, useState } from "react";
import { useSlotChooserItems } from "../../hooks/useSlotChooserItems.js";
import { terminalProfileStore } from "../../api/terminalAuthApi.js";
import { useLanguage } from "../../i18n.jsx";
import { preventNativeSelection } from "../../utils/domEvents.js";
import "./SlotChooser.css";

export default function SlotChooser({
  activeRounds = [],
  interactive = true,
  onSelectSlot,
}) {
  const slots = useSlotChooserItems(interactive);
  const { language, t, toggleLanguage } = useLanguage();
  const [balance, setBalance] = useState(() => {
    const configuredBalance = Number(window.GAME_ROOM_CONFIG?.balance);
    return Number.isFinite(configuredBalance) ? configuredBalance : 0;
  });
  const terminalId = String(
    window.GAME_ROOM_CONFIG?.idKassi ??
    window.GAME_ROOM_CONFIG?.terminalId ??
    terminalProfileStore.read()?.idKassi ??
    "",
  );
  const terminalActivated = Boolean(terminalId);
  const chooserInteractive = interactive && terminalActivated;
  const activeGameIds = new Set(activeRounds.map(({ gameId }) => gameId));
  const languageLabel = language === "tg" ? "ТОҶИКӢ" : "РУССКИЙ";
  const flagSrc = language === "tg" ? "/img/header/flag-tg.png" : "/img/header/flag-ru.png";
  const currency = window.GAME_ROOM_CONFIG?.currency || "TJS";

  useEffect(() => {
    const syncBalance = (event) => {
      const nextBalance = Number(event.detail?.balance ?? window.GAME_ROOM_CONFIG?.balance);
      if (Number.isFinite(nextBalance)) setBalance(nextBalance);
    };
    window.addEventListener("terminal-balance-updated", syncBalance);
    return () => window.removeEventListener("terminal-balance-updated", syncBalance);
  }, []);

  return (
    <main
      className="slot-chooser"
      aria-hidden={!interactive}
      onContextMenu={preventNativeSelection}
      onDragStart={preventNativeSelection}
      onSelect={preventNativeSelection}
    >
      <div className="bg-overlay"></div>

      <header className="slot-chooser__hud">
        <button
          type="button"
          className="slot-chooser__language"
          onClick={toggleLanguage}
          disabled={!interactive}
          aria-label={language === "tg" ? "Иваз кардани забон" : "Сменить язык"}
        >
          <img className="slot-chooser__flag" src={flagSrc} alt="" />
          <span>{languageLabel}</span>
          <img className="slot-chooser__language-arrow" src="/img/header/language-arrow.png" alt="" />
        </button>

        <div className="slot-chooser__account" role="status">
          <div className="slot-chooser__hud-card slot-chooser__hud-card--terminal">
            <span className="slot-chooser__hud-icon" aria-hidden="true">▣</span>
            <span className="slot-chooser__hud-copy">
              <strong>{terminalActivated ? `ID ${terminalId}` : "—"}</strong>
              <small>{language === "tg" ? "ТЕРМИНАЛ" : "ТЕРМИНАЛ"}</small>
            </span>
          </div>
          <div className="slot-chooser__hud-card slot-chooser__hud-card--balance">
            <span className="slot-chooser__hud-icon" aria-hidden="true">▰</span>
            <span className="slot-chooser__hud-copy">
              <strong>{balance.toFixed(2)} {currency}</strong>
              <small>{language === "tg" ? "ТАВОЗУН" : "БАЛАНС"}</small>
            </span>
          </div>
        </div>
      </header>


      <section className="slots" aria-label={t("availableSlots")}>
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className={activeGameIds.has(slot.id) ? "slot slot--active" : "slot"}
            onClick={() => chooserInteractive && slot.enabled && onSelectSlot(slot.slot)}
            disabled={!slot.enabled || !terminalActivated}
            tabIndex={slot.enabled && terminalActivated ? 0 : -1}
          >
            <img
              src={slot.imageSrc}
              alt={slot.alt}
              decoding="async"
              fetchpriority={slot.fetchPriority}
              loading="eager"
              draggable={false}
            />
            {activeGameIds.has(slot.id) && (
              <span className="slot__active-badge">{t("activeGame")}</span>
            )}
          </button>
        ))}
      </section>
    </main>
  );
}
