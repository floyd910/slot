import { useSlotChooserItems } from "../../hooks/useSlotChooserItems.js";
import { useLanguage } from "../../i18n.jsx";
import { preventNativeSelection } from "../../utils/domEvents.js";
import "./SlotChooser.css";

export default function SlotChooser({
  activeRounds = [],
  interactive = true,
  onSelectSlot,
}) {
  const slots = useSlotChooserItems(interactive);
  const { t } = useLanguage();
  const activeGameIds = new Set(activeRounds.map(({ gameId }) => gameId));
  const activeSlot = slots.find(({ id }) => id === activeRounds[0]?.gameId);

  return (
    <main
      className="slot-chooser"
      aria-hidden={!interactive}
      onContextMenu={preventNativeSelection}
      onDragStart={preventNativeSelection}
      onSelect={preventNativeSelection}
    >
      <div className="bg-overlay"></div>

      {activeSlot && (
        <aside className="slot-chooser__continue" aria-live="polite">
          <span>{t("unfinishedGame")}</span>
          <button
            type="button"
            onClick={() => interactive && onSelectSlot(activeSlot.slot)}
            disabled={!interactive}
          >
            {t("continueGame")}
          </button>
        </aside>
      )}

      <section className="slots" aria-label={t("availableSlots")}>
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className={activeGameIds.has(slot.id) ? "slot slot--active" : "slot"}
            onClick={() => slot.enabled && onSelectSlot(slot.slot)}
            disabled={!slot.enabled}
            tabIndex={slot.enabled ? 0 : -1}
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