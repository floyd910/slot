import { asNumber } from "../utils/number.js";
import { sendSoapRequest, readAttributes, findNode, formatSoapDateTime, xmlEscape } from "./soapClient.js";
import { SOAP_CONTRACT_VERSION } from "./soapContract.js";
import { DOUBLE_MAX_STEPS, TERMINAL_SPIN_REQUEST_TIMEOUT_MS, createDoubleState, createEmptyDoublingState } from "../config/gameSettings.js";
import { FREE_SPINS_PER_AWARD, getAwardedFreeSpinCount } from "../utils/freeSpins.js";
import { getTerminalGameConfig, isTerminalGame } from "./terminalGames.js";

export const HIRANMANDI_TERMINAL_GAME_ID = "khiradmandi-makor";
export const HIRANMANDI_TERMINAL_GAME_TYPE = "36";

export const isHiranmandiTerminal = (context = {}) =>
  isTerminalGame(context);

const messageAttributes = (messageType) =>
  `MessageType="${messageType}" MessageDateTime="${formatSoapDateTime()}" MessageFormatVersion="${SOAP_CONTRACT_VERSION}"`;

const requireValue = (value, field) => {
  if (value == null || String(value).trim() === "") {
    throw Object.assign(new Error(`Missing terminal ${field}`), { code: "CONFIGURATION_ERROR" });
  }
  return value;
};

const request = async (methodName, body, options = {}) => {
  const xml = `<message ${messageAttributes(methodName)}>${body}</message>`;
  const response = await sendSoapRequest(methodName, xml, {
    retryAttempts: 1,
    timeoutMs: TERMINAL_SPIN_REQUEST_TIMEOUT_MS,
    ...options,
    meta: { ...options.meta, methodName },
  });
  return response.payloadDocument;
};

export const mapTerminalLoginAttributes = (attrs = {}) => {
  const required = ['idKassi', 'idPartner', 'idValute', 'Valute', 'LimitMin', 'LimitMax'];
  if (required.some((field) => attrs[field] == null || attrs[field] === '')) {
    throw Object.assign(new Error('LoginTerminal returned incomplete terminal data'), { code: 'BACKEND_RESPONSE_ERROR' });
  }
  const limitMin = asNumber(attrs.LimitMin, NaN);
  const limitMax = asNumber(attrs.LimitMax, NaN);
  if (!Number.isFinite(limitMin) || !Number.isFinite(limitMax) || limitMin < 0 || limitMax < limitMin) {
    throw Object.assign(new Error('LoginTerminal returned invalid limits'), { code: 'BACKEND_RESPONSE_ERROR' });
  }
  return {
    ...attrs,
    idKassi: String(attrs.idKassi), idPartner: String(attrs.idPartner), idValute: String(attrs.idValute),
    currency: attrs.Valute, limitMin, limitMax,
    status: attrs.Status ?? attrs.status ?? null,
  };
};

export const loginTerminal = async (context = {}) => {
  const login = requireValue(context.login, "login");
  const password = requireValue(context.password, "password");
  const document = await request(
    "LoginTerminal",
    `<Spin Name="${xmlEscape(login)}" Password="${xmlEscape(password)}" />`,
  );
  return mapTerminalLoginAttributes(readAttributes(document, 'user'));
};

export const buildTerminalWithdrawMessage = (context = {}, amount) => {
  const idKass = requireValue(context.idParentKassi, "idParentKassi");
  const idTerminal = requireValue(context.idKassi, "idKassi");
  const deposit = asNumber(amount, NaN);
  if (!Number.isFinite(deposit) || deposit <= 0) {
    throw Object.assign(new Error("Withdraw amount must be greater than zero"), { code: "CONFIGURATION_ERROR" });
  }
  return `<Onchet idKass="${xmlEscape(idKass)}" idKassir="11" idTerminal="${xmlEscape(idTerminal)}" Depozit="${xmlEscape(Number(deposit.toFixed(2)))}" idState="3" />`;
};


