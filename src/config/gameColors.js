const GAME3_COLORS = Object.freeze({
  background: "#111111",
  backgroundDeep: "#050506",
  overlay: "rgba(0, 0, 0, 0.4)",
  overlayStrong: "rgba(0, 0, 0, 0.72)",
  panel: "rgba(13, 13, 13, 0.6)",
  panelSolid: "#0d0d0d",
  panelRaised: "#24221a",
  panelLight: "#ffffff",
  text: "#ffffff",
  textWarm: "#ffe1a2",
  textMuted: "#cbbf9f",
  textDark: "#171711",
  accent: "#f4c953",
  accentBright: "#ffd700",
  accentLight: "#e6c36a",
  accentSoft: "#f1d074",
  accentDark: "#aa7c11",
  accentDarker: "#9b6519",
  accentBorder: "#e1bf64",
  accentGlow: "rgba(255, 215, 0, 0.5)",
  accentGlowSoft: "rgba(255, 215, 0, 0.1)",
  line: "rgba(255, 255, 255, 0.16)",
  lineStrong: "rgba(255, 255, 255, 0.32)",
  shadow: "rgba(0, 0, 0, 0.3)",
  shadowSoft: "rgba(0, 0, 0, 0.1)",
  highlight: "rgba(255, 255, 255, 0.1)",
  highlightStrong: "rgba(255, 255, 255, 0.3)",
  success: "#3ad437",
  successDark: "#146500",
  error: "#ff4d2f",
  errorDark: "#aa1111",
  info: "#61d6ff",
  disabled: "#8d929b",
});

// Each game owns a separate palette object. Until its colors arrive, it uses
// the Game 3 values so the shared layout remains visually complete.
const placeholderPalette = (accent) => Object.freeze({ ...GAME3_COLORS, accent });

export const GAME_COLORS = Object.freeze({
  "korvonsaroi-karavan": placeholderPalette("#d94776"),
  "marvorid-djemchug": placeholderPalette("#e5a443"),
  "khiradmandi-makor": GAME3_COLORS,
  "egypt": placeholderPalette("#8bd36f"),
  "kadima-drevnii": placeholderPalette("#58d5c9"),
  "khocha-afandi": placeholderPalette("#8fb3ff"),
  "babylon": placeholderPalette("#b58cff"),
  fruits: placeholderPalette("#de3bd3"),
  "double-bonus": placeholderPalette("#ff7a59"),
});

export const getGameColors = (gameId) => GAME_COLORS[gameId] ?? GAME3_COLORS;

const toKebabCase = (value) => value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export const toGameColorVariables = (colors) =>
  Object.fromEntries(
    Object.entries(colors).map(([token, value]) => [`--game-${toKebabCase(token)}`, value]),
  );
