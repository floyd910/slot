# Spin API integration

Non-mock spins POST to the configured sessionApiBaseUrl + /spin (the same base as /init).
Confirmed URL: https://api.raxshloto.online/spin.
Request: application/x-www-form-urlencoded with token, gameId, playerId, requestId,
sum, lines, demoSpin, freeSpin. sum is the selected stake, never totalStake.
Game codes are shared with /init in src/api/gameApiIds.js. No SOAP credentials or sessionId
are sent to /spin. The supplied test token is not stored in source files.

Response: Line1..Line3 with Slot1..Slot5, LineWinKoff1..10.Koff,
WinSum, FreeSpin, Gold, idCard and Number. Existing symbol/bonus mapping is preserved.
The optional updatedBallance field maps to the displayed balance (including zero). The backend currently supplies random test balances. If absent, the previous displayed balance
is retained: the frontend does not guess the partner's new balance or credit WinSum locally.

The backend registers the stake with the partner. The remote spin path therefore sends no
PARTNER_REGISTER_BET, PARTNER_CANCEL_BET or PARTNER_SETTLE_ROUND request.
The backend confirmed requestId is idempotent at the partner and SOAP layers.
Transport still sends once, with a 9-second timeout. Unknown results require recovery;
no backend recovery endpoint has been supplied.

Errors support HTTP status and JSON {error_code, error}. 400 is BAD_REQUEST, 401/403
ACCESS_DENIED, 404 GAME_NOT_FOUND. Invalid authentication emits AUTH_REQUIRED to the host.
No client token expiry timer or refresh credentials are added; the partner owns token renewal.

Collection uses POST /pay with form fields token, gameId, playerId, requestId, cardId, idPartnerCard. The response must contain matching idCard, PayDate, and ballance (number or numeric string). The frontend uses ballance as authoritative and does not additionally credit the win or settle with the partner. Unknown payment results remain pending and block blind retries. Successful collection preserves remaining free spins.
Double transport still uses the existing SOAP method; mock mode retains local behavior. Automatic Double settlement on browser exit remains pending a backend recovery/exit contract.

Existing behavior needing confirmation:
- Demo mode comes from trusted parent launch data; the permitted dev partner sends demoMode=true. Free spins send demoSpin=0.
- FreeSpin=1 awards 15 spins locally; it is not a remaining-count value.
- Gold uses the existing bonus-row mapping.
- Line 10 has no confirmed highlight coordinates.

Still needed: confirmation of free-spin series settlement policy,
free-spin/Gold semantics, line 10 coordinates, and a recovery contract.
Live check: one demo spin (gameId=3, playerId=7, sum=1, lines=1, demoSpin=1, freeSpin=0)
returned HTTP 200 and a valid result (idCard 66983543). It did not include balance.
This shell check does not verify browser CORS.

Validation: node --test tests/spinApi.test.js tests/spinFlow.test.js;
npm run build -- --outDir .codex-spin-build.

Game IDs supplied on 2026-09-14: Hiranmandi 36, Ganchina 37, Mavrodir 38, Egipt2 39, Kadimi 40, Hocha 41, Fruct 42, Babilon 43. These replace the earlier provisional 1–8 API mapping for /init and /spin. The gameId=3 live check above is historical.

Optional idPartnerCard from /spin is preserved unchanged in the spin result and passed to the internal pay call. The HTTP /pay transport sends this identifier unchanged.

Local testing: ignored .env.local may provide VITE_DEV_TEST_TOKEN. Only development builds accept that token as a dev-test launch; a trusted parent INIT_CONTEXT replaces it. Production builds still require postMessage initialization.
