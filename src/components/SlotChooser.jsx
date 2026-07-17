import { useSlotChooserItems } from "../hooks/useSlotChooserItems.js";
import { preventNativeSelection } from "../utils/domEvents.js";
import "./SlotChooser.css";

export default function SlotChooser({ interactive = true, onSelectSlot }) {
  const slots = useSlotChooserItems(interactive);

  return (
    <main
      className="slot-chooser"
      aria-hidden={!interactive}
      onContextMenu={preventNativeSelection}
      onDragStart={preventNativeSelection}
      onSelect={preventNativeSelection}
    >
      <div className="bg-overlay"></div>

      <section className="slots" aria-label="Available slots">
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className="slot"
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
          </button>
        ))}
      </section>
    </main>
  );
}