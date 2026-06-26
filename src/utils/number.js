export const asNumber = (value, fallback = 0) => {
  const normalized =
    typeof value === "string" ? normalizeNumberString(value) : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeNumberString = (value) => {
  const compact = value.trim().replace(/\s+/g, "").replace(",", ".");
  const direct = Number(compact);
  if (Number.isFinite(direct)) return direct;

  const prefixedNumber = compact.match(/^-?\d+(?:\.\d+)?/);
  return prefixedNumber ? prefixedNumber[0] : compact;
};
