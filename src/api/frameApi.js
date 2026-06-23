import { combinations, games, initialGrid, paytable, symbolMap } from "../data/mockData.js";
import { evaluateCoordinateLottery, getScatterCells } from "../gameLogic/coordinateLottery.js";

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = (value) => JSON.parse(JSON.stringify(value));
const DEFAULT_SOAP_ENDPOINT = "/soap-hiranmandi";
const GAME_NUMERIC_ID = "36";
const SOAP_NAMESPACE = "urn:InBetIntf-IInBet";
const SOAP_ACTION = `${SOAP_NAMESPACE}#GetMessage`;
const BACKEND_TEST_PARAMS = {
  idPartner: "1",
  idKassi: "70",
  idValute: "1",
  sum: "10",
  lines: "10",
  idGame: "36",
};

let runtimeConfig = {};

const xmlEscape = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const parseXml = (xml, label = "SOAP response") => {
  const document = new DOMParser().parseFromString(String(xml ?? ""), "text/xml");
  const errorNode = document.querySelector("parsererror");
  if (errorNode) {
    const error = new Error(`Invalid ${label}`);
    error.code = "NETWORK_ERROR";
    throw error;
  }
  return document;
};

const findNode = (document, localName) =>
  Array.from(document.getElementsByTagName("*")).find((node) => node.localName === localName);

const readAttributes = (document, localName) => {
  const node = findNode(document, localName);
  if (!node) return {};
  return Array.from(node.attributes).reduce((attrs, attribute) => {
    attrs[attribute.name] = attribute.value;
    return attrs;
  }, {});
};

const throwBackendErrorIfPresent = (document) => {
  const errorAttrs = readAttributes(document, "Error");
  if (!Object.keys(errorAttrs).length) return;
  const message = errorAttrs.ErrorType || "Backend returned an error";
  const error = new Error(message);
  error.code = "BACKEND_ERROR";
  error.backendErrorId = errorAttrs.ErrorId;
  throw error;
};

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const DEFAULT_BALANCE = 10000;
const CURRENT_ROUND_MULTIPLIER = 3;
const initialBalance = (value) => {
  const balance = asNumber(value, DEFAULT_BALANCE);
  return balance > 0 ? balance : DEFAULT_BALANCE;
};

const isEnabled = (value) =>
  value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";

const parseLine = (value) => {
  if (value == null || value === "") return [];
  const text = String(value).trim();
  const parts = text.includes(",") ? text.split(",") : text.split("");
  return parts.slice(0, 5).map((item) => {
    const clean = String(item).trim();
    return clean === "" ? "" : asNumber(clean, clean);
  });
};

const toKoffArray = (attrs) =>
  Array.from({ length: 10 }, (_, index) => asNumber(attrs[`LineWinKoff${index + 1}`] ?? attrs.LineWinKoff?.split?.(",")?.[index]));

const readLineValues = (document, gameAttrs, lineName) => {
  if (gameAttrs[lineName]) return parseLine(gameAttrs[lineName]);
  const lineAttrs = readAttributes(document, lineName);
  return Array.from({ length: 5 }, (_, index) => asNumber(lineAttrs[`Slot${index + 1}`], ""));
};

const readKoffValues = (document, gameAttrs) =>
  Array.from({ length: 10 }, (_, index) => {
    const lineAttrs = readAttributes(document, `LineWinKoff${index + 1}`);
    return asNumber(lineAttrs.Koff ?? gameAttrs[`LineWinKoff${index + 1}`] ?? gameAttrs.LineWinKoff?.split?.(",")?.[index]);
  });

// The SOAP payload identifies a winning path only by its one-based
// LineWinKoff index. These are the coordinate paths specified for lines 1-9.
// The provider has not supplied coordinates for line 10, so it is deliberately
// left unhighlighted instead of guessing a path on the client.
const BACKEND_LINE_COORDINATES = [
  ["B1", "B2", "B3", "B4", "B5"],
  ["A1", "A2", "A3", "A4", "A5"],
  ["C1", "C2", "C3", "C4", "C5"],
  ["A1", "B2", "C3", "B4", "A5"],
  ["C1", "B2", "A3", "B4", "C5"],
  ["B1", "A2", "A3", "A4", "B5"],
  ["B1", "C2", "C3", "C4", "B5"],
  ["A1", "A2", "B3", "C4", "C5"],
  ["C1", "C2", "B3", "A4", "A5"],
  [],
];

