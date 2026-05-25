import "./StartupLoader.css";

export default function StartupLoader({ videoSrc, ready, leaving }) {
  return (
    <div
      className={`startup-loader${ready ? " --ready" : ""}${leaving ? " --leaving" : ""}`}
      role="status"
      aria-live="polite"
    >
      <video
        className="startup-loader__video"
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="startup-loader__shade" />
    </div>
  );
}
