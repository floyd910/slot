export const SLOT_CHOOSER_BACKGROUND_SRC = "/assets/img/cover.webp";
export const SLOT_CHOOSER_TILE_ASSETS = [
  "/assets/img/xiramandi-makor.webp",
  "/assets/img/logo-frame.webp",
];

export const GAME3_COVER_SRC = "/assets/img/game3-cover.webp";
export const GAME3_LOGO_SRC = "/assets/img/game3-logo.webp";
export const GAME3_LOGO_ORNAMENT_SRC = "/assets/img/game3-logo-ornament.webp";
export const GAME3_SHELL_ASSETS = [GAME3_COVER_SRC, GAME3_LOGO_SRC];
export const LOTTERY_PAINTBRUSH_SRC = "/assets/img/paintbrush.png";
export const LANGUAGE_CHOOSER_ASSETS = [
  "/img/header/flag-ru.png",
  "/img/header/flag-tg.png",
  "/img/header/language-arrow.png",
];

const GAME_ASSET_DIR = "/img/extracted/\u0438\u0433\u0440\u0430-\u0425\u0443\u0448\u043a\u043e\u043b-\u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b-\u0438\u0433\u0440\u044b-1_0";
const PAYTABLE_ASSET_DIR = "/img/extracted/\u0438\u0433\u0440\u0430-\u0425\u0443\u0448\u043a\u043e\u043b-\u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b-\u0442\u0430\u0431\u043b\u0438\u0446\u0430-\u0432\u044b\u0438\u0433\u0440\u044b\u0448\u0435\u0439-1_1";
const SIDE_BUTTON_ASSET_DIR = "/img/extracted/\u0442\u0443\u0442-\u043a\u043d\u043e\u043f\u043a\u0438-\u0441\u043f\u0440\u0430\u0432\u0430-1_0";
const DOUBLE_SCENE_ASSET_DIR = "/img/extracted/\u0442\u0443\u0442-\u0444\u043e\u043d--\u0432\u044b\u0431\u043e\u0440-\u0438\u0433\u0440-\u043f\u0435\u0440\u0432\u0430\u044f-\u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430-\u0438-\u0441\u0440\u0430\u0437\u0443-\u043b\u043e\u0442\u043e\u0440\u0435\u0439\u043d\u044b\u0439-\u0440\u0435\u0436\u0438\u043c_\u0443\u0434\u0432\u043e\u0435\u043d\u0438\u0435-5_0";
const VIEW1_GRID_ASSET_DIR = DOUBLE_SCENE_ASSET_DIR.replace(
  "_\u0443\u0434\u0432\u043e\u0435\u043d\u0438\u0435-5_0",
  "_\u0443\u0434\u0432\u043e\u0435\u043d\u0438\u0435-7_0",
);

export const GAME_AREA_BACKGROUND_SRC =
  GAME_ASSET_DIR + "/sprite_001_1282x1026_at_1_1.webp";
export const GAME_AREA_FOOTER_SRC =
  GAME_ASSET_DIR + "/sprite_015_1282x196_at_1_1029.webp";
export const GAME_HEADER_SRC =
  GAME_ASSET_DIR + "/sprite_003_398x172_at_1492_1.png";

export const VIEW1_GRID_ASSETS = [
  "sprite_004_101x101_at_302_606.png",
  "sprite_008_67x67_at_352_835.png",
  "sprite_010_101x101_at_249_875.png",
  "sprite_012_101x101_at_249_978.png",
].map((file) => VIEW1_GRID_ASSET_DIR + "/" + file);

export const BOTTOM_BAR_ASSETS = Array.from({ length: 12 }, (_, index) =>
  SIDE_BUTTON_ASSET_DIR +
  `/sprite_${String(index + 1).padStart(3, "0")}_${index < 3 || (index >= 6 && index <= 8) ? "284x152" : "284x102"}_at_1_${[
    1, 155, 309, 463, 567, 671, 775, 929, 1083, 1237, 1341, 1445,
  ][index]}.png`,
);

export const DOUBLE_SCENE_ASSET_SOURCES = Object.freeze({
  background: "/assets/img/double-scene-bg.png",
  emptyChest: "/assets/img/double-empty-chest.png",
  leftClosedChest: "/assets/img/double-left-chest.png",
  rightClosedChest: "/assets/img/double-right-chest.png",
  winningChest: "/assets/img/double-winning-chest.png",
});

export const DOUBLE_SCENE_ASSETS = Object.values(DOUBLE_SCENE_ASSET_SOURCES);

export const FIRST_PAINT_GAME_IMAGE_ASSETS = [
  ...GAME3_SHELL_ASSETS,
  LOTTERY_PAINTBRUSH_SRC,
  ...LANGUAGE_CHOOSER_ASSETS,
  ...VIEW1_GRID_ASSETS,
  ...BOTTOM_BAR_ASSETS,
];

export const DEFERRED_GAME_IMAGE_ASSETS = [
  GAME3_LOGO_ORNAMENT_SRC,
  GAME_AREA_BACKGROUND_SRC,
  GAME_AREA_FOOTER_SRC,
  GAME_HEADER_SRC,
  ...DOUBLE_SCENE_ASSETS,
  PAYTABLE_ASSET_DIR + "/sprite_001_1282x1026_at_1_1.webp",
  "/img/eldorado-winnings-table-bg.webp",
  "/img/eldorado-winnings-title-bg.webp",
];

export const CRITICAL_GAME_IMAGE_ASSETS = FIRST_PAINT_GAME_IMAGE_ASSETS;

export const STARTUP_ASSETS = {
  images: [
    SLOT_CHOOSER_BACKGROUND_SRC,
    ...SLOT_CHOOSER_TILE_ASSETS,
    ...FIRST_PAINT_GAME_IMAGE_ASSETS,
    ...DEFERRED_GAME_IMAGE_ASSETS,
  ],
videos: [],
  audio: [
    "/media/pressing-bet-amount-button.8819b8f6.mp3",
    "/media/button-press-sound.mp3",
    "/media/eldorado-carpet-sound.a486c07e.mp3",
    "/media/carpet.ogg",
    "/media/receipt-erase.6a92056f.mp3",
    "/media/receipt-win-drop-sound.11ff43ce.mp3",
    "/media/digit-short.82a63348.mp3",
    "/media/eldorado-breakdown-chests-win.d57fe223.mp3",
    "/media/eldorado-breakdown-chests-loss.3f504635.mp3",
    "/media/eldorado-getting-free-tickets.e179cf46.mp3",
    "/media/eldorado-after-bonus-game.e179cf46.mp3",
    "/media/eldorado-win-sound-0.af398794.mp3",
    "/media/eldorado-win-sound-12.feef7474.mp3",
    "/media/eldorado-win-sound-3.93572e53.mp3",
    "/media/eldorado-win-sound-4.3552ce60.mp3",
    "/media/eldorado-win-sound-5.6a8b0cf6.mp3",
    "/media/eldorado-win-sound-6.ca0cf425.mp3",
    "/media/eldorado-win-sound-7.924ed6af.mp3",
    "/media/eldorado-win-sound-8.131fcfc1.mp3",
  ],
};
