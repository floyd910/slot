import { useEffect, useState } from "react";
import "./StartupLoader.css";

export default function StartupLoader({ ready, leaving, variant = "default", progress: measuredProgress, backgroundSrc, onExited }) {
  const [progress, setProgress] = useState(0);
  const isBrandLoader = variant === "brand";
  const hasMeasuredProgress = Number.isFinite(measuredProgress);

  useEffect(() => {
    if (hasMeasuredProgress) {
      const measured = Math.max(0, Math.min(100, Math.round(measuredProgress)));
      setProgress((current) => Math.max(current, measured));

      if (measured > 0) return undefined;
      const interval = window.setInterval(() => {
        setProgress((current) => Math.min(12, current + 1));
      }, 120);
      return () => window.clearInterval(interval);
    }

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
  }, [hasMeasuredProgress, measuredProgress, ready]);

  const progressText = `${progress}%`;

  const progressBar = (
    <div className="startup-loader__progress" aria-label={`${progress}% loaded`}>
      <div className="startup-loader__progress-track">
        <div
          className="startup-loader__progress-fill"
          style={{ width: `${progress}%` }}
        />
        <span className="startup-loader__progress-value">{progressText}</span>
      </div>
    </div>
  );

  return (
    <div
      className={`startup-loader startup-loader--${variant}${ready ? " --ready" : ""}${leaving ? " --leaving" : ""}`}
      style={backgroundSrc ? { "--startup-loader-background": `url("${backgroundSrc}")` } : undefined}
      role="status"
      aria-live="polite"
      aria-label="Loading game"
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === "opacity" && leaving) onExited?.();
      }}
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
