import { useView2DoubleSceneViewModel } from "../hooks/useView2DoubleSceneViewModel.js";
import "./View2DoubleScene.css";

export default function View2DoubleScene({
  amount,
  ladderAmount,
  step,
  loading,
  lastPick,
  lastStatus,
  onPick,
}) {
  const view = useView2DoubleSceneViewModel({
    amount,
    ladderAmount,
    lastPick,
    lastStatus,
    step,
  });

  const selectChest = (side) => {
    if (!loading) onPick(side);
  };

  return (
    <section className="view2-double doubling-desktop" aria-busy={loading}>
      <img
        className="view2-double__landscape"
        src={view.backgroundSource}
        alt=""
        aria-hidden="true"
      />

      <div className="view2-double__content">
        <div className="doubling-desktop__levels" aria-hidden="true">
          {view.levels.map((level) => (
            <div
              key={level.id}
              className={`doubling-desktop__level${level.active ? " doubling-desktop__level--active" : ""}`}
            >
              <span>{level.value}</span>
            </div>
          ))}
        </div>

        <div className="view2-double__choices">
          {view.choices.map((choice) => (
            <div
              key={choice.side}
              className={`view2-double__choice view2-double__choice--${choice.side}`}
              role="button"
              tabIndex={loading ? -1 : 0}
              aria-disabled={loading}
              onClick={() => selectChest(choice.side)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectChest(choice.side);
                }
              }}
            >
              {choice.isSelected && choice.status && <ChestSpotlight />}
              <div className="view2-double__chest-frame">
                <img
                  key={choice.source}
                  className={`view2-double__chest view2-double__chest--${choice.variant}${choice.mirrored ? " view2-double__chest--mirrored" : ""}`}
                  src={choice.source}
                  alt=""
                  aria-hidden="true"
                  decoding="sync"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChestSpotlight() {
  return (
    <svg
      className="view2-double__spotlight"
      width="290"
      height="682"
      viewBox="0 28 386 682"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g filter="url(#double-spotlight-shadow)">
        <path
          d="M48 710L142.235 28H256.533L338 698.771C222.464 682.084 187.42 654.9 48 710Z"
          fill="#D48B20"
          fillOpacity="0.4"
        />
      </g>
      <defs>
        <filter
          id="double-spotlight-shadow"
          x="0"
          y="-20"
          width="386"
          height="778"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="2"
            floodColor="#000"
            floodOpacity="0.25"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="24"
            floodColor="#FFD700"
            floodOpacity="0.51"
          />
        </filter>
      </defs>
    </svg>
  );
}
