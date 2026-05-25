import { AlertTriangle, RotateCcw, WifiOff } from "lucide-react";
import "./RuntimeState.css";

const stateCopy = {
  "initial-loading": "Preparing module...",
  "bootstrap-loading": "Validating session...",
  ready: "Ready",
  processing: "Operation is being processed...",
  empty: "No games are available",
  error: "Something went wrong",
  "network-error": "Network connection was interrupted",
  "session-expired": "Session expired",
  "unsupported-environment": "This environment is not supported",
  maintenance: "Module is temporarily unavailable",
  "invalid-session": "Invalid session",
  "access-denied": "Access denied",
  "configuration-error": "Configuration error",
};

export { stateCopy };

export default function RuntimeState({ status, error, mode, onRetry }) {
  const canRetry = [
    "network-error",
    "error",
    "configuration-error",
    "initial-loading",
  ].includes(status);

  return (
    <main className="runtime-state">
      <div className="state-icon">
        {status === "network-error" ? (
          <WifiOff size={32} />
        ) : (
          <AlertTriangle size={32} />
        )}
      </div>
      <h1>{stateCopy[status] ?? stateCopy.error}</h1>
      <p>
        {error ||
          (mode === "embedded"
            ? "Waiting for host initialization."
            : "Open the module with a valid signed context.")}
      </p>
      {canRetry && (
        <button type="button" className="primary-button" onClick={onRetry}>
          <RotateCcw size={18} />
          Retry
        </button>
      )}
    </main>
  );
}
