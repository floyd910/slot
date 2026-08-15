import { useMemo } from "react";
import { useLanguage } from "../../i18n.jsx";
import { buildCombinationSelectorItems } from "../../viewModels/combinationSelectorViewModel.js";
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
        {t("combinationSelectorTitle").split("\n").map((line, index) => (
          <span key={line}>
            {index > 0 && <br />}
            {line}
          </span>
        ))}
      </label>
      {items.map((item) => (
        <button
          key={item.id}
          className={`combination-item${item.isSelected ? " --glow" : ""}`}
          id={`combi-${item.id}`}
          type="button"
          disabled={disabled}
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
        </button>
      ))}
    </div>
  );
}
