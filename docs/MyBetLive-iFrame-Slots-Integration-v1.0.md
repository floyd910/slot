 
      2026          	 	                                 www.betproduct.com

MyBetLive iFrame

[ Slots ]
VERSION 1 . 0
Table of contents
1.	Introduction             									1
2.	Scheme of work    									2
3.	Protocol conventions  									2
4.	Integration Flow										3
5.	Retrieving token     									3
6.	Partner API										5
7.	Displaying iframe   									14
8.	Frontend communication   								15

Introduction
MyBetLive provides an option to include games on other websites via an Iframe object. Iframe object is a seamlessly embedded browser window which is showing a gaming interface to your visitors. This version allows your visitors to see MyBetLive slot games, but you will have to additionally integrate bets processing on your server to integrate your wallets and keep betting secure. Iframe is taking care of a gaming UI and betting independently, but you will be notified about bets via requests to your backend.

Scheme of work
The integration consists of three communication channels:
1.	
1.	Integrator Server → Game Server
•	Used to obtain an authentication token.
2.	Integrator Website → Game iframe
•	Used to initialize the game session by passing the token and player identifier using window.postMessage().
3.	Game iframe / Game Backend → Integrator API
•	Used to:
•	retrieve player information and balance;
•	authorize bets;
•	cancel/revert rejected bets;
•	settle lost and winning bets;
•	refresh the player's balance.

Protocol conventions

Unless otherwise stated:
•	All API requests use POST.
•	Request parameters are sent using:
Content-Type: application/x-www-form-urlencoded
•	API responses use JSON:
Content-Type: application/json
•	UTF-8 encoding should be used.
•	Monetary values and identifiers should be transferred without locale-specific formatting.
The Integrator’s API should accept request from specific IP only  (TBD).


Integration Flow

The typical game session follows this sequence:
Integrator Server
       |
       | 1. Request access token
       v
Game Server API
       |
       | token
       v
Integrator Website
       |
       | 2. Load iframe
       | 3. Send token + playerID via postMessage()
       v
Game iframe
       |
       | 4. Request player information
       v
Integrator API
       |
       | player / balance / currency / language
       v
Game iframe
       |
       | 5. Player places bet
       v
Integrator API
       |
       | approve / reject
       v
Game Server
       |
       | register bet and perform draw
       |
       +---- rejected ----> Integrator /cancel
       |
       +---- lost --------> Integrator /settle
       |
       +---- won ---------> settlement when winnings
                            are collected or when the
                            double-or-nothing flow completes

Retrieving token
The Integrator's backend requests an access token before launching the game.

Endpoint
POST https://api2.raxshloto.online/token/
Content-Type
Content-Type: application/x-www-form-urlencoded
Parameters
Parameter	Type	Required	Description
login	string	Yes	Integrator account login
password	string	Yes	Integrator account password

Example Request
POST /token/ HTTP/1.1
Host: api2.raxshloto.online
Content-Type: application/x-www-form-urlencoded

login=partner_login&password=partner_password
Successful Response
{
  "token": "generated-token-code"
}
Error Response
{
    "error_code": 401,
    "error": "Unauthorized request"
}

Security
The /token/ endpoint should be called from the Integrator backend, not directly from browser JavaScript.
The token’s life time is limited to 5 minutes and should be refreshed on the iFrame’s requests
Integrator login credentials must never be exposed to the browser.

Partner API
The Integrator must provide an HTTP API that can be called by the Game server.
The base address is referred to throughout this document as:
<PARTNER_API_URL>
For example:
https://partner.example.com/api/
The following operations must be supported:
Operation	Endpoint
Get player information	/user/
Authorize bet	/bet/
Cancel/revert bet	/cancel/
Settle bet	/settle/

Get Player Information
Retrieves current player information, including the current wallet balance.
This endpoint may be called:
•	when the game starts;
•	after a bet;
•	after settlement;
•	after other game events requiring a current balance.
Endpoint
POST <PARTNER_API_URL>/user/
Parameters
Parameter	Type	Description
playerID	string	Unique player identifier in the Integrator system

Expected Response
{
  "name": "John Smith",
  "balance": "125.50",
  "currency": "EUR",
  "language": "en"
}
Response Fields
Field	Type	Description
name	string	Player display name
balance	string/decimal	Current available player balance
currency	string	Player wallet currency
language	string	Preferred player language

Currency
It is recommended that currency use ISO 4217 currency codes, for example:
EUR
USD
GBP
TJS
Language
It is recommended that language use ISO 639-1 codes, for example:
en
bg
de
es
Bet Authorization
Before a bet is registered on the Game server, the game requests authorization from the Integrator.
The Integrator must verify that:
•	the player exists;
•	the player account is active;
•	the player has sufficient balance;
•	the requested currency is valid;
•	the bet is allowed;
•	the same transaction has not already been processed.
Endpoint
Because requests use application/x-www-form-urlencoded, it is recommended that the actual production API use a stable endpoint:

