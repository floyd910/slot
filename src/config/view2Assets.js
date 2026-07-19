import { VIEW2_SYMBOL_ASSET_SOURCES } from "../components/view2Symbols/index.jsx";

const LINE_ASSETS = "/img/extracted/\u041b\u0438\u043d\u0438\u0438-\u0438-\u041a\u043e\u0441\u0442\u0438-1_00";
export const VIEW2_CARPET_ASSETS = [
  "/assets/img/view2-carpet-open.webp",
  "/img/extracted/\u0438\u0433\u0440\u0430-\u0425\u0443\u0448\u043a\u043e\u043b-\u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b-\u0438\u0433\u0440\u044b-1_0/sprite_002_201x653_at_1289_1.png",
];

export const COMBO_BORDERS = [
  LINE_ASSETS + "/sprite_005_102x102_at_1847_432.png",
  LINE_ASSETS + "/sprite_006_102x102_at_1728_503.png",
  LINE_ASSETS + "/sprite_007_102x102_at_1625_607.png",
  LINE_ASSETS + "/sprite_008_102x102_at_1521_631.png",
  LINE_ASSETS + "/sprite_009_102x102_at_1521_735.png",
  LINE_ASSETS + "/sprite_010_102x102_at_1403_824.png",
  LINE_ASSETS + "/sprite_011_102x102_at_1285_909.png",
  LINE_ASSETS + "/sprite_012_102x102_at_1285_1013.png",
  LINE_ASSETS + "/sprite_014_102x102_at_1195_1237.png",
  LINE_ASSETS + "/sprite_017_102x102_at_951_1937.png",
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

export const VIEW2_ASSETS = [
  ...new Set(
    collectImageSources(
      VIEW2_SYMBOL_ASSET_SOURCES,
      COMBO_BORDERS,
      VIEW2_CARPET_ASSETS,
      "/img/extracted/\u0421\u043b\u043e\u0442_\u0418\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441-\u043a\u043e\u0432\u0435\u0440-\u0434\u043b\u044f-\u0440\u043e\u0437\u044b\u0433\u0440\u044b\u0448\u0430-\u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438/sprite_001_1145x666_at_3_3.png",
      "/img/extracted/\u0438\u0433\u0440\u0430-\u0425\u0443\u0448\u043a\u043e\u043b-\u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b-\u0438\u0433\u0440\u044b-1_0/sprite_002_201x653_at_1289_1.png",
    ),
  ),
];
