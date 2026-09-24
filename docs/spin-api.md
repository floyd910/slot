# Spin API integration

Non-mock spins POST to the configured sessionApiBaseUrl + /spin (the same base as /init).
Confirmed URL: https://api.raxshloto.online/spin.
Request: application/x-www-form-urlencoded with gameId, playerId, requestId,
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

Collection uses POST /pay with form fields gameId, playerId, requestId, cardId. The response must contain matching idCard, PayDate, and ballance (number or numeric string). The frontend uses ballance as authoritative and does not additionally credit the win or settle with the partner. Unknown payment results remain pending and block blind retries. Successful collection preserves remaining free spins.
Double transport still uses the existing SOAP method; mock mode retains local behavior. Automatic Double settlement on browser exit remains pending a backend recovery/exit contract.

Existing behavior needing confirmation:
- Demo mode comes from trusted parent launch data; the permitted dev partner sends demoMode=true. Free spins send demoSpin=0.
- Remote remaining counts come from POST /freespins; the frontend no longer interprets FreeSpin=1 as a 15-spin award. Mock mode retains simulated awards.
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

The revised /pay contract does not accept idPartnerCard; /spin no longer needs to return it. Legacy saved rounds may still contain it, but it is not sent.

Local testing: the parent casinobet development server reads PARTNER_TEST_TOKEN from its ignored .env.local. Login fetches the launch context and sends it via trusted postMessage. The child contains no test token or authentication fallback.

/init gameState now provides the authoritative startup grid through Line1.Slot11–Slot15, Line2.Slot21–Slot25 and Line3.Slot31–Slot35. LinesKoff maps Koff1–Koff10. Raw state is retained. CountFreeSpin is the lifetime number of free spins already played; it never resets and is not the remaining count. CardSum is the total bet; SpinResult.LineSum is the per-line stake and SpinResult.Lines is the selected line count. These do not represent unpaid winnings. SumPay is the unpaid win amount and restores the collectible win when PayDate is empty; paid cards do not restore a collectible win. Pending-operation reconciliation still needs a backend contract; a last-card snapshot alone does not settle a pending request.

Authentication: /init, /balance, /spin and /pay send Authorization: Bearer <token>. The token is never included in their form bodies. The backend must allow Authorization in CORS preflight responses and handle OPTIONS. Double uses POST /double with the same Bearer header. Its form fields are gameId, requestId, cardId, wasDouble (one-based step, 1 through 5), and sum (the latest confirmed WinSum; the first request uses the Spin win and subsequent requests use the previous Double response). WinSum and matching idCard are required in the response. No automatic retries; uncertain results remain pending.

Free-spin counter: POST /freespins with the existing Bearer token and form fields gameId/playerId returns CountFreeSpin. Initialization reads this count only when /init returns a prior-spin gameState. A player without a prior spin starts at zero without calling /freespins. Each successful remote spin reads this count, including zero. Failed post-spin reads preserve the confirmed spin result, stop autoplay and require a counter-only refresh before another spin. A count read never resolves an uncertain spin request. Each confirmed FreeSpin=1 award grants 15 spins, including retriggers during a series. The frontend persists award totals and the lifetime counter at series start per playerId/game in localStorage. Remaining = total awarded - (current CountFreeSpin - series baseline). Award card IDs are deduplicated and saved before refreshing the counter. A new series establishes a new baseline. Restoration requires this local award history; the backend does not expose awarded totals, so a fresh browser/device cannot reconstruct them. Accumulated money and completion payouts are not inferred from this endpoint.

Double recovery: Retry replays only a saved /double operation, using its original requestId and exact original form fields. This relies on the confirmed backend idempotency contract. Pending operations are retained per player/game across sessionId changes in localStorage, without authentication tokens. A validated matching-card WinSum restores the confirmed amount for manual collection; recovery itself never calls /pay. HTTP 202, malformed responses and transport failures keep the operation pending. No automatic /pay replay is enabled while partner-side duplicate-credit protection remains unavailable. Existing pending entries written by older versions retain the legacy session-scoped fallback, but cannot be located after losing that session identifier.
Free-spin settlement:
- Confirmed winning Free Spin cards are stored in the local series ledger and remain unpaid while the series runs.
- At series completion, the client pays each unpaid card through the existing card-based /pay API and updates the displayed balance after the batch completes.
- Successful card payments are persisted individually; a partial failure cannot cause already confirmed payments to be sent again.
- The restored bonus popup shows only the sum of confirmed card payments. Remaining Free Spins and lifetime series winnings survive an exit payout.
- This requires the backend to allow the next Free Spin while previous Free Spin cards are unpaid, and /pay to accept those earlier card IDs. No aggregate amount parameter is invented.
- Leaving an unfinished free-spin series, including pagehide, does not trigger payment. Saved winnings remain unpaid until the series finishes. For a completed series, pagehide may attempt settlement with keepalive. Guaranteed settlement after browser termination still requires server support; an unknown payment result is not treated as paid or blindly replayed.


## Deferred: partner settlement integration

User decision: partner integration is deferred until a real partner is available. Do not introduce partner-dependent blocking solely because that integration is absent during current development.

When the partner is connected, revisit recovery and payment together:
- If GetLastSpinList (exposed through the initialization flow) returns a card with an empty PayDate, send that card's result to the partner.
- Only after confirmed successful partner processing, call GetSlotPay.
- Only after confirmed completion, permit further play.
- Implement this sequence in the backend payment flow and confirm its mapping to /init and /pay; it is not implemented yet.
- Make retries idempotent per card so reconnects and repeated requests cannot credit the partner twice. Preserve incomplete processing for recovery.

This is a future integration requirement, not confirmation that current /pay already performs partner settlement. Keep the current decision to defer payouts for unfinished free-spin rounds; explicitly reconcile that rule with partner recovery before enabling the integration.
