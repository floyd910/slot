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

  return (
    <section className="view2-double doubling-desktop" aria-busy={loading}>
      <img
        className={`view2-double__landscape view2-double__landscape--normal${view.isLoss ? " view2-double__landscape--hidden" : ""}`}
        src={view.assets.landscape}
        alt=""
        aria-hidden="true"
      />
      <img
        className={`view2-double__landscape view2-double__landscape--loss${view.isLoss ? " view2-double__landscape--visible" : ""}`}
        src={view.assets.lossLandscape}
        alt=""
        aria-hidden="true"
      />

      <div className="view2-double__content">
        <div className="doubling-desktop__ladder" aria-hidden="true">
          <div className="doubling-desktop__levels">
            {view.levels.map((level, index) => (
              <div
                key={index}
                className={`doubling-desktop__level${level.active ? " doubling-desktop__level--active" : ""}`}
              >
                <span>{level.value}</span>
              </div>
            ))}
          </div>
        </div>
        {view.lastPick && (
          <img
            className={`view2-double__choice-highlight view2-double__choice-highlight--${view.lastPick}`}
            src={view.assets.pickHighlight}
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="view2-double__choices">
          {view.choices.map((choice) => (
            <div
              key={choice.side}
              className={`view2-double__choice view2-double__choice--${choice.side}${choice.lastStatus ? ` view2-double__choice--${choice.lastStatus}` : ""}`}
              role="button"
              tabIndex={loading ? -1 : 0}
              aria-disabled={loading}
              onClick={() => {
                if (!loading) onPick(choice.side);
              }}
              onKeyDown={(event) => {
                if (!loading && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onPick(choice.side);
                }
              }}
            >
              {view.lastPick === choice.side && (
                <svg
                  className="view2-double__spotlight"
                  width="290"
                  height="682"
                  viewBox="0 0 386 758"
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
                      <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
                      <feDropShadow dx="0" dy="0" stdDeviation="24" floodColor="#FFD700" floodOpacity="0.51" />
                    </filter>
                  </defs>
                </svg>
              )}
              <div className="view2-double__chest-frame">
                <img src={choice.chestSource} alt="" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>


      </div>
    </section>
  );
}