const mapBackendLineWins = (koffs) =>
  koffs.flatMap((value, index) => {
    if (value <= 0) return [];
    const lineId = index + 1;
    return [
      {
        lineId,
        backendValue: value,
        winningCells: BACKEND_LINE_COORDINATES[index] ?? [],
      },
    ];
  });

const buildBonusRow = (gold) => {
  const count = Math.min(5, Math.max(asNumber(gold), asNumber(gold) > 0 ? 2 : 0));
  const row = Array.from({ length: 5 }, () => "");
  const centerOrder = [2, 1, 3, 0, 4];
  centerOrder.slice(0, count).forEach((index) => {
    row[index] = "SCATTER";
  });
  return row;
};

const getSoapEndpoint = () =>
  runtimeConfig.soapEndpoint ??
  window.HIRANMANDI_FRAME_CONFIG?.soapEndpoint ??
  DEFAULT_SOAP_ENDPOINT;

const useSoapBackend = () => {
  const mode = runtimeConfig.backendMode ?? window.HIRANMANDI_FRAME_CONFIG?.backendMode ?? "soap";
  return mode !== "mock";
};

const useBackendTestParams = () =>
  isEnabled(
    runtimeConfig.backendTestParams ??
      window.HIRANMANDI_FRAME_CONFIG?.backendTestParams,
  );

const buildSoapEnvelope = (innerXml) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">
  <soap:Body soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <GetMessage xmlns="${SOAP_NAMESPACE}">
      <Value xsi:type="xsd:string">${xmlEscape(innerXml)}</Value>
    </GetMessage>
  </soap:Body>