export const withdrawTerminal = async ({ context = {}, amount, requestId } = {}) => {
  const body = buildTerminalWithdrawMessage(context, amount);
  await request("AddDepozitTerminal", body, {
    requestId,
    retryAttempts: 1,
    meta: {
      requestId,
      gameId: context.recoveryGameId ?? context.gameId,
      idTerminal: context.idKassi,
      amount: Number(amount),
    },
  });
  return {
    requestId: requestId ?? null,
    amount: Number(Number(amount).toFixed(2)),
    submitted: true,
  };
};
export const mapTerminalDepositAttributes = (attrs = {}, expectedTerminalId) => {
  const deposit = asNumber(attrs.Depozit, NaN);
  if (!Number.isFinite(deposit) || deposit < 0 ||
      (expectedTerminalId != null && String(attrs.idKassi) !== String(expectedTerminalId))) {
    throw Object.assign(new Error("GetDepozitTerminal returned invalid deposit data"), { code: "BACKEND_RESPONSE_ERROR" });
  }
  return Number(deposit.toFixed(2));
};
export const getTerminalDeposit = async (context = {}) => {
  const idKassi = requireValue(context.idKassi, "idKassi");
  const document = await request(
    "GetDepozitTerminal",
    `<Spin idKassi="${xmlEscape(idKassi)}" />`,
  );
  return mapTerminalDepositAttributes(readAttributes(document, "Terminal"), idKassi);
};

const readLastSpinRow = (document, row) => {
  const attrs = readAttributes(document, `Line${row}`);
  return Array.from({ length: 5 }, (_, index) =>
    asNumber(attrs[`Slot${row}${index + 1}`] ?? attrs[`Slot${index + 1}`], NaN),
  );
};

