export const TERMINAL_GAME_CONFIGS = Object.freeze({
  "ganchina-sokrovishch": Object.freeze({ numericId: "37", service: "Ganchina", proxyPath: "/soap-terminal-ganchina", library: "SlotGanchinaSOAPTerminal.dll", spinMethod: "SetSlotSpinGanchinaTerminal", doubleMethod: "GetSlotDubleGanchinaTerminal" }),
  "marvorid-djemchug": Object.freeze({ numericId: "38", service: "Mavrodir", proxyPath: "/soap-terminal-mavrodir", library: "SlotMavrodirSOAPTerminal.dll", spinMethod: "SetSlotSpinMavrodirTerminal", doubleMethod: "GetSlotDubleMavrodirTerminal" }),
  "khiradmandi-makor": Object.freeze({ numericId: "36", service: "Hiranmandi", proxyPath: "/soap-hiranmandi-terminal", library: "SlotHiranmandiSOAPTerminal.dll", spinMethod: "SetSlotSpinHiranmandiTerminal", doubleMethod: "GetSlotDubleHiranmandiTerminal", payMethod: "GetSlotPayHiranmandiTerminal" }),
  egypt: Object.freeze({ numericId: "39", service: "Egipt2", proxyPath: "/soap-terminal-egipt2", library: "SlotEgipt2SOAPTerminal.dll", spinMethod: "SetSlotSpinEgipt2Terminal", doubleMethod: "GetSlotDubleEgipt2Terminal" }),
  "kadima-drevnii": Object.freeze({ numericId: "40", service: "Kadimi", proxyPath: "/soap-terminal-kadimi", library: "SlotKadimiSOAPTerminal.dll", spinMethod: "SetSlotSpinKadimiTerminal", doubleMethod: "GetSlotDubleKadimiTerminal" }),
  "khocha-afandi": Object.freeze({ numericId: "41", service: "Hocha", proxyPath: "/soap-terminal-hocha", library: "SlotHochaSOAPTerminal.dll", spinMethod: "SetSlotSpinHochaTerminal", doubleMethod: "GetSlotDubleHochaTerminal" }),
  babylon: Object.freeze({ numericId: "43", service: "Babilon", proxyPath: "/soap-terminal-babilon", library: "SlotBabilonSOAPTerminal.dll", spinMethod: "SetSlotSpinBabilonTerminal", doubleMethod: "GetSlotDubleBabilonTerminal" }),
  fruits: Object.freeze({ numericId: "42", service: "Fruct", proxyPath: "/soap-terminal-fruct", library: "SlotFructSOAPTerminal.dll", spinMethod: "SetSlotSpinFructTerminal", doubleMethod: "GetSlotDubleFructTerminal" }),
});

const GAME_ALIASES = Object.freeze({
  hiranmandi: "khiradmandi-makor",
  "36": "khiradmandi-makor",
  "37": "ganchina-sokrovishch",
  "38": "marvorid-djemchug",
  "39": "egypt",
  "40": "kadima-drevnii",
  "41": "khocha-afandi",
  "42": "fruits",
  "43": "babylon",
});

export const resolveTerminalGameId = (context = {}) => {
  const value = context.recoveryGameId ?? context.gameId;
  const key = value == null ? "" : String(value);
  if (TERMINAL_GAME_CONFIGS[key]) return key;
  return GAME_ALIASES[key] ?? null;
};

export const getTerminalGameConfig = (context = {}) => {
  const gameId = resolveTerminalGameId(context);
  return gameId ? { gameId, ...TERMINAL_GAME_CONFIGS[gameId] } : null;
};

export const isTerminalGame = (context = {}) => Boolean(getTerminalGameConfig(context));

export const TERMINAL_GAME_METHODS = new Set(
  Object.values(TERMINAL_GAME_CONFIGS).flatMap(({ spinMethod, doubleMethod, payMethod }) =>
    [spinMethod, doubleMethod, payMethod].filter(Boolean),
  ),
);
