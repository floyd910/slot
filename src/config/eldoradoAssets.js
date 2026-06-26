import { VIEW2_SYMBOL_ASSET_SOURCES } from "../components/view2Symbols/index.jsx";

const LINE_ASSETS = "/img/extracted/Р›РёРЅРёРё-Рё-РљРѕСЃС‚Рё-1_00";
const SYMBOL_12_COMBO_BORDER = `${LINE_ASSETS}/sprite_005_102x102_at_1847_432.png`;

export const COMBO_BORDERS = [
  SYMBOL_12_COMBO_BORDER,
  `${LINE_ASSETS}/sprite_006_102x102_at_1728_503.png`,
  `${LINE_ASSETS}/sprite_007_102x102_at_1625_607.png`,
  `${LINE_ASSETS}/sprite_008_102x102_at_1521_631.png`,
  `${LINE_ASSETS}/sprite_009_102x102_at_1521_735.png`,
  `${LINE_ASSETS}/sprite_010_102x102_at_1403_824.png`,
  `${LINE_ASSETS}/sprite_011_102x102_at_1285_909.png`,
  `${LINE_ASSETS}/sprite_012_102x102_at_1285_1013.png`,
  `${LINE_ASSETS}/sprite_014_102x102_at_1195_1237.png`,
  `${LINE_ASSETS}/sprite_017_102x102_at_951_1937.png`,
];

const collectImageSources = (...values) =>
  values.flatMap((value) => {
    if (!value) return [];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return collectImageSources(...value);
    if (typeof value === "object" && typeof value.src === "string") {
      return [value.src];
    }
    if (typeof value === "object") return collectImageSources(...Object.values(value));
    return [];
  });

export const ELDORADO_VIEW_ASSETS = [
  ...new Set(
    collectImageSources(
      VIEW2_SYMBOL_ASSET_SOURCES,
      COMBO_BORDERS,
      "/img/extracted/РЎР»РѕС‚_РРЅС‚РµСЂС„РµР№СЃ-РєРѕРІРµСЂ-РґР»СЏ-СЂРѕР·С‹РіСЂС‹С€Р°-РІРёР·СѓР°Р»РёР·Р°С†РёРё/sprite_001_1145x666_at_3_3.png",
      "/img/extracted/РёРіСЂР°-РҐСѓС€РєРѕР»-СЌР»РµРјРµРЅС‚С‹-РёРіСЂС‹-1_0/sprite_002_201x653_at_1289_1.png",
    ),
  ),
];
