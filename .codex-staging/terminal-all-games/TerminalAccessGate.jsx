import { useCallback, useEffect, useState } from "react";
import { terminalAuthApi, terminalProfileStore } from "../../api/terminalAuthApi.js";
import { mergeRuntimeConfig } from "../../api/runtimeConfig.js";
import { useZeroBalanceDepositPolling } from "../../hooks/useZeroBalanceDepositPolling.js";
import { useLanguage } from "../../i18n.jsx";
import "./TerminalAccessGate.css";

const copy = {
  ru: {
    title: "Активация терминала",
    description: "Введите логин и пароль терминала, выданные кассиром.",
    returningDescription: "Terminal ID сохранён. Для безопасного входа повторно введите пароль терминала.",
    terminalLogin: "Логин терминала",
    password: "Пароль терминала",
    activate: "Активировать",
    activating: "Проверка…",
    success: "Терминал успешно активирован",
    invalidCredentials: "Неверный логин или пароль терминала.",
    unavailable: "Не удалось проверить терминал. Проверьте подключение и повторите попытку.",
    serviceTitle: "Смена терминала",
    serviceDescription: "Только для сотрудников казино. Игрокам запрещено изменять данные терминала. Новый терминал станет активным только после успешной проверки.",
    currentTerminal: "Текущий Terminal ID",
    newTerminal: "Новый Terminal ID",
    newPassword: "Пароль нового терминала",
    confirm: "Подтвердить",
    switching: "Проверка…",
    cancel: "Отмена",
    unfinished: "Нельзя сменить терминал: сначала завершите текущую игровую или финансовую операцию.",
  },
  tg: {
    title: "Фаъолсозии терминал",
    description: "Логин ва пароли терминалро, ки хазинадор додааст, ворид кунед.",
    returningDescription: "Terminal ID нигоҳ дошта шудааст. Барои вуруди бехатар паролро дубора ворид кунед.",
    terminalLogin: "Логини терминал",
    password: "Пароли терминал",
    activate: "Фаъол кардан",
    activating: "Санҷиш…",
    success: "Терминал бомуваффақият фаъол шуд",
    invalidCredentials: "Логин ё пароли терминал нодуруст аст.",
    unavailable: "Терминал санҷида нашуд. Пайвастшавиро санҷед ва такрор кунед.",
    serviceTitle: "Иваз кардани терминал",
    serviceDescription: "Танҳо барои кормандони казино. Ба бозигарон тағйир додани маълумоти терминал манъ аст. Терминали нав танҳо пас аз санҷиши муваффақ фаъол мешавад.",
    currentTerminal: "Terminal ID-и ҷорӣ",
    newTerminal: "Terminal ID-и нав",
    newPassword: "Пароли терминали нав",
    confirm: "Тасдиқ",
    switching: "Санҷиш…",
    cancel: "Бекор кардан",
    unfinished: "Терминалро иваз кардан мумкин нест: аввал амалиёти бозӣ ё молиявиро анҷом диҳед.",
  },
};

const isServiceMode = () => new URLSearchParams(window.location.search).get("terminalService") === "1";
const isCredentialError = (error) => ["SOAP_FAULT", "INVALID_CREDENTIALS", "BACKEND_RESPONSE_ERROR"].includes(error?.code);

