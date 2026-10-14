# Partner frontend iframe integration

This section completes the frontend portion of the MyBetLive Slots 1.0 partner contract. The partner backend must obtain the short-lived token from `POST https://api2.raxshloto.online/token/`; partner credentials must never be placed in browser JavaScript.

Before production launch, provide the exact partner website origin to the game operator so it can be included in `VITE_PARENT_ORIGINS`. Wildcard origins are not accepted.

## Embed and initialize

```html
<iframe
  id="raxsh-slot"
  title="Raxsh slot"
  width="100%"
  height="700"
  allow="autoplay; fullscreen"
  allowfullscreen
  src="https://raxshloto.online/#/slots"
></iframe>

<script type="module">
  const iframe = document.querySelector("#raxsh-slot");
  const iframeOrigin = "https://raxshloto.online";

  // Implement this on the partner site. It calls the partner backend, which
  // obtains/refreshes the five-minute game token without exposing credentials.
  async function getLaunchContext() {
    const response = await fetch("/api/slots/launch", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Unable to launch slot");
    return response.json(); // { token, playerID, language? }
  }

  let initializationPromise = null;
  let tokenRefreshTimer = null;

  function initializeGame() {
    if (initializationPromise) return initializationPromise;
    initializationPromise = (async () => {
      const { token, playerID, language = "eng" } = await getLaunchContext();
      iframe.contentWindow.postMessage(
        {
          event: "INIT_CONTEXT",
          data: { token, playerID, language },
        },
        iframeOrigin,
      );
      // The documented token lifetime is five minutes. Renew before expiry.
      window.clearTimeout(tokenRefreshTimer);
      tokenRefreshTimer = window.setTimeout(initializeGame, 4 * 60 * 1000);
    })().finally(() => {
      initializationPromise = null;
    });
    return initializationPromise;
  }

  window.addEventListener("message", async (message) => {
    if (message.source !== iframe.contentWindow) return;
    if (message.origin !== iframeOrigin) return;

    const event = message.data?.event ?? message.data?.type;
    const data = message.data?.data ?? message.data?.payload ?? {};

    if (event === "READY" && data.needsInitContext) {
      await initializeGame();
    }
    if (event === "RESIZE" && Number.isFinite(Number(data.height))) {
      iframe.style.height = `${Math.ceil(Number(data.height))}px`;
    }
    if (event === "AUTH_REQUIRED" || event === "SESSION_EXPIRED") {
      await initializeGame();
    }
    if (event === "ERROR") {
      console.error("Slot error", data);
    }
  });
</script>
```

Do not put the token or `playerID` in the iframe URL. The iframe removes authentication-like query parameters and accepts launch identity only from the configured parent origin through `postMessage`.

## Message format

The documented format is supported:

```js
{ event: "EVENT_NAME", data: { /* event data */ } }
```

The iframe also emits versioned fields in the same object for integrations that want correlation metadata:

```js
{
  source: "hiranmandi-iframe",
  contractVersion: "1.0",
  type: "EVENT_NAME",
  payload: {},
  event: "EVENT_NAME",
  data: {},
  meta: { requestId, moduleVersion, gameId, timestamp }
}
```

Incoming versioned messages may use `source: "partner-site"`, `contractVersion: "1.0"`, `type`, and `payload`. Both formats are accepted only from the actual parent window and an explicitly approved origin.

## Parent commands

| Command | Data |
| --- | --- |
| `INIT_CONTEXT` | `{ token, playerID, language?, demoMode? }` |
| `UPDATE_LOCALE` | `{ locale }` or `{ language }` |
| `UPDATE_THEME` | `{ theme }` |
| `UPDATE_BALANCE` | `{ balance }` |
| `FORCE_RELOAD` | `{}` |
| `OPEN_MODAL` | `{ modal: "paytable" }` |
| `CLOSE_MODULE` | `{}` |

`playerID`, `playerId`, `userId`, and `idUser` are accepted aliases. For the public contract, use `playerID`. Documented language aliases `eng`, `rus`, `geo`, `tur`, and `cz` are normalized by the iframe.

## Iframe events

| Event | Purpose |
| --- | --- |
| `SLOT_CHOOSER_READY` | Slot chooser assets are ready. |
| `READY` | The selected game is ready to receive `INIT_CONTEXT`. |
| `LOADED` | Initialization or a game operation completed. |
| `RESIZE` | Contains the current iframe `height` and `width`. |
| `UPDATE_BALANCE` | Contains the currently displayed balance and currency when available. |
| `SPIN_RESULT` | Contains `idCard`, final `WinSum`, and double count. |
| `RECOVERY_REQUIRED` | An operation has an unknown result and must be reconciled safely. |
| `AUTH_REQUIRED` | A new valid token/context is required. |
| `SESSION_EXPIRED` | The current session is no longer usable. |
| `ERROR` | Contains a frontend/runtime error code and message. |

The Partner wallet remains authoritative. Financial `/bet`, `/cancel`, `/settle`, and `/user` processing must remain server-to-server and idempotent as described in the backend section of the partner specification.


