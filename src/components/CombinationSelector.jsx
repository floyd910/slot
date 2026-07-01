import { useMemo } from "react";
import { useLanguage } from "../i18n.jsx";
import { buildCombinationSelectorItems } from "../viewModels/combinationSelectorViewModel.js";
import "./CombinationSelector.css";

export default function CombinationSelector({
  combinations,
  selectedCombinationId,
  disabled,
  onSelect,
}) {
  const { t } = useLanguage();
  const items = useMemo(
    () => buildCombinationSelectorItems(combinations, selectedCombinationId),
    [combinations, selectedCombinationId],
  );

  return (
    <div className={`combination-group${disabled ? " --disabled" : ""}`}>
      <label>
        Р’С‹Р±РѕСЂ Р»РѕС‚РµСЂРµР№РЅРѕР№ <br />
        РєРѕРјР±РёРЅР°С†РёРё
      </label>
      {items.map((item) => (
        <div
          key={item.id}
          className={`combination-item${item.isSelected ? " --glow" : ""}`}
          id={`combi-${item.id}`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => {
            if (!disabled) onSelect(item.id);
          }}
          onKeyDown={(event) => {
            if (disabled || (event.key !== "Enter" && event.key !== " "))
              return;
            event.preventDefault();
            onSelect(item.id);
          }}
        >
          <div className="combination-info">
            <h4 className="combination-item__title">{t("combination")}</h4>
            <p className="combination-item__subTitle">
              {t("coordinateGroup")} {t("coordinates")}{" "}
              {item.displayTexts.map((text, index) => (
                <span key={`${item.id}-${text}-${index}`}>{text}</span>
              ))}{" "}
              {item.id !== 1 && <>{t("orCombination")}</>}
            </p>
          </div>
          <span className="combination-item__count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
