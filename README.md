# Hiranmandi iframe starter

React/Vite starter for an iframe-based game frontend. It is intentionally API-ready but uses a mock adapter until the final backend contract, screenshots, and production endpoints are confirmed.

## Run

```bash
npm run dev --prefix iframe-slot
```

Default local URL:

```text
http://localhost:5174/?token=demo-token
```

Open a specific game:

```text
http://localhost:5174/?token=demo-token&gameId=hiranmandi&currency=GEL&language=en
```

Restrict parent postMessage origins:

```text
http://localhost:5174/?token=demo-token&allowedOrigins=https://partner.example
```

## Implemented starter scope

- iframe query parameters: `token`, `session`, `gameId` / `game`, `language` / `lang`, `currency`, `playerId`, `allowedOrigins`
- parent events: `gameLoaded`, `betPlaced`, `balanceUpdated`, `error`, `size_update`
- parent commands: `reload`, `changeGame`, `updateBalance`, `logout`
- lobby with game cards, fixed top balance panel, bottom prize panel, loading/empty/error states
- Hiranmandi game shell with coordinate combinations, lottery grid, visual symbol grid, stake cycling, paytable overlay, free-spin counter, and double mode
- frontend state coverage: loading, spin processing, result, win, lose, double loading, free spins, error, recovery-oriented retry UI
- mock backend adapter for `initSession`, `spin`, `double`, `pay`, and paytable data

## Backend integration points

Replace `src/api/frameApi.js` with real calls when endpoints are ready:

- `initSession(params)` should validate token/session and return player, partner, games, combinations, and initial grid data
- `spin(...)` maps to `SetSlotSpinHiranmandi`
- `double(...)` maps to `GetSlotDubleHiranmandi`
- `pay(...)` maps to `GetSlotPayHiranmandi`

The frontend keeps free spins lifecycle client-side as described in the technical document: 3+ scatters start 15 free spins; remaining free spins are decremented by the iframe; free spin wins display base win, x3 multiplier, and final win.
