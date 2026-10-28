import { resolveLocalizedAsset } from "../config/gameAssets.js";

const PENDING_SLOT_IMAGE = "/assets/img/logo-frame.webp";

export function buildSlotChooserItems({ interactive, language, slots }) {
  return slots.map((slot) => {
    const ready = slot.status === "ready";
    const enabled = interactive && ready;

    return {
      alt: ready ? slot.title : "Coming soon",
      enabled,
      fetchPriority: ready ? "high" : "low",
      id: slot.id,
      imageSrc: ready
        ? resolveLocalizedAsset(slot.assets.chooserTile, language)
        : PENDING_SLOT_IMAGE,
      slot,
    };
  });
}

