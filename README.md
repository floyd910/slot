# Hiranmandi iframe starter

React/Vite frontend for the Hiranmandi iframe game. The normal local flow is the app on port `5174` talking to the new Hiranmandi frame SOAP DLL. Mock mode is still available only for local UI work.

## Run

```bash
npm run dev
```

Open the direct SOAP flow:

```text
http://localhost:5174/?mode=standalone&token=partner-token&sessionId=partner-session&idUser=123213&login=Terminal&password=Gefest&gameId=hiranmandi&currency=GEL&locale=en&idValute=1&balance=1250&backendMode=soap&testMode=false&demoMode=false&backendTestParams=false
```

Use mock UI mode instead of SOAP:

```text
http://localhost:5174/?mode=standalone&token=partner-token&sessionId=partner-session&userId=partner-user&gameId=hiranmandi&currency=GEL&locale=en&backendMode=mock&testMode=true
```

## SOAP Spin Flow

When the player clicks a combination, the selected combination count is sent directly as SOAP `Lines`:

- combination `1` sends `Lines="1"`
- combination `3` sends `Lines="3"`
- combination `5` sends `Lines="5"`
- combination `7` sends `Lines="7"`
- combination `9` sends `Lines="9"`

`src/api/frameApi.js` sends this SOAP message through `GetMessage(Value)`:

```xml
<message MessageType="SetSlotSpinHiranmandiFrame" MessageFormatVersion="1.0">
  <Spin
    Login="..."
    Password="..."
    idUser="..."
    idValute="..."
    Sum="..."
    Lines="..."
    idGame="36"
    DemoSpin="0"
    FreeSpin="0"
  />
</message>
```

The backend response is the source of truth for `WinSum`, `FreeSpin`, `Gold`, `idCard`, `Line1`, `Line2`, `Line3`, and `LineWinKoff1..10`.

The app stores the last direct SOAP request/response on `window.__HIRANMANDI_LAST_SOAP_REQUEST__` and `window.__HIRANMANDI_LAST_SOAP_RESPONSE__` so you can inspect what was sent from the browser console.

## SOAP Endpoint

The new SOAP library is:

```text
http://5.187.2.138/soap/SlotHiranmandiSOAPFrame.dll/soap/IInBet
```

During local dev, Vite forwards same-origin requests from `/soap-hiranmandi` to that DLL so the browser can call it from `http://localhost:5174` without CORS blocking. If the SOAP server allows browser CORS directly, pass `soapEndpoint=http://5.187.2.138/soap/SlotHiranmandiSOAPFrame.dll/soap/IInBet` in the URL.

## Iframe Parameters

Supported query parameters include:

```text
mode, token, sessionId/session, gameId/game, locale/language/lang, currency,
idUser/userId/playerId, login/Login/slotLogin, password/Password/slotPassword,
idValute, balance, soapEndpoint, backendMode, testMode, demoMode,
backendTestParams, theme, returnUrl, featureFlags, allowedOrigins
```

Minimum standalone context:

```text
mode=standalone&token=...&sessionId=...&gameId=...
```

## Integration Contract

The iframe posts events with this envelope:

```js
{
  source: "hiranmandi-iframe",
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

Host commands: `INIT_CONTEXT`, `UPDATE_THEME`, `UPDATE_LOCALE`, `UPDATE_BALANCE`, `FORCE_RELOAD`, `OPEN_MODAL`, `CLOSE_MODULE`.

The `pay` call is still locally mocked because the processed/pay backend call is disabled for now.
