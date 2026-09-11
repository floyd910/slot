# Iframe slot

Start the iframe with npm run dev in this directory (port 5174).
Start the actual parent with npm run dev in ../casinobet (port 5175).
Open http://localhost:5175, click Login, then Slots, then select the game.

The permitted test-partner simulator serves the supplied test token from the parent's
server-only .env.local (PARTNER_TEST_TOKEN). No token is placed in the frontend bundle or URL.
Production uses the real partner's authenticated launch endpoint instead; the dev simulator
is not included in a production build.

The iframe accepts token/playerId only through a versioned INIT_CONTEXT postMessage from
its actual parent window and an origin in VITE_PARENT_ORIGINS. Local development trusts
http://localhost:5175 through .env.development. Production must configure its own exact origins.
URL auth parameters, cached auth and fake default sessions are ignored. Every new launch
calls the real /init and requires a server session, balance and currency. Demo mode comes
from the validated parent launch data. Failed initialization does not open a fake game.

Spin uses POST /spin with form-urlencoded data. See docs/spin-api.md for the contract.
Collection is still unavailable pending the backend endpoint; unpaid winnings remain pending.

Tests: node --test tests/spinApi.test.js tests/spinFlow.test.js tests/frameLaunch.test.js
Build: npm run build
