import { useEffect, useRef, useState } from "react";
import "./StartupLoader.css";

export default function StartupLoader({ ready, leaving, variant = "default", progress: measuredProgress, backgroundSrc, label, onExited }) {
  const [progress, setProgress] = useState(0);
  const exitReportedRef = useRef(false);
  const isBrandLoader = variant === "brand";
  const hasMeasuredProgress = Number.isFinite(measuredProgress);

  useEffect(() => {
    if (hasMeasuredProgress) {
      const measured = Math.max(0, Math.min(100, Math.round(measuredProgress)));
      setProgress((current) => Math.max(current, measured));

      return undefined;
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

  const reportExited = () => {
    if (exitReportedRef.current) return;
    exitReportedRef.current = true;
    onExited?.();
  };

  useEffect(() => {
    if (!leaving) {
      exitReportedRef.current = false;
      return undefined;
    }

    // Embedded/occluded frames may omit transitionend. Never let a cosmetic
    // opacity transition hold the game startup gate at 99% indefinitely.
    const timeoutId = window.setTimeout(reportExited, 650);
    return () => window.clearTimeout(timeoutId);
  }, [leaving]);
  const progressText = `${progress}%`;

  const progressBar = (
    <div className="startup-loader__progress" aria-label={`${progress}% loaded`}>
      {label && <div className="startup-loader__label">{label}</div>}
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
        if (event.target === event.currentTarget && event.propertyName === "opacity" && leaving) reportExited();
      }}
    >
      <div className="startup-loader__shade" />
      {isBrandLoader ? (
        <div className="startup-loader__brand">
          {progressBar}
        </div>
      ) : (
        progressBar
      )}
    </div>
  );
}
