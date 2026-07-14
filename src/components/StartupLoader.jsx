import { useEffect, useState } from "react";
import "./StartupLoader.css";

export default function StartupLoader({ ready, leaving, variant = "default" }) {
  const [progress, setProgress] = useState(0);
  const isBrandLoader = variant === "brand";

  useEffect(() => {
    if (ready) {
      setProgress(100);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 95) return current;
        const step = current < 60 ? 4 : current < 85 ? 2 : 1;
        return Math.min(95, current + step);
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [ready]);

  const progressBar = (
    <div className="startup-loader__progress" aria-label={`${progress}% loaded`}>
      <div className="startup-loader__progress-track">
        <div
          className="startup-loader__progress-fill"
          style={{ width: `${progress}%` }}
        />
        <span className="startup-loader__progress-value">{progress}%</span>
      </div>
    </div>
  );

  return (
    <div
      className={`startup-loader startup-loader--${variant}${ready ? " --ready" : ""}${leaving ? " --leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading game"
    >
      <div className="startup-loader__shade" />
      {isBrandLoader ? (
        <div className="startup-loader__brand">
          <div className="startup-loader__brand-wordmark">betproduct.com</div>
          {progressBar}
        </div>
      ) : (
        progressBar
      )}
    </div>
  );
}
