const READY_SLOT_IMAGE = "/assets/img/xiramandi-makor.png";
const PENDING_SLOT_IMAGE = "/assets/img/logo-frame.png";

export function buildSlotChooserItems({ interactive, slots }) {
  return slots.map((slot) => {
    const ready = slot.status === "ready";
    const enabled = interactive && ready;

    return {
      alt: ready ? "Hirramandi Makor - Betproduct.com" : "Coming soon",
      enabled,
      fetchPriority: ready ? "high" : "low",
      id: slot.id,
      imageSrc: ready ? READY_SLOT_IMAGE : PENDING_SLOT_IMAGE,
      slot,
    };
  });
}