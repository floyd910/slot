import { slotCatalog } from "../data/slotCatalog.js";
import "./SlotChooser.css";

export default function SlotChooser({ interactive = true, onSelectSlot }) {
  return (
    <main className="slot-chooser" aria-hidden={!interactive}>
      <div className="bg-overlay"></div>

      <section className="slots" aria-label="Available slots">
        {slotCatalog.map((slot) => {
          const ready = slot.status === "ready";
          const enabled = interactive && ready;
          return (
            <button
              key={slot.id}
              type="button"
              className="slot"
              onClick={() => enabled && onSelectSlot(slot)}
              disabled={!enabled}
              tabIndex={enabled ? 0 : -1}
            >
              {ready ? (
                <img
                  src="/assets/img/xiramandi-makor.png"
                  alt="Hirramandi Makor - Betproduct.com"
                  decoding="async"
                  fetchPriority="high"
                  loading="eager"
                />
              ) : (
                <img
                  src="/assets/img/logo-frame.png"
                  alt="Coming soon"
                  decoding="async"
                  fetchPriority="low"
                  loading="eager"
                />
              )}
            </button>
          );
        })}
      </section>
    </main>
  );
}