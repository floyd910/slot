import { useEffect, useState } from "react";
import "./View2DoubleScene.css";

const DOUBLE_ASSETS =
  "/img/extracted/\u0442\u0443\u0442-\u0444\u043e\u043d--\u0432\u044b\u0431\u043e\u0440-\u0438\u0433\u0440-\u043f\u0435\u0440\u0432\u0430\u044f-\u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430-\u0438-\u0441\u0440\u0430\u0437\u0443-\u043b\u043e\u0442\u043e\u0440\u0435\u0439\u043d\u044b\u0439-\u0440\u0435\u0436\u0438\u043c_\u0443\u0434\u0432\u043e\u0435\u043d\u0438\u0435-5_0";

const asset = (file) => DOUBLE_ASSETS + "/" + file;
const closedChest = asset("sprite_013_144x137_at_333_1554.png");
const winningChest = asset("sprite_014_164x160_at_1_1558.png");
const emptyChest = asset("sprite_006_144x160_at_1866_1.png");

export default function View2DoubleScene({
  amount,
  ladderAmount,
  step,
  loading,
  lastPick,
  lastStatus,
  onPick,
}) {
  const numericAmount = lastStatus === "lose" ? 0 : Number(amount ?? 0);
  const amountLabel = numericAmount === 0 ? "0" : numericAmount.toFixed(2);
  const ladderBaseAmount = Number(ladderAmount ?? amount ?? 0);
  const levels = [32, 16, 8, 4, 2, 1].map((multiplier) =>
    (ladderBaseAmount * multiplier).toFixed(2),
  );
  const [showOtherWinningChest, setShowOtherWinningChest] = useState(false);

  useEffect(() => {
    setShowOtherWinningChest(false);
    if (lastStatus !== "lose" || !lastPick) return undefined;
    const timer = window.setTimeout(() => setShowOtherWinningChest(true), 1500);
    return () => window.clearTimeout(timer);
  }, [lastPick, lastStatus]);

  const chestSource = (side) => {
    const hasResolvedResult = lastStatus === "win" || lastStatus === "lose";
    if (lastPick === side && hasResolvedResult) {
      return lastStatus === "win" ? winningChest : emptyChest;
    }
    if (lastStatus === "lose" && lastPick && showOtherWinningChest) {
      return winningChest;
    }
    return closedChest;
  };

  return (
    <section className="view2-double doubling-desktop" aria-busy={loading}>
      <img
        className="view2-double__landscape"
        src={asset("sprite_001_1336x542_at_1_1.png")}
        alt=""
        aria-hidden="true"
      />
      <img
        className="view2-double__arches"
        src={asset("sprite_010_1336x542_at_1_947.png")}
        alt=""
        aria-hidden="true"
      />

      <div className="view2-double__content">
        <div className="doubling-desktop__ladder" aria-hidden="true">
          <img src={asset("sprite_002_21x194_at_1339_1.png")} alt="" />
          <img src={asset("sprite_003_21x194_at_1419_1.png")} alt="" />
          <div className="doubling-desktop__levels">
            {levels.map((level, index) => {
              const active = index >= levels.length - 1 - step;
              return (
                <div
                  key={index}
                  className={`doubling-desktop__level${active ? " doubling-desktop__level--active" : ""}`}
                >
                  <img
                    src={asset(
                      active
                        ? "sprite_020_160x58_at_163_1826.png"
                        : "sprite_011_160x59_at_211_1491.png",
                    )}
                    alt=""
                  />
                  <span>{level}</span>
                </div>
              );
            })}
          </div>
        </div>
        {lastPick && (
          <img
            className={`view2-double__choice-highlight view2-double__choice-highlight--${lastPick}`}
            src={asset("sprite_004_159x351_at_1447_1.png")}
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="view2-double__choices">
          {["left", "right"].map((side) => (
            <div
              key={side}
              className={`view2-double__choice view2-double__choice--${side}${lastPick === side ? ` view2-double__choice--${lastStatus}` : ""}`}
            >
              <div className="view2-double__chest-frame">
                <img src={chestSource(side)} alt="" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
        <div className="doubling-desktop__result">
          <img src={asset("sprite_012_203x57_at_4_1494.png")} alt="" />
          <span>{amountLabel}</span>
        </div>
        <img
          className="view2-double__character"
          src={asset("sprite_005_250x305_at_1611_1.png")}
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}