export default function TerminalAccessGate({ children }) {
  const { language } = useLanguage();
  const text = copy[language] ?? copy.ru;
  const [status, setStatus] = useState("checking");
  const [terminalId, setTerminalId] = useState("");
  const [password, setPassword] = useState("");
  const [currentTerminalId, setCurrentTerminalId] = useState("");
  const [error, setError] = useState("");
  const [terminalBalance, setTerminalBalance] = useState(() => Number(window.GAME_ROOM_CONFIG?.balance));
  const [gameRouteActive, setGameRouteActive] = useState(() => /^#\/games\//.test(window.location.hash));
  const serviceMode = isServiceMode();

  useEffect(() => {
    const syncRoute = () => setGameRouteActive(/^#\/games\//.test(window.location.hash));
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const applyLobbyDeposit = useCallback((balance) => {
    const nextConfig = { ...(window.GAME_ROOM_CONFIG ?? {}), balance: Number(balance) };
    window.GAME_ROOM_CONFIG = nextConfig;
    mergeRuntimeConfig(nextConfig);
    setTerminalBalance(Number(balance));
  }, []);

  useZeroBalanceDepositPolling({
    balance: terminalBalance,
    context: window.GAME_ROOM_CONFIG ?? {},
    enabled: status === "ready" && !gameRouteActive,
    onBalance: applyLobbyDeposit,
  });

  const initialize = async () => {
    setStatus("checking");
    setError("");
    try {
      const result = await terminalAuthApi.init();
      if (result.authenticated) {
        const activeId = String(result.terminal.idKassi ?? result.terminal.terminalId);
        setCurrentTerminalId(activeId);
        setTerminalBalance(Number(window.GAME_ROOM_CONFIG?.balance));
        setStatus(serviceMode ? "service" : "ready");
        return;
      }
      const savedId = result.profile?.idKassi ?? "";
      setTerminalId(savedId);
      setCurrentTerminalId(savedId);
      setStatus("activation");
    } catch (initializationError) {
      const profile = terminalProfileStore.read();
      const savedId = profile?.idKassi ?? profile?.login ?? "";
      setTerminalId(savedId);
      setCurrentTerminalId(savedId);
      setError(isCredentialError(initializationError) ? text.invalidCredentials : text.unavailable);
      setStatus("activation");
    }
  };

  useEffect(() => { initialize(); }, []);

  useEffect(() => {
    const openTerminalManagement = () => {
      const activeId = String(
        window.GAME_ROOM_CONFIG?.idKassi ??
        terminalProfileStore.read()?.idKassi ??
        "",
      );
      setCurrentTerminalId(activeId);
      setTerminalId("");
      setPassword("");
      setError("");
      setStatus("service");
    };
    window.addEventListener("terminal-management-requested", openTerminalManagement);
    return () => window.removeEventListener("terminal-management-requested", openTerminalManagement);
  }, []);

  const showAuthenticationError = (authenticationError) => {
    setError(isCredentialError(authenticationError) ? text.invalidCredentials : text.unavailable);
  };

  const activate = async (event) => {
    event.preventDefault();
    const login = terminalId.trim();
    if (!login || !password) {
      setError(text.invalidCredentials);
      return;
    }
    setStatus("activating");
    setError("");
    try {
      const result = await terminalAuthApi.activate(login, password);
      setCurrentTerminalId(String(result.terminal.idKassi));
      setTerminalBalance(Number(result.deposit));
      setPassword("");
      if (serviceMode) {
        setTerminalId("");
        setStatus("service");
      } else {
        setStatus("success");
        window.setTimeout(() => setStatus("ready"), 700);
      }
    } catch (activationError) {
      showAuthenticationError(activationError);
      setStatus("activation");
    }
  };

  const switchTerminal = async (event) => {
    event.preventDefault();
    const login = terminalId.trim();
    if (!login || !password) {
      setError(text.invalidCredentials);
      return;
    }
    setStatus("switching");
    setError("");
    try {
      const result = await terminalAuthApi.switchTerminal(login, password);
      setCurrentTerminalId(String(result.terminal.idKassi));
      setTerminalBalance(Number(result.deposit));
      setTerminalId("");
      setPassword("");
      const url = new URL(window.location.href);
      url.searchParams.delete("terminalService");
      window.history.replaceState({}, "", `${url.pathname}${url.search}#/slots`);
      setStatus("success");
      window.setTimeout(() => setStatus("ready"), 700);
    } catch (switchError) {
      showAuthenticationError(switchError);
      setStatus("service");
    }
  };

  const cancelService = () => {
    setTerminalId("");
    setPassword("");
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.delete("terminalService");
    window.history.replaceState({}, "", `${url.pathname}${url.search}#/slots`);
    setStatus("ready");
  };

  if (status === "ready") return children;

  if (status === "checking") {
    return <main className="terminal-access"><div className="terminal-access__spinner" aria-label={text.activating} /></main>;
  }

  if (status === "success") {
    return <main className="terminal-access"><section className="terminal-access__card terminal-access__success" role="status"><h1>{text.success}</h1></section></main>;
  }

  if (status === "service" || status === "switching") {
    return (
      <main className="terminal-access"><form className="terminal-access__card" onSubmit={switchTerminal} autoComplete="off" data-form-type="other">
        <h1>{text.serviceTitle}</h1><p>{text.serviceDescription}</p>
        <p className="terminal-access__current">{text.currentTerminal}: <strong>{currentTerminalId}</strong></p>
        <label><span>{text.newTerminal}</span><input type="text" name="terminal-switch-id" inputMode="numeric" pattern="[0-9]+" value={terminalId} onChange={(event) => { setTerminalId(event.target.value.replace(/\D/g, "")); setError(""); }} autoComplete="off" data-1p-ignore data-lpignore="true" required /></label>
        <label><span>{text.newPassword}</span><input type="password" name="terminal-switch-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="new-password" data-1p-ignore data-lpignore="true" required /></label>
        {error && <p className="terminal-access__error" role="alert">{error}</p>}
        <div className="terminal-access__actions">
          <button type="submit" disabled={status === "switching"}>{status === "switching" ? text.switching : text.confirm}</button>
          <button type="button" className="--secondary" onClick={cancelService}>{text.cancel}</button>
        </div>
      </form></main>
    );
  }

  const hasSavedTerminal = Boolean(terminalProfileStore.read()?.idKassi);
  return (
    <main className="terminal-access"><form className="terminal-access__card" onSubmit={activate} autoComplete="off" data-form-type="other">
      <h1>{text.title}</h1><p>{hasSavedTerminal ? text.returningDescription : text.description}</p>
      <label><span>{text.terminalLogin}</span><input type="text" inputMode="numeric" pattern="[0-9]+" value={terminalId} onChange={(event) => { setTerminalId(event.target.value.replace(/\D/g, "")); setError(""); }} autoComplete="off" data-1p-ignore data-lpignore="true" autoFocus={!hasSavedTerminal} required /></label>
      <label><span>{text.password}</span><input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="new-password" data-1p-ignore data-lpignore="true" autoFocus={hasSavedTerminal} required /></label>
      {error && <p className="terminal-access__error" role="alert">{error}</p>}
      <button type="submit" disabled={status === "activating"}>{status === "activating" ? text.activating : text.activate}</button>
    </form></main>
  );
}
