import { useId } from "react";

const BRIDGE_LINES = {
  right: [0, 50, 100, 50],
  "right-up": [0, 100, 100, 0],
  "right-down": [0, 0, 100, 100],
};

export default function WinLineOverlay({ overlay, variant = "view1" }) {
  const baseGradientId = `win-line-gradient-${useId().replace(/:/g, "")}`;
  if (!overlay || (overlay.arms.length === 0 && !overlay.numberSide)) return null;

  return (
    <span className={`win-line-overlay win-line-overlay--${variant}`} aria-hidden="true">
      {overlay.arms.map((direction) => {
        const points = BRIDGE_LINES[direction];
        if (!points) return null;
        const [x1, y1, x2, y2] = points;
        const gradientId = `${baseGradientId}-${direction}`;
        return (
          <svg
            className={`win-line-overlay__bridge win-line-overlay__bridge--${direction}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            key={direction}
          >
            <defs>
              <linearGradient
                id={gradientId}
                gradientUnits="userSpaceOnUse"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              >
                <stop offset="0%" stopColor="#E1BF64" />
                <stop offset="46.63%" stopColor="#AA7C11" />
                <stop offset="100%" stopColor="#E6C36A" />
              </linearGradient>
            </defs>
            <line className="win-line-overlay__glow" x1={x1} y1={y1} x2={x2} y2={y2} />
            <line
              className="win-line-overlay__path"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={`url(#${gradientId})`}
            />
          </svg>
        );
      })}
      {overlay.numberSide && (
        <span
          className={`win-line-overlay__end-bridge win-line-overlay__end-bridge--${overlay.numberSide}`}
        />
      )}
      {overlay.numberSide && (
        <span className={`win-line-overlay__number win-line-overlay__number--${overlay.numberSide}`}>
          {overlay.lineId}
        </span>
      )}
    </span>
  );
}