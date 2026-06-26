import "./CombinationSelector.css";
import { useLanguage } from "../i18n.jsx";

export default function CombinationSelector({ combinations, selectedCombinationId, disabled, onSelect }) {
  const { t } = useLanguage();
  return (
    <div className={`combination-group${disabled ? " --disabled" : ""}`}>
      {combinations.map((combo) => (
        <div key={combo.id} className={`combination-item${combo.id === selectedCombinationId ? " --glow" : ""}`} id={`combi-${combo.id}`} role="button" tabIndex={disabled ? -1 : 0} onClick={() => { if (!disabled) onSelect(combo.id); }} onKeyDown={(event) => { if (disabled || (event.key !== "Enter" && event.key !== " ")) return; event.preventDefault(); onSelect(combo.id); }}>
          <h4 className="combination-item__title">{t("combination")}</h4>
          <span className="combination-item__count">{combo.title}</span>
          <div className="combination-item__wrapper">
            <p className="combination-item__subTitle">
              {t("coordinateGroup")} <br />
              {t("coordinates")} {renderCombinationTexts(combo, t("coordinates").length)}
            </p>
            {combo.id !== 1 && <span className="combination-item__subTitle last_subTitle">{t("orCombination")}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function getCombinationTexts(combo) {
  if (Array.isArray(combo.displayGroups)) return combo.displayGroups;
  return (combo.groups ?? []).map((group) => group.map(formatCoordinate).join("-"));
}

function renderCombinationTexts(combo, labelLength) {
  const maxRowLength = 33;
  let rowLength = labelLength;
  let hasBrokenToThirdLine = false;
  return getCombinationTexts(combo).flatMap((text, index, list) => {
    const separator = index < list.length - 1 ? ", " : "";
    const chunkLength = text.length + separator.length;
    const shouldBreak = !hasBrokenToThirdLine && rowLength > labelLength && rowLength + chunkLength > maxRowLength;
    if (shouldBreak) { hasBrokenToThirdLine = true; rowLength = chunkLength; } else { rowLength += chunkLength; }
    const item = <span key={text} className="combination-item__text">{text}{separator}</span>;
    return shouldBreak ? [<br key={`break-${text}`} />, item] : [item];
  });
}

function formatCoordinate(coord) {
  return String(coord)
    .replace(/^A/, "\u0410")
    .replace(/^B/, "\u0412")
    .replace(/^C/, "\u0421");
}
