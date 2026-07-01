import { useView2DoubleSceneViewModel } from "../hooks/useView2DoubleSceneViewModel.js";
import "./View2DoubleScene.css";

export default function View2DoubleScene({
  amount,
  ladderAmount,
  step,
  loading,
  lastPick,
  lastStatus,
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
        className="view2-double__landscape"
        src={view.assets.landscape}
        alt=""
        aria-hidden="true"
      />
      <img
        className="view2-double__arches"
        src={view.assets.arches}
        alt=""
        aria-hidden="true"
      />

      <div className="view2-double__content">
        <div className="doubling-desktop__ladder" aria-hidden="true">
          <img src={view.assets.ladderLeft} alt="" />
          <img src={view.assets.ladderRight} alt="" />
          <div className="doubling-desktop__levels">
            {view.levels.map((level, index) => (
              <div
                key={index}
                className={`doubling-desktop__level${level.active ? " doubling-desktop__level--active" : ""}`}
              >
                <img src={level.imageSrc} alt="" />
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
            >
              <div className="view2-double__chest-frame">
                <img src={choice.chestSource} alt="" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
        <div className="doubling-desktop__result">
          <img src={view.assets.resultFrame} alt="" />
          <span>{view.amountLabel}</span>
        </div>
        <img
          className="view2-double__character"
          src={view.assets.character}
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}