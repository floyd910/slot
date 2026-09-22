# Standalone Demo/Test stand

https://raxshloto.online/#/slots and #/games/... use the real long-lived demo token supplied by the backend. No /api/demo-launch endpoint or server function is required. Embedded frames always require parent authorization through postMessage and never fall back to the demo account.

## Build and deployment

Set DEMO_TOKEN in .env.local on the build machine or in the build environment. Vite deliberately includes the demo token in the frontend bundle. Use only the public test account; never put Login/Password or real-player credentials here. Rebuild after changing these values. Deploy dist to nginx as usual.

The existing locally configured demo token is used unchanged. demoMode stays false to preserve the existing real API flow. The backend must associate the token with a test wallet. /init, /balance, /spin, /double, /pay and free spins use the same logic as partner sessions.

For local testing, set VITE_LOCAL_DEMO_ORIGIN=http://localhost:5174 and open /#/slots directly. This local origin option is development-only. Restart Vite after changing environment variables.

Partner token renewal remains separate. This change does not implement partner renewal or change parent origin checks.

## Browser player identity

Each standalone browser profile generates a cryptographically random 40-digit string and saves it in localStorage (raxshloto.demo.playerId.v1). Chrome on different computers gets independent IDs, as do separate browsers/profiles. Tabs, reloads and game changes reuse the saved ID. Clearing site data or ending a private browsing session creates a new player next time. No IP lookup is used.

The same string is assigned to playerId, userId and idUser in launch context, so init, balance, spin/free-spin and pay use the same identity. Double uses the cardId from the player round under its existing API contract. DEMO_PLAYER_ID is no longer used. Partner launches keep their supplied IDs. Storage failures stop demo launch rather than falling back to a shared account. The backend must accept these IDs with the configured demo token and provision isolated test players.
