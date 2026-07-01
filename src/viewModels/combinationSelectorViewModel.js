export function buildCombinationSelectorItems(combinations, selectedCombinationId) {
  return combinations.map((combo) => ({
    count: combo.title,
    displayTexts: getCombinationTexts(combo),
    id: combo.id,
    isSelected: combo.id === selectedCombinationId,
  }));
}

function getCombinationTexts(combo) {
  if (Array.isArray(combo.displayGroups)) return combo.displayGroups;
  return (combo.groups ?? []).map((group) =>
    group.map(formatCoordinate).join("-"),
  );
}

function formatCoordinate(coord) {
  return String(coord)
    .replace(/^A/, "\u0410")
    .replace(/^B/, "\u0412")
    .replace(/^C/, "\u0421");
}