</soap:Envelope>`;

const callSoap = async (messageXml) => {
  const response = await fetch(getSoapEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: SOAP_ACTION,
    },
    body: buildSoapEnvelope(messageXml),
  });

  if (!response.ok) {
    const error = new Error(`SOAP request failed with ${response.status}`);
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const soapText = await response.text();
  const soapDocument = parseXml(soapText, "SOAP envelope");
  const fault = findNode(soapDocument, "Fault");
  if (fault) {
    const faultText = findNode(fault, "faultstring")?.textContent ?? "SOAP fault";
    const error = new Error(faultText);
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const returnNode = findNode(soapDocument, "return");
  const payload = returnNode?.textContent?.trim();
  if (!payload) {
    const error = new Error("SOAP response did not include a return payload");
    error.code = "NETWORK_ERROR";
    throw error;
  }
  const payloadDocument = parseXml(payload, "game payload");
  throwBackendErrorIfPresent(payloadDocument);
  return payloadDocument;
};

const callSoapWithRetry = async (messageXml, attempts = 2) => {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await callSoap(messageXml);
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await delay(450);
    }
  }
  throw lastError;
};

const readPrizeValue = (attrs) =>
  asNumber(attrs.PrizeValue ?? attrs.Prize ?? attrs.Wild ?? attrs.GoldValue, 12);

const randomCell = () => Math.floor(Math.random() * 13);

const isLotteryCell = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 12;
};

const normalizeLotteryCell = (value) => Math.trunc(Number(value));

const assertBackendRow = (row, lineName) => {
  if (!Array.isArray(row) || row.length !== 5 || row.some((value) => !isLotteryCell(value))) {
    const error = new Error(`Backend spin response is missing valid ${lineName} values`);
    error.code = "BACKEND_RESPONSE_ERROR";
    throw error;
  }
  return row.map(normalizeLotteryCell);
};

const normalizeBackendGrid = (grid) => ({
  A: assertBackendRow(grid.A, "Line1"),
  B: assertBackendRow(grid.B, "Line2"),
  C: assertBackendRow(grid.C, "Line3"),
  D: Array.isArray(grid.D) ? grid.D.slice(0, 5) : Array.from({ length: 5 }, () => ""),
});

const mapSpinPayload = (document, params) => {
  const gameResultNode = findNode(document, "GameResult");
  if (!gameResultNode) {
    const errorText = document.documentElement?.textContent?.trim() || "Backend spin response did not include GameResult";
    const error = new Error(errorText);
    error.code = "BACKEND_RESPONSE_ERROR";
    throw error;
  }
  const attrs = readAttributes(document, "GameResult");
  const grid = normalizeBackendGrid({
    A: readLineValues(document, attrs, "Line1"),
    B: readLineValues(document, attrs, "Line2"),
    C: readLineValues(document, attrs, "Line3"),
    D: buildBonusRow(attrs.Gold),
  });
  const backendKoffs = readKoffValues(document, attrs);
  const backendWinSum = asNumber(attrs.WinSum);
  const backendLineWins = mapBackendLineWins(backendKoffs);
  const freeSpin = asNumber(attrs.FreeSpin);
  const gold = asNumber(attrs.Gold);
  const scatterCells = freeSpin > 0 ? getScatterCells(grid) : [];
  const scatterCount = scatterCells.length;
  const winningCells = [
    ...new Set(backendLineWins.flatMap((line) => line.winningCells)),
  ];

  return {
    idCard: attrs.idCard ?? attrs.IdCard ?? attrs.IDCard,
    requestId: params.requestId,
    WinSum: backendWinSum,
    BaseWinSum: backendWinSum,
    BackendWinSum: backendWinSum,
    hasBackendWin:
      backendWinSum > 0 || backendLineWins.length > 0 || freeSpin > 0,
    FreeSpin: freeSpin,
    Gold: gold,
    Line1: grid.A.join(","),
    Line2: grid.B.join(","),
    Line3: grid.C.join(","),
    LineWinKoff: backendKoffs,
    BackendLineWinKoff: backendKoffs,
    grid,
    scatterCount,
    scatterCells,
    scatterWin: null,
    winningCells,
    lineWins: backendLineWins,
    isDemo: params.isDemo,
    isFreeSpin: params.isFreeSpin,
    multiplier: asNumber(attrs.Multiplier ?? attrs.WinMultiplier, 1),
    prizeValue: readPrizeValue(attrs),
    symbols: symbolMap,
  };
};

const buildGrid = () => ({
  A: Array.from({ length: 5 }, randomCell),
  B: Array.from({ length: 5 }, randomCell),
  C: Array.from({ length: 5 }, randomCell),
  D: Array.from({ length: 5 }, () => ""),
});

export const frameApi = {
  async initSession(params) {
    runtimeConfig = { ...runtimeConfig, ...params };
    await delay();
    if (params.maintenance) {
      const error = new Error("Maintenance mode");
      error.code = "MAINTENANCE";
      throw error;
    }
    if (!params.token) {
      const error = new Error("Missing token parameter");
      error.code = "ACCESS_DENIED";
      throw error;
    }
    if (!params.sessionId) {
      const error = new Error("Missing sessionId parameter");
      error.code = "INVALID_SESSION";
      throw error;
    }
    if (!params.gameId) {
      const error = new Error("Missing gameId parameter");
      error.code = "CONFIGURATION_ERROR";
      throw error;
    }

    const testMode = isEnabled(params.testMode ?? params.demoMode);

    return {
      player: {
        id: params.userId ?? "demo-player",
        name: "Demo Player",
        balance: testMode
          ? initialBalance(params.testBalance)
          : initialBalance(params.balance),
        currency: params.currency ?? "GEL",
      },
      partner: {
        idPartner: params.idPartner ?? params.partnerId ?? "1",
        idKassi: params.idKassi ?? "70",
        idValute: params.idValute ?? "1",
      },
      games: clone(games),
      combinations: clone(combinations),
      grid: clone(initialGrid),
    };
  },

  async getGames() {
    await delay(260);
    return clone(games);
  },

  async getPaytable() {
    await delay(260);
    return clone(paytable);
  },

  async spin({ stake, lines, isDemo, isFreeSpin, selectedCombination, requestId }) {
    if (useSoapBackend()) {
      const forceTestParams = useBackendTestParams();
      const idPartner = forceTestParams
        ? BACKEND_TEST_PARAMS.idPartner
        : runtimeConfig.idPartner ?? runtimeConfig.partnerId ?? "1";
      const idKassi = forceTestParams
        ? BACKEND_TEST_PARAMS.idKassi
        : runtimeConfig.idKassi ?? "70";
      const idValute = forceTestParams
        ? BACKEND_TEST_PARAMS.idValute
        : runtimeConfig.idValute ?? "1";
      const spinSum = forceTestParams ? BACKEND_TEST_PARAMS.sum : stake;
      const backendLines = forceTestParams
        ? BACKEND_TEST_PARAMS.lines
        : runtimeConfig.backendLines ?? lines;
      const idGame = forceTestParams
        ? BACKEND_TEST_PARAMS.idGame
        : runtimeConfig.backendGameId ?? GAME_NUMERIC_ID;
      const spinMessage = `<message MessageType="SetSlotSpinHiranmandi">
 <Spin
   idPartner="${xmlEscape(idPartner)}"
   idKassi="${xmlEscape(idKassi)}"
   idValute="${xmlEscape(idValute)}"
   Sum="${xmlEscape(spinSum)}"
   Lines="${xmlEscape(backendLines)}"
   idGame="${xmlEscape(idGame)}"
   DemoSpin="${isDemo ? 1 : 0}"
   FreeSpin="${isFreeSpin ? 1 : 0}"
 />
