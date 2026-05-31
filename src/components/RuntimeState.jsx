import { AlertTriangle, RotateCcw, WifiOff } from "lucide-react";
import "./RuntimeState.css";
import { useLanguage } from "../i18n.jsx";

const stateKeys = {
  "initial-loading": "preparing", "bootstrap-loading": "validating", ready: "ready",
  processing: "processing", empty: "noGames", error: "somethingWrong",
  "network-error": "networkError", "session-expired": "sessionExpired",
  "unsupported-environment": "unsupported", maintenance: "maintenance",
  "invalid-session": "invalidSession", "access-denied": "accessDenied",
  "configuration-error": "configurationError",
};

export default function RuntimeState({ status, error, mode, onRetry }) {
  const { t } = useLanguage();
  const canRetry = ["network-error", "error", "configuration-error", "initial-loading"].includes(status);
  return (
    <main className="runtime-state">
      <div className="state-icon">
        {status === "network-error" ? <WifiOff size={32} /> : <AlertTriangle size={32} />}
      </div>
      <h1>{t(stateKeys[status] ?? "somethingWrong")}</h1>
      <p>{error || (mode === "embedded" ? t("waitingHost") : t("openSignedContext"))}</p>
      {canRetry && (
        <button type="button" className="primary-button" onClick={onRetry}>
          <RotateCcw size={18} /> {t("retry")}
        </button>
      )}
    </main>
  );
}