POST <PARTNER_API_URL>/bet
Request
POST <PARTNER_API_URL>/bet HTTP/1.1
Content-Type: application/x-www-form-urlencoded

playerID=123456
betID=BET-982734
amount=5.00
currency=EUR
gameID=32
Parameters
Parameter	Type	Required	Description
playerID	string	Yes	Player identifier
betID	string	Yes	Globally unique bet/transaction identifier
amount	decimal	Yes	Amount to debit
currency	string	Yes	Bet currency
gameID	string	Yes	Game identifier, provided by Game server

Bet Approval
If the Integrator accepts the bet, it should debit/reserve the amount and return an approval response.
Recommended response:
{
  "accepted": true,
  "betID": "BET-982734",
  "partnerBetID": "123354-982734-478963",
}
After receiving approval, Game server:
1.	registers the bet on the game server;
2.	performs the draw/game operation.

Bet Rejection
If the Integrator rejects the bet, no bet operation is performed by the Game game server.
Example rejection response:
{
  "accepted": false,
  "betID": "BET-982734",
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Insufficient player balance"
  }
}
Possible rejection reasons may include:
INSUFFICIENT_FUNDS
PLAYER_NOT_FOUND
PLAYER_BLOCKED
INVALID_CURRENCY
INVALID_AMOUNT
DUPLICATE_TRANSACTION
BET_NOT_ALLOWED
INTERNAL_ERROR
After a rejected bet, Game server sends a cancellation/reversal notification using the /cancel/{betID} endpoint.

Bet rejected by Game server
A bet can be approved by the Integrator but subsequently fail to register or execute on the Game server.
Possible examples include:
•	game server validation failure;
•	game round unavailable;
•	internal processing error;
•	bet registration failure.
In this case Game server sends a cancellation request to the Integrator so that the previously debited/reserved amount can be restored.

Cancel / Revert Bet
Endpoint
POST <PARTNER_API_URL>/cancel/
Parameters
Parameter	Type	Required	Description
betID	string	Yes	Original bet identifier
partnerBetID	string	No	Integrator’s bet id, if previously received

Response
{
  "success": true,
  "betID": "BET-982734",
  "balance": "125.50"
}
The Integrator must ensure that cancelling the same bet more than once does not credit the player more than once.

Bet Settlement
Settlement is performed through the Partner /settle endpoint.
Settlement occurs in several game scenarios.

Lost Bet
If the player loses, Game server sends a settlement request to the Integrator.
Recommended production endpoint:
POST <PARTNER_API_URL>/settle
Example:
POST /settle HTTP/1.1
Content-Type: application/x-www-form-urlencoded

playerID=123456
betID=BET-982734
partnerBetID = 123354-982734-478963,
winAmount=0.00
currency=EUR
result=lost
gameResult = {
    "Line1": {
        "Slot1": "0",
        "Slot2": "3",
        "Slot3": "9",
        "Slot4": "8",
        "Slot5": "1"
    },
    "Line2": {
        "Slot1": "5",
        "Slot2": "1",
        "Slot3": "9",
        "Slot4": "3",
        "Slot5": "12"
    },
    "Line3": {
        "Slot1": "6",
        "Slot2": "11",
        "Slot3": "8",
        "Slot4": "8",
        "Slot5": "3"
    },
    "LineWinKoff1": {
        "Koff": "0"
    },
    "LineWinKoff2": {
        "Koff": "0"
    },
    "LineWinKoff3": {
        "Koff": "0"
    },
    "LineWinKoff4": {
        "Koff": "0"
    },
    "LineWinKoff5": {
        "Koff": "0"
    },
    "LineWinKoff6": {
        "Koff": "0"
    },
    "LineWinKoff7": {
        "Koff": "0"
    },
    "LineWinKoff8": {
        "Koff": "0"
    },
    "LineWinKoff9": {
        "Koff": "0"
    },
    "LineWinKoff10": {
        "Koff": "0"
    },
    "WinSum": "0",
    "FreeSpin": "0",
    "Gold": "0",
    "idCard": "67245702",
    "Number": "63026262"
}

gameResult contains result of a spin

Recommended response:
{
  "accepted": true,
  "betID": "BET-982734",
  "partnerBetID": "123354-982734-478963",
  "balance": "120.50"
}

Winning Bet — Receive Winnings
If the player wins and clicks Receive winnings, Game server sends the winning amount to the Partner.
Recommended production endpoint:
POST <PARTNER_API_URL>/settle
Example:
POST /settle HTTP/1.1
Content-Type: application/x-www-form-urlencoded

