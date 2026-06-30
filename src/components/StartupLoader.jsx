import "./StartupLoader.css";

export default function StartupLoader({ ready, leaving }) {
  return (
    <div
      className={`startup-loader${ready ? " --ready" : ""}${leaving ? " --leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading game"
    >
      <div className="startup-loader__shade" />
    </div>
  );
}
