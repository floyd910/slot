import "./CombinationSelector.css";
import { useLanguage } from "../i18n.jsx";

export default function CombinationSelector({
  combinations,
  selectedCombinationId,
  disabled,
  onSelect,
}) {
  const { t } = useLanguage();
  return (
    <div className={`combination-group${disabled ? " --disabled" : ""}`}>
      <label>
        Выбор лотерейной <br />
        комбинации
      </label>
      {combinations.map((combo) => (
        <div
          key={combo.id}
          className={`combination-item${combo.id === selectedCombinationId ? " --glow" : ""}`}
          id={`combi-${combo.id}`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => {
            if (!disabled) onSelect(combo.id);
          }}
          onKeyDown={(event) => {
            if (disabled || (event.key !== "Enter" && event.key !== " "))
              return;
            event.preventDefault();
            onSelect(combo.id);
          }}
        >
          <div className="combination-info">
            <h4 className="combination-item__title">{t("combination")}</h4>
            <p className="combination-item__subTitle">
              <span className="flex">
                {t("coordinateGroup")} {t("coordinates")}
              </span>
              <span ckassName="flex">
                {renderCombinationTexts(combo, t("coordinates").length)}{" "}
                {combo.id !== 1 && <>{t("orCombination")}</>}
              </span>
            </p>
          </div>
          <span className="combination-item__count">{combo.title}</span>
        </div>
      ))}
    </div>
  );
}

function getCombinationTexts(combo) {
  if (Array.isArray(combo.displayGroups)) return combo.displayGroups;
  return (combo.groups ?? []).map((group) =>
    group.map(formatCoordinate).join("-"),
  );
}

function renderCombinationTexts(combo, labelLength) {
  return getCombinationTexts(combo).flatMap((text, index, list) => {
    const item = <>{text}</>;
    return item;
  });
}

function formatCoordinate(coord) {
  return String(coord)
    .replace(/^A/, "\u0410")
    .replace(/^B/, "\u0412")
    .replace(/^C/, "\u0421");
}
