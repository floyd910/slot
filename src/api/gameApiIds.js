export const GAME_API_IDS = Object.freeze({
  "ganchina-sokrovishch": "37",
  "marvorid-djemchug": "38",
  "khiradmandi-makor": "36",
  "egypt": "39",
  "kadima-drevnii": "40",
  "khocha-afandi": "41",
  "babylon": "43",
  "fruits": "42"
});

export const resolveApiGameId = (params) => params.apiGameId ?? GAME_API_IDS[params.recoveryGameId] ?? GAME_API_IDS[params.gameId] ?? params.gameId;