playerID=123456
betID=BET-982735
partnerBetID = 9873354-982734-478963,
winAmount=225.40
currency=EUR
result=won
gameResult = {
 
    "Line1": {
        "Slot1": "12",
        "Slot2": "3",
        "Slot3": "2",
        "Slot4": "0",
        "Slot5": "7"
    },
    "Line2": {
        "Slot1": "7",
        "Slot2": "1",
        "Slot3": "3",
        "Slot4": "12",
        "Slot5": "3"
    },
    "Line3": {
        "Slot1": "1",
        "Slot2": "7",
        "Slot3": "10",
        "Slot4": "9",
        "Slot5": "5"
    },
    "LineWinKoff1": {
        "Koff": "0"
    },
    "LineWinKoff2": {
        "Koff": "0"
    },
    "LineWinKoff3": {
        "Koff": "0"
    },
    "LineWinKoff4": {
        "Koff": "2"
    },
    "LineWinKoff5": {
        "Koff": "2"
    },
    "LineWinKoff6": {
        "Koff": "0"
    },
    "LineWinKoff7": {
        "Koff": "0"
    },
    "LineWinKoff8": {
        "Koff": "0"
    },
    "LineWinKoff9": {
        "Koff": "0"
    },
    "LineWinKoff10": {
        "Koff": "0"
    },
    "WinSum": "225.4",
    "FreeSpin": "0",
    "Gold": "0",
    "idCard": "67245734",
    "Number": "95533153",
}

The Integrator credits the player's wallet.
Example response:
{
  "accepted": true,
  "betID": "BET-982735",
  "partnerBetID": "9873354-982734-478963",
  "balance": "330.50"
}

Double-or-Nothing Game
After a winning result, a player may choose to continue playing the double-or-nothing game instead of immediately collecting winnings.
When this game flow finishes, Game server sends the resulting total win amount to the Integrator through the same
POST <PARTNER_API_URL>/settle/
settlement endpoint.

Balance Updates
The iframe may request the player's current balance at various points during the game.
The same player information endpoint is used:
POST <PARTNER_API_URL>/user/
Parameters
Parameter	Type	Description
playerID	string	Unique player identifier in the Integrator system

Expected Response
{
  "name": "John Smith",
  "balance": "125.50",
  "currency": "EUR",
  "language": "en"
}
The Partner wallet should always be considered the authoritative source of the player's current balance.

Idempotency
Financial operations must be idempotent.
The Partner must not process the same transaction more than once.
In particular:
/bet
/cancel
/settle
must safely handle duplicate requests.
The unique betID, or partnerBetID should be used for duplicate detection.



Displaying iframe
After you have acquired an authentication token, you can display an iframe on your page, to do this you just need to add an “iframe” tag to your html with the correct url in “src” attribute. This can be done either on the backend during page generation or on the frontend via javascript. To build a url use https://betproduct-vsports.com/ as a base and append additional parameters in GET parameter format to it. There is a single required GET parameter - token, it is required to authenticate and to display iframe content. You can append optional parameters:
lang - attribute specifies which language should be used and is optional, language will default to english. Iframe supports the following languages: English - 'eng', Russian - 'rus', Czech - 'cz', Georgian - 'geo', Turkish – 'tur'.
timezone - timezone for which we should format dates in bets history, list of supported timezones can be found here https://www.php.net/manual/en/timezones.php 
format - default odds format. 'decimal', 'american', 'fractional', 'hong-kong', 'malaz' and 'indo' formats are supported. Default format is decimal. Setting this parameter will only change how odds are displayed in frame, decimal format will still be used in all internal requests. This setting can be later changed via javascript.
hide - allows you to hide some game types inside the frame, and accepts a comma-separated list of games: 'football', 'basketball', 'tennis', 'horses', 'dogs'.

You need to include the “allowfullscreen” attribute to allow video playing in fullscreen and it is recommended to set an initial height to iframe. An example of iframe tag:

<iframe id="bets" width="100%" height="700px" allowfullscreen="" allow="autoplay; fullscreen" src="https://betproduct-vsports.com/?token=your_token&lang=rus&timezone=Australia/Adelaide&format=american&hide=football,tennis"></iframe>

Iframe will display available bets and games on its own and will allow users to make bets on its own, you will receive notifications on your backend when users make bets and outcomes will be calculated.


Frontend communication
Additionally iframe provides a small subset of frontend functionality you can use to communicate with its UI. To communicate with the parent window, iframe uses the postMessage method, generating “message” events on your website's window which notify you of changes. Same method is used to specify a set of commands to update the iframe interface. Each notification will have a data property set with standard object {event: event, data: data}, where the event will hold a string with an event name which should be used to determine which event you are handling and data property which will hold an object with event-related information.
Available events:

Available commands:

---

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

