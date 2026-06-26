import { AlertTriangle } from "lucide-react";
import "./GameAlert.css";

export default function GameAlert({ message }) {
  if (!message) return null;

  return (
    <div className="game-alert" role="alert" aria-live="assertive" aria-atomic="true">
      <span className="game-alert__accent" aria-hidden="true" />
      <span className="game-alert__icon" aria-hidden="true">
        <AlertTriangle size={20} strokeWidth={2.4} />
      </span>
      <p className="game-alert__message">{message}</p>
    </div>
  );
}