export const GAME_API_IDS = Object.freeze({
  "ganchina-sokrovishch": "1",
  "marvorid-djemchug": "2",
  "khiradmandi-makor": "3",
  egypt: "4",
  "kadima-drevnii": "5",
  "khocha-afandi": "6",
  babylon: "7",
  fruits: "8",
});

export const resolveApiGameId = (params) => params.apiGameId ?? GAME_API_IDS[params.recoveryGameId] ?? GAME_API_IDS[params.gameId] ?? params.gameId;