export const getTerminalLastSpin = async (context = {}) => {
  const idKassi = requireValue(context.idKassi, "idKassi");
  const gameType = context.terminalGameType ?? getTerminalGameConfig(context)?.numericId ?? HIRANMANDI_TERMINAL_GAME_TYPE;
  const document = await request(
    "GetLastSpinList",
    `<Spin idKassi="${xmlEscape(idKassi)}" idGameType="${xmlEscape(gameType)}" idUser="" />`,
  );
  const cardNode = findNode(document, "Card");
  if (!cardNode) return null;
  const card = readAttributes(document, "Card");
  const spin = readAttributes(document, "SpinResult");
  const rows = [1, 2, 3].map((row) => readLastSpinRow(document, row));
  if (rows.some((row) => row.some((value) => !Number.isInteger(value) || value < 0 || value > 12))) {
    throw Object.assign(new Error("GetLastSpinList returned invalid symbol rows"), { code: "BACKEND_RESPONSE_ERROR" });
  }
  const koffAttrs = readAttributes(document, "LinesKoff");
  const idCard = card.idCard ?? spin.idCard;
  const grid = { A: rows[0], B: rows[1], C: rows[2], D: Array(5).fill("") };
  const lineKoffs = Array.from({ length: 10 }, (_, index) => asNumber(koffAttrs[`Koff${index + 1}`], 0));
  const freeSpinsPlayed = asNumber(card.CountFreeSpin, 0);
  const isFreeSpin = String(card.SlotFreeSpin).toLowerCase() === "true";
  const isDemo = String(card.SlotDemoSpin).toLowerCase() === "true";
  const paid = Boolean(card.PayDate?.trim?.());
  const backendWinSum = asNumber(spin.WinSum ?? card.SumPay, 0);
  // PayDate is now assigned to every terminal card during Spin. It no longer means the win was collected.
  const displayedWinSum = backendWinSum;
  const wasDouble = asNumber(spin.WasDouble, 0);
  const lines = asNumber(spin.Lines, 0);
  const stake = asNumber(spin.LineSum, lines > 0 ? asNumber(card.CardSum, 0) / lines : 0);
  const spinResult = {
    idCard,
    Number: spin.Number,
    WinSum: displayedWinSum,
    BaseWinSum: displayedWinSum,
    BackendWinSum: backendWinSum,
    WasDouble: wasDouble,
    FreeSpin: asNumber(spin.FreeSpin ?? card.FreeSpin, 0),
    Gold: asNumber(spin.Gold ?? card.Gold, 0),
    Line1: grid.A.join(","),
    Line2: grid.B.join(","),
    Line3: grid.C.join(","),
    LineWinKoff: lineKoffs,
    BackendLineWinKoff: lineKoffs,
    grid,
    isFreeSpin,
    isDemo,
    backendManagedWallet: true,
    // GetLastSpinList is server history, not proof of an open Take Win action.
    // Terminal SOAP has already settled this card in Deposit. A genuinely
    // interrupted local action is restored separately from recovery state.
    creditedToBalance: true,
  };
  const awardedFreeSpins = getAwardedFreeSpinCount(spinResult);
  let freeSpinsTotal = 0;
  let freeSpinsLeft = 0;
  if (!isFreeSpin && awardedFreeSpins > 0) {
    freeSpinsTotal = awardedFreeSpins;
    freeSpinsLeft = awardedFreeSpins;
  } else if (isFreeSpin && freeSpinsPlayed > 0) {
    // CountFreeSpin is the server-side sequence counter for this Terminal ID.
    // Awards are issued in blocks of 15; a FreeSpin flag on the latest bonus
    // result extends the current block by another 15.
    freeSpinsTotal = Math.ceil(freeSpinsPlayed / FREE_SPINS_PER_AWARD) * FREE_SPINS_PER_AWARD + awardedFreeSpins;
    freeSpinsLeft = Math.max(0, freeSpinsTotal - freeSpinsPlayed);
  }
  const freeSpinsWinTotal = isFreeSpin
    ? asNumber(card.SumPay ?? spin.WinSum, displayedWinSum)
    : 0;
  const freeSpinsActive = freeSpinsLeft > 0;
  const doublingState = createEmptyDoublingState();
  const doubleState = createDoubleState();
  if (displayedWinSum > 0 && wasDouble > 0) {
    Object.assign(doublingState, {
      entered: true,
      active: wasDouble < DOUBLE_MAX_STEPS,
      step: wasDouble,
      marks: Array.from({ length: DOUBLE_MAX_STEPS }, (_, index) => index < wasDouble ? "x2" : ""),
      currentAmount: displayedWinSum,
      initialAmount: displayedWinSum / (2 ** wasDouble),
    });
    doubleState.step = wasDouble + 1;
  }
  const gameState = {
    raw: { ...card, SpinResult: spin },
    idCard,
    roundId: idCard,
    WasDouble: wasDouble,
    doublingState,
    doubleState,
    totalStake: asNumber(card.CardSum, 0),
    stake,
    lines,
    freeSpinsPlayed,
    freeSpinsTotal,
    freeSpinsLeft,
    freeSpinsWinTotal,
    freeSpinsActive,
    grid,
    spinResult,
    currentWinSum: displayedWinSum,
    doubleAvailable: false,
    operationStatus: freeSpinsActive ? "WAITING_FOR_PLAYER_ACTION" : "ROUND_COMPLETED",
    requiresReconciliation: false,
  };
  return {
    card,
    spin,
    idCard,
    grid,
    lineKoffs,
    freeSpinsPlayed,
    isFreeSpin,
    isDemo,
    paid,
    backendWinSum,
    wasDouble,
    spinResult,
    gameState,
  };
};

export const assertTerminalStakeAllowed = (context, totalStake, deposit) => {
  const amount = asNumber(totalStake, NaN);
  if (!Number.isFinite(amount) || amount < 0) {
    throw Object.assign(new Error("Invalid total card amount"), { code: "CONFIGURATION_ERROR" });
  }
  if (amount > 0 && Number.isFinite(Number(context.limitMin)) && amount < Number(context.limitMin)) {
    throw Object.assign(new Error(`Minimum card amount is ${Number(context.limitMin).toFixed(2)}`), { code: "BET_REJECTED" });
  }
  if (Number.isFinite(Number(context.limitMax)) && amount > Number(context.limitMax)) {
    throw Object.assign(new Error(`Maximum card amount is ${Number(context.limitMax).toFixed(2)}`), { code: "BET_REJECTED" });
  }
  if (amount > deposit) {
    throw Object.assign(new Error("Insufficient terminal deposit"), { code: "INSUFFICIENT_FUNDS", balance: deposit });
  }
};
