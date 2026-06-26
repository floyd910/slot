# Hiranmandi iframe starter

React/Vite starter for an iframe-based game frontend. Spin, double, and pay are wired to the Hiranmandi SOAP backend by default, with a mock adapter still available for local UI work.

## Run

```bash
npm run dev --prefix iframe-slot
```

Default local real SOAP URL:

```text
http://localhost:5174/?mode=standalone&token=partner-token&sessionId=partner-session&userId=partner-user&gameId=hiranmandi&currency=GEL&locale=en&backendMode=soap&testMode=false&demoMode=false&backendTestParams=false
```

Open a specific game:

```text
http://localhost:5174/?mode=standalone&token=partner-token&sessionId=partner-session&userId=partner-user&gameId=hiranmandi&currency=GEL&locale=en&backendMode=soap&testMode=false&demoMode=false&backendTestParams=false
```

Use the mock adapter instead of SOAP:

```text
http://localhost:5174/?mode=standalone&token=partner-token&sessionId=partner-session&userId=partner-user&gameId=hiranmandi&currency=GEL&locale=en&backendMode=mock&testMode=true
```

Pass SOAP partner fields explicitly:

```text
http://localhost:5174/?mode=standalone&token=partner-token&sessionId=partner-session&userId=partner-user&gameId=hiranmandi&currency=GEL&locale=en&idPartner=1&idKassi=70&idValute=1&balance=1250&backendMode=soap&testMode=false&demoMode=false&backendTestParams=false
```

Restrict parent postMessage origins:

```text
http://localhost:5174/?mode=embedded&token=partner-token&sessionId=partner-session&userId=partner-user&gameId=hiranmandi&allowedOrigins=https://partner.example&backendMode=soap&testMode=false&demoMode=false&backendTestParams=false
```

## Implemented starter scope

- launch modes: `embedded` inside a host iframe and `standalone` by direct URL
- init sources: query params, `window.HIRANMANDI_FRAME_CONFIG`, `postMessage` `INIT_CONTEXT`, and session recovery
- iframe query parameters: `mode`, `token`, `sessionId` / `session`, `gameId` / `game`, `locale` / `language` / `lang`, `currency`, `userId` / `playerId`, `partnerId`, `idPartner`, `idKassi`, `idValute`, `balance`, `soapEndpoint`, `backendMode`, `testMode`, `demoMode`, `backendTestParams`, `theme`, `returnUrl`, `featureFlags`, `allowedOrigins`
- iframe events: `READY`, `LOADED`, `RESIZE`, `ERROR`, `REQUEST_FULLSCREEN`, `EXIT_FULLSCREEN`, `REQUEST_CLOSE`, `SESSION_EXPIRED`, `AUTH_REQUIRED`
- host commands: `INIT_CONTEXT`, `UPDATE_THEME`, `UPDATE_LOCALE`, `UPDATE_BALANCE`, `FORCE_RELOAD`, `OPEN_MODAL`, `CLOSE_MODULE`
- runtime states: `initial-loading`, `bootstrap-loading`, `ready`, `processing`, `empty`, `error`, `network-error`, `session-expired`, `unsupported-environment`, `maintenance`, `invalid-session`, `access-denied`, `configuration-error`
- lobby with game cards, fixed top balance panel, bottom prize panel, loading/empty/error states
- Hiranmandi game shell with coordinate combinations, lottery grid, visual symbol grid, stake cycling, paytable overlay, free-spin counter, and double mode
- frontend state coverage: loading, spin processing, result, win, lose, double loading, free spins, error, recovery-oriented retry UI
- SOAP backend adapter for `spin`, `double`, and `pay`; mock mode for local UI work

## Integration contract

All postMessage payloads use this envelope:

```js
{
  source: "hiranmandi-iframe", // host uses "partner-site" or "hiranmandi-host"
  contractVersion: "1.0",
  type: "READY",
  payload: {},
  meta: {
    requestId: "evt-...",
    sessionId: "partner-session",
    moduleVersion: "0.1.0",
    mode: "embedded",
    gameId: "hiranmandi",
    timestamp: "2026-05-12T00:00:00.000Z",
    initSource: "query"
  }
}
```

The module validates message origin against `allowedOrigins`, the document referrer origin, or same-origin fallback. Unknown commands, unknown sources, and mismatched contract versions are ignored.

Minimum standalone context:

```text
mode=standalone&token=...&sessionId=...&gameId=...
```

Embedded hosts can either pass the same context in the iframe URL or wait for `READY` and send:

```js
iframe.contentWindow.postMessage({
  source: "partner-site",
  contractVersion: "1.0",
  type: "INIT_CONTEXT",
  payload: {
    mode: "embedded",
    token: "...",
    sessionId: "...",
    userId: "...",
    locale: "en",
    currency: "GEL",
    theme: "dark",
    partnerId: "partner-1",
    gameId: "hiranmandi",
    returnUrl: "https://partner.example/account",
    allowedOrigins: ["https://partner.example"]
  }
}, "https://iframe-domain.example");
```

## Questions for integrators

- Where will the iframe be embedded: page, popup, cabinet tab, or page block?
- What are the expected container sizes, and should height be fixed or adaptive?
- Which domains should be allowed origins?
- Does the partner have CSP, storage, third-party cookie, or mobile webview restrictions?
- How is auth passed: token, signed URL, backend session init, or query params?
- Who owns session refresh, and what should happen when a token expires?
- Should the iframe hide its header, show a back button, or delegate navigation to the host?
- Which runtime theme, locale, balance, modal, and close commands must be supported?
- Does the host need `READY`, `RESIZE`, error, maintenance, and session-expired events?
- What should the host show if iframe load or init fails?

## Backend integration points

`src/api/frameApi.js` sends SOAP RPC requests to:

```text
http://5.187.2.138/soap/SlotHiranmandiSOAP.dll/soap/IInBet
```

The WSDL exposes `GetMessage(Value: string)`, so the adapter wraps each backend XML message in a SOAP envelope:

- `spin(...)` sends `SetSlotSpinHiranmandi`
- `double(...)` sends `GetSlotDubleHiranmandi` and retries unanswered requests
- `pay(...)` sends `GetSlotPayHiranmandi`

Local development uses the Vite same-origin proxy at `/soap-hiranmandi`, which forwards to the SOAP DLL and avoids browser CORS blocking. In production, expose the same kind of same-origin proxy or pass its URL as `soapEndpoint`.

The hosted Netlify build uses the same path:

```text
https://poetic-pegasus-37aef2.netlify.app/soap-hiranmandi
```

That route is configured in `netlify.toml` as a same-origin proxy to the SOAP backend. If the SOAP backend has its own allowlist, include this frontend origin:

```text
https://poetic-pegasus-37aef2.netlify.app
```

The backend `FreeSpin` value is the source of truth for free-spin awards: `0` means no award, and any positive number is the awarded free-spin count. The iframe only tracks and decrements the remaining awarded free spins during playback.
