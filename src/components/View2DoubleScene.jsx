import { useView2DoubleSceneViewModel } from "../hooks/useView2DoubleSceneViewModel.js";
import "./View2DoubleScene.css";

export default function View2DoubleScene({
  closedChestSource,
  winningChestSource,
  emptyChestSource,
  gameId,
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
    <section className={`view2-double doubling-desktop${gameId === "egypt" ? " view2-double--egypt" : ""}`} aria-busy={loading}>
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
              {choice.isSelected && choice.status && <ChestSpotlight egypt={gameId === "egypt"} />}
              <div className="view2-double__chest-frame">
                <img
                  className={`view2-double__chest view2-double__chest--${choice.variant}${choice.isSelected && choice.variant !== "closed" ? " view2-double__chest--selected-reveal" : ""}${!choice.isSelected && choice.variant !== "closed" ? " view2-double__chest--other-reveal" : ""}${(choice.variant === "empty" && emptyChestSource ? choice.side === "left" : (choice.variant === "closed" && closedChestSource ? choice.side === "left" : choice.variant === "winning" && winningChestSource ? choice.side === "right" : choice.mirrored)) ? " view2-double__chest--mirrored" : ""}`}
                  src={choice.variant === "closed" && closedChestSource ? closedChestSource : choice.variant === "winning" && winningChestSource ? winningChestSource : choice.variant === "empty" && emptyChestSource ? emptyChestSource : choice.source}
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

function ChestImage({
  choice,
  closedChestSource,
  winningChestSource,
  emptyChestSource,
  openingFrames,
}) {
  const [openingFrame, setOpeningFrame] = useState(null);
  const previousVariant = useRef(choice.variant);

  useEffect(() => {
    const wasClosed = previousVariant.current === "closed";
    previousVariant.current = choice.variant;
    if (!wasClosed || choice.variant === "closed" || !openingFrames?.length) {
      setOpeningFrame(null);
      return undefined;
    }

    setOpeningFrame(0);
    const lateFrameTimer = window.setTimeout(() => setOpeningFrame(1), 80);
    const finalFrameTimer = window.setTimeout(() => setOpeningFrame(null), 160);
    return () => {
      window.clearTimeout(lateFrameTimer);
      window.clearTimeout(finalFrameTimer);
    };
  }, [choice.variant, openingFrames]);

  const source = choice.variant === "closed" && closedChestSource
    ? closedChestSource
    : choice.variant === "winning" && winningChestSource
      ? winningChestSource
      : choice.variant === "empty" && emptyChestSource
        ? emptyChestSource
        : choice.source;
  const mirrored = choice.variant === "empty" && emptyChestSource
    ? choice.side === "left"
    : choice.variant === "closed" && closedChestSource
      ? choice.side === "left"
      : choice.variant === "winning" && winningChestSource
        ? choice.side === "right"
        : choice.mirrored;
  const isOpening = openingFrame !== null;

  return (
    <img
      className={`view2-double__chest view2-double__chest--${isOpening ? "opening" : choice.variant}${mirrored ? " view2-double__chest--mirrored" : ""}`}
      src={isOpening ? openingFrames[openingFrame] : source}
      alt=""
      aria-hidden="true"
      decoding="sync"
      fetchPriority="high"
    />
  );
}
function ChestSpotlight({ egypt = false }) {
  if (egypt) {
    return (
      <svg className="view2-double__spotlight" width="386" height="566" viewBox="0 0 386 566" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <g filter="url(#filter0_dd_114_7502)">
          <path d="M48 518L142.235 -164H256.533L338 506.771C222.464 490.084 187.42 462.9 48 518Z" fill="#D48B20" fillOpacity="0.4" shapeRendering="crispEdges" />
        </g>
        <defs>
          <filter id="filter0_dd_114_7502" x="0" y="-212" width="386" height="778" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
            <feDropShadow dx="0" dy="0" stdDeviation="24" floodColor="#FFD700" floodOpacity="0.51" />
          </filter>
        </defs>
      </svg>
    );
  }

  return (
    <svg className="view2-double__spotlight" width="290" height="682" viewBox="0 28 386 682" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <g filter="url(#double-spotlight-shadow)">
        <path d="M48 710L142.235 28H256.533L338 698.771C222.464 682.084 187.42 654.9 48 710Z" fill="#D48B20" fillOpacity="0.4" />
      </g>
      <defs>
        <filter id="double-spotlight-shadow" x="0" y="-20" width="386" height="778" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="0" stdDeviation="24" floodColor="#FFD700" floodOpacity="0.51" />
        </filter>
      </defs>
    </svg>
  );
}
