export const SLOT_CHOOSER_BACKGROUND_SRC = "/assets/img/cover.png";
export const SLOT_CHOOSER_BACKGROUND_1280_SRC = "/assets/img/landing-page-1280.png";

const GAME_ASSET_DIR = "/img/extracted/\u0438\u0433\u0440\u0430-\u0425\u0443\u0448\u043a\u043e\u043b-\u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b-\u0438\u0433\u0440\u044b-1_0";
const PAYTABLE_ASSET_DIR = "/img/extracted/\u0438\u0433\u0440\u0430-\u0425\u0443\u0448\u043a\u043e\u043b-\u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b-\u0442\u0430\u0431\u043b\u0438\u0446\u0430-\u0432\u044b\u0438\u0433\u0440\u044b\u0448\u0435\u0439-1_1";
const SIDE_BUTTON_ASSET_DIR = "/img/extracted/\u0442\u0443\u0442-\u043a\u043d\u043e\u043f\u043a\u0438-\u0441\u043f\u0440\u0430\u0432\u0430-1_0";
const DOUBLE_SCENE_ASSET_DIR = "/img/extracted/\u0442\u0443\u0442-\u0444\u043e\u043d--\u0432\u044b\u0431\u043e\u0440-\u0438\u0433\u0440-\u043f\u0435\u0440\u0432\u0430\u044f-\u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430-\u0438-\u0441\u0440\u0430\u0437\u0443-\u043b\u043e\u0442\u043e\u0440\u0435\u0439\u043d\u044b\u0439-\u0440\u0435\u0436\u0438\u043c_\u0443\u0434\u0432\u043e\u0435\u043d\u0438\u0435-5_0";

export const GAME_AREA_BACKGROUND_SRC =
  GAME_ASSET_DIR + "/sprite_001_1282x1026_at_1_1.png";
export const GAME_AREA_FOOTER_SRC =
  GAME_ASSET_DIR + "/sprite_015_1282x196_at_1_1029.png";
export const GAME_HEADER_SRC =
  GAME_ASSET_DIR + "/sprite_003_398x172_at_1492_1.png";

export const DOUBLE_SCENE_ASSETS = [
  "sprite_001_1336x542_at_1_1.png",
  "sprite_002_21x194_at_1339_1.png",
  "sprite_003_21x194_at_1419_1.png",
  "sprite_004_159x351_at_1447_1.png",
  "sprite_005_250x305_at_1611_1.png",
  "sprite_006_144x160_at_1866_1.png",
  "sprite_007_17x140_at_1343_196.png",
  "sprite_008_18x139_at_1422_197.png",
  "sprite_009_1336x396_at_1_545.png",
  "sprite_010_1336x542_at_1_947.png",
  "sprite_011_160x59_at_211_1491.png",
  "sprite_012_203x57_at_4_1494.png",
  "sprite_013_144x137_at_333_1554.png",
  "sprite_014_164x160_at_1_1558.png",
  "sprite_015_160x56_at_169_1558.png",
  "sprite_016_160x56_at_169_1616.png",
  "sprite_017_160x57_at_169_1674.png",
  "sprite_018_160x58_at_1_1767.png",
  "sprite_019_160x57_at_163_1767.png",
  "sprite_020_160x58_at_163_1826.png",
  "sprite_021_160x58_at_1_1827.png",
  "sprite_022_160x58_at_163_1886.png",
  "sprite_023_160x57_at_1_1887.png",
  "sprite_024_160x57_at_1_1946.png",
  "sprite_025_160x59_at_163_1946.png",
].map((file) => DOUBLE_SCENE_ASSET_DIR + "/" + file);

export const CRITICAL_GAME_IMAGE_ASSETS = [
  GAME_AREA_BACKGROUND_SRC,
  GAME_AREA_FOOTER_SRC,
  GAME_HEADER_SRC,
  ...DOUBLE_SCENE_ASSETS,
];

export const STARTUP_ASSETS = {
  images: [
    SLOT_CHOOSER_BACKGROUND_SRC,
    SLOT_CHOOSER_BACKGROUND_1280_SRC,
    ...CRITICAL_GAME_IMAGE_ASSETS,
    PAYTABLE_ASSET_DIR + "/sprite_001_1282x1026_at_1_1.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_001_284x152_at_1_1.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_002_284x152_at_1_155.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_003_284x152_at_1_309.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_004_284x102_at_1_463.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_005_284x102_at_1_567.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_006_284x102_at_1_671.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_007_284x152_at_1_775.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_008_284x152_at_1_929.png",
    SIDE_BUTTON_ASSET_DIR + "/sprite_009_284x152_at_1_1083.png",
    "/img/eldorado-gold-cell.webp",
    "/img/gold-cell-inner.webp",
    "/img/eldorado-winnings-table-bg.webp",
    "/img/eldorado-winnings-title-bg.webp",
  ],
  videos: [],
};
