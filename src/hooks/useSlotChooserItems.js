import { useMemo } from "react";
import { slotCatalog } from "../data/slotCatalog.js";
import { buildSlotChooserItems } from "../viewModels/slotChooserViewModel.js";

export function useSlotChooserItems(interactive) {
  return useMemo(
    () => buildSlotChooserItems({ interactive, slots: slotCatalog }),
    [interactive],
  );
}