import { useMemo } from "react";
import { slotCatalog } from "../data/slotCatalog.js";
import { buildSlotChooserItems } from "../viewModels/slotChooserViewModel.js";
import { useLanguage } from "../i18n.jsx";

export function useSlotChooserItems(interactive) {
  const { language } = useLanguage();
  return useMemo(
    () => buildSlotChooserItems({ interactive, language, slots: slotCatalog.filter(({ id }) => id !== "double-bonus") }),
    [interactive, language],
  );
}
