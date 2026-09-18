# Demo stand and partner integration

The standalone https://raxshloto.online/#/slots page and its #/games/... routes obtain launch data from POST /api/demo-launch. Embedded frames never use this endpoint, even on the same host. Missing/expired partner authorization never falls back to the demo account. Partner postMessage origin/source checks remain in force.

The shared /init, /balance, /spin, /pay and /double clients continue to send Bearer headers. No mock gameplay is introduced. demoMode remains false as in the existing test setup; the backend must bind the supplied Demo token to a test wallet. Token lifetime alone does not enforce test accounting.

## Netlify deployment
Deploy this repository including netlify/functions/demo-launch.mjs. Configure server-side environment variables for Functions:
- DEMO_ENABLED=true
- DEMO_ORIGIN=https://raxshloto.online
- DEMO_PLAYER_ID=7
- DEMO_TOKEN=the special Demo token supplied by the backend

Do not prefix DEMO_TOKEN with VITE_. The token must not be added to netlify.toml or tracked source. Responses use Cache-Control: no-store. This public demo endpoint intentionally issues a test token to visitors; it must never be configured with real-player credentials.

The local .env.local is configured for localhost:5174 and Vite dev serves the same endpoint. Open http://localhost:5174/#/slots directly. Local iframe integration still requires parent Login and postMessage. Restart Vite after environment changes.

Deployment and remote Functions environment configuration are not performed by the local build. Static hosting without Functions needs an equivalent server endpoint. Partner five-minute token renewal is separate and not implemented by this change.