</message>`;
      const document = await callSoap(spinMessage);
      return mapSpinPayload(document, {
        stake: asNumber(spinSum, stake),
        lines,
        isDemo,
        isFreeSpin,
        selectedCombination,
        requestId,
      });
    }

    await delay(850);
    const grid = buildGrid();
    const scatterCells = getScatterCells(grid);
    const scatterCount = scatterCells.length;
    const lotteryResult = evaluateCoordinateLottery({
      grid,
      selectedCombination,
      paytable,
      stake,
      roundMultiplier: isFreeSpin ? CURRENT_ROUND_MULTIPLIER : 1,
      prizeValue: 12,
    });

    const bonusRow = buildBonusRow(scatterCount);

    return {
      idCard: Math.floor(65000000 + Math.random() * 99999),
      requestId,
      WinSum: lotteryResult.WinSum,
      BaseWinSum: lotteryResult.BaseWinSum,
      FreeSpin: scatterCount >= 3 ? 1 : 0,
      Gold: scatterCount >= 2 ? scatterCount : 0,
      Line1: grid.A.join(","),
      Line2: grid.B.join(","),
      Line3: grid.C.join(","),
      LineWinKoff: lotteryResult.LineWinKoff,
      grid: { ...grid, D: bonusRow },
      scatterCount,
      scatterCells: scatterCount >= 2 ? scatterCells : [],
      scatterWin: lotteryResult.ScatterWin,
      winningCells: lotteryResult.winningCells,
      lineWins: lotteryResult.lineWins,
      isDemo,
      isFreeSpin,
      multiplier: lotteryResult.multiplier,
      prizeValue: lotteryResult.prizeValue,
      symbols: symbolMap,
    };
  },

  async double({ idCard, wasDouble, sum, side }) {
    if (useSoapBackend()) {
      const doubleMessage = `<message MessageType="GetSlotDubleHiranmandi">
 <Spin
   idPartner="${xmlEscape(runtimeConfig.idPartner ?? runtimeConfig.partnerId ?? "1")}"
   idCard="${xmlEscape(idCard)}"
   WasDouble="${xmlEscape(wasDouble)}"
   Sum="${xmlEscape(sum)}"
 />
</message>`;
      const document = await callSoapWithRetry(doubleMessage, 3);
      const attrs = readAttributes(document, "GameResult");
      const winSum = asNumber(attrs.WinSum);
      return {
        idCard: attrs.idCard ?? idCard,
        WinSum: winSum,
        WasDouble: wasDouble,
        side,
        status: winSum > 0 ? "win" : "lose",
      };
    }

    await delay(650);
    const won = Math.random() > 0.48;
    return {
      idCard,
      WinSum: won ? Number((sum * 2).toFixed(2)) : 0,
      WasDouble: wasDouble,
      side,
      status: won ? "win" : "lose",
    };
  },

  async pay({ idCard }) {
    if (useSoapBackend()) {
      const payMessage = `<message MessageType="GetSlotPayHiranmandi">
 <Spin idCard="${xmlEscape(idCard)}"/>
</message>`;
      const document = await callSoap(payMessage);
      const attrs = readAttributes(document, "PayResult");
      return {
        idCard: attrs.idCard ?? idCard,
        PayDate: attrs.PayDate ?? new Date().toISOString(),
      };
    }

    await delay(300);
    return {
      idCard,
      PayDate: new Date().toISOString(),
    };
  },
};
