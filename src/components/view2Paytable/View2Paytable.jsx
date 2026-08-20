import { createContext, useContext } from "react";
import { VIEW2_SYMBOL_CONFIGS } from "../view2Symbols/index.jsx";
import "./View2Paytable.css";
import { getView2MatchPayout, getView2ZeroPayout } from "../../viewModels/view2PaytableViewModel.js";

const VIEW2_COPY = {
  ru: {
    ariaLabel: "Таблица выплат режима визуализации",
    freeSpins: ["Предоставляет 15 бесплатных", "лотерейных квитанций"],
    coefficient: ["Выигрыши рассчитываются", "с коэффициентом x3"],
  },
  tg: {
    ariaLabel: "Ҷадвали пардохти режими намоиш",
    freeSpins: ["15 чиптаи лотереяи", "ройгон медиҳад"],
    coefficient: ["Бурдҳо бо коэффитсиенти", "x3 ҳисоб мешаванд"],
  },
};

const View2SymbolAssetsContext = createContext({ symbolAssets: {}, imageOverrides: {}, hiddenSymbolTiles: [], gameId: undefined });

const getSymbolImage = (symbol, symbolAssets) => {
  const gameAsset = symbolAssets?.[symbol];
  const gameStaticImage =
    typeof gameAsset === "string" ? gameAsset : gameAsset?.staticImage;

  // Dice skins supply a cell background but use the shared View 2 dice face.
  // The info screen should show that face, not the empty cell background.
  return (
    gameStaticImage ??
    VIEW2_SYMBOL_CONFIGS[symbol]?.staticImage ??
    (typeof gameAsset === "object" ? gameAsset?.background : null) ??
    `/assets/img/info-symbols/view2-symbol-${symbol}.webp?v=20260801-assets-lossless`
  );
};

function SymbolTile({ symbol, imageSymbol = symbol, className = "" }) {
  const { symbolAssets, imageOverrides, hiddenSymbolTiles } = useContext(View2SymbolAssetsContext);

  if (hiddenSymbolTiles.includes(symbol)) return null;

  return (
    <span
      className={`view2-info-symbol ${className} symbol-${symbol} info-symbol`}
      aria-hidden="true"
    >
      <img
        className="view2-info-symbol__item"
        src={getSymbolImage(imageOverrides[symbol] ?? imageSymbol, symbolAssets)}
        alt=""
      />
    </span>
  );
}

function PayoutRows({ symbol, counts, payoutMultiplier, compact = false }) {
  const { gameId } = useContext(View2SymbolAssetsContext);
  return (
    <div className={`view2-info-payout-list${compact ? " --compact" : ""}`}>
      {counts.map((count) => {
        const value = getView2MatchPayout(symbol, count, payoutMultiplier, gameId);

        return (
          <div className="view2-info-payout-row" key={`${symbol}-${count}`}>
            <span>{count}x</span>
            <span className={value ? undefined : "--empty"}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function ZeroPayoutRows({ payoutMultiplier, combinationId, compact = false }) {
  const { gameId } = useContext(View2SymbolAssetsContext);
  const isFruits = gameId === "fruits";
  const selectedLines = Number(combinationId) || 1;
  const lineMultiplier = gameId === "babylon" ? selectedLines : selectedLines / 9;
  const zeroPayoutMultiplier = payoutMultiplier * lineMultiplier;
  const counts = isFruits || gameId === "babylon" ? [5, 4, 3] : [5, 4, 3, 2];

  return (
    <div className={`view2-info-payout-list${compact ? " --compact" : ""}`}>
      {counts.map((count) => {
        const value = isFruits
          ? getView2MatchPayout(0, count, payoutMultiplier, gameId)
          : getView2ZeroPayout(count, zeroPayoutMultiplier, gameId);
        return (
          <div className="view2-info-payout-row" key={`zero-${count}`}>
            <span>{count}x</span>
            <span className={value ? undefined : "--empty"}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function PayoutCard({ className, symbol, counts, payoutMultiplier }) {
  const { gameId } = useContext(View2SymbolAssetsContext);
  const showInlineSymbol = gameId === "fruits";

  return (
    <article className={`view2-info-card ${className} `}>
      {showInlineSymbol && (
        <SymbolTile symbol={symbol} className="--payout-card-symbol" />
      )}
      <PayoutRows
        symbol={symbol}
        counts={counts}
        payoutMultiplier={payoutMultiplier}
      />
    </article>
  );
}

export default function View2Paytable({
  language,
  gameId,
  selectedCombinationId,
  payoutMultiplier,
  zeroPayoutMultiplier = payoutMultiplier,
  symbolAssets = {},
  symbolImageOverrides = {},
  hiddenPayoutSymbols = [],
  hiddenSymbolTiles = [],
  onClose,
}) {
  const copy = VIEW2_COPY[language] ?? VIEW2_COPY.ru;
  const isFruits = gameId === "fruits";
  const payoutSymbols = isFruits
    ? {
        main: 7,
        topLeft: 5,
        topRight: 6,
        bottomTopLeft: 3,
        bottomBottomLeft: 1,
        bottomTopRight: 4,
        bottomBottomRight: 2,
        coefficient: 0,
      }
    : gameId === "babylon"
      ? { main: 9, topLeft: 7, topRight: 8, coefficient: 0 }
      : { main: 12, topLeft: 8, topRight: 10, coefficient: 0 };
  const showsSymbolEight = !hiddenPayoutSymbols.includes(8);
  const showsSymbolNine = !hiddenPayoutSymbols.includes(9);
  const showsBottomTopRightCard = isFruits || (showsSymbolNine && gameId !== "babylon");

  return (
    <View2SymbolAssetsContext.Provider value={{ symbolAssets, imageOverrides: symbolImageOverrides, hiddenSymbolTiles, gameId }}>
      <div className="view2-info-paytable" aria-label={copy.ariaLabel}>
        {onClose && (
          <div className="view2-info-inline__close-wrap">
            <button
              className="info-modal__close view2-info-inline__close"
              onClick={onClose}
              type="button"
              aria-label="Close info"
            >
              X
            </button>
          </div>
        )}
        {/* 
      <SymbolTile symbol={11} className="--decor --camel" />
      <SymbolTile symbol={1} className="--decor --dice-left-a" />
      <SymbolTile symbol={4} className="--decor --dice-right-a" />
      <SymbolTile symbol={3} className="--decor --dice-right-b" /> */}
        <div className="info-top">
          <div className="info-card info-top-left">
            {!isFruits && (
              <div className="top-symbols">
                <SymbolTile symbol={7} className="--decor --top-left-b" />
                <SymbolTile symbol={8} className="--decor --top-left-a" />
              </div>
            )}
            <PayoutCard
              className="--left-top"
              symbol={payoutSymbols.topLeft}
              counts={gameId === "babylon" ? [5, 4, 3, 2] : [5, 4, 3]}
              payoutMultiplier={payoutMultiplier}
            />
          </div>
          <article className="view2-info-main-card">
            <div className="main-card-top">
              <SymbolTile symbol={isFruits ? payoutSymbols.main : 12} className="--wild-main" />
              <PayoutRows
                symbol={payoutSymbols.main}
                counts={isFruits ? [5, 4, 3] : [5, 4, 3, 2]}
                payoutMultiplier={payoutMultiplier}
              />
            </div>

            <p className="view2-info-main-card__text">
              {copy.freeSpins.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <SymbolTile symbol={0} className="--free-bag" />
          </article>
          <div className="info-top-right">
            {!isFruits && (
              <div className="top-symbols">
                <SymbolTile symbol={10} className="--decor --top-right-a" />
                <SymbolTile symbol={11} className="--decor --top-right-b" />
              </div>
            )}

            <PayoutCard
              className="--right-top"
              symbol={payoutSymbols.topRight}
              counts={isFruits ? [5, 4, 3] : [5, 4, 3, 2]}
              payoutMultiplier={payoutMultiplier}
            />
          </div>
        </div>
        <div className="info-bottom">
          <div className="info-card info-bottom-left">
            <div className="left-top">
              {!isFruits && (
                <div className="left_top_symbols">
                  <SymbolTile symbol={6} />
                  {gameId !== "babylon" && <SymbolTile symbol={5} />}
                </div>
              )}

              <PayoutCard
                className="--left-middle"
                symbol={isFruits ? payoutSymbols.bottomTopLeft : gameId === "babylon" ? 6 : 5}
                counts={gameId === "babylon" ? [5, 4, 3, 2] : [5, 4, 3]}
                payoutMultiplier={payoutMultiplier}
              />
            </div>
            <div className="left-bottom">
              {!isFruits && (
                <div className="left_top_symbols">
                  {gameId === "babylon" ? <><SymbolTile symbol={3} /><SymbolTile symbol={2} /><SymbolTile symbol={1} /></> : <SymbolTile symbol={1} />}
                </div>
              )}

              <PayoutCard
                className="--left-bottom"
                symbol={isFruits ? payoutSymbols.bottomBottomLeft : 1}
                counts={gameId === "babylon" ? [5, 4, 3] : [5, 4, 3, 2]}
                payoutMultiplier={payoutMultiplier}
              />
            </div>
          </div>

          <article className="view2-info-coeff-card">
            <div className="zero-card-top">
              <SymbolTile symbol={0} className="--coeff-bag" />
              <div className="view2-info-coeff-card__payout">
                <ZeroPayoutRows
                  payoutMultiplier={payoutMultiplier}
                  combinationId={selectedCombinationId}
                  compact
                />
              </div>
            </div>
            <svg
              className="view2-info-coeff-card__arrow"
              xmlns="http://www.w3.org/2000/svg"
              width="62"
              height="16"
              viewBox="0 0 62 16"
              fill="none"
            >
              <path
                d="M30.8154 15.4707L6.23876e-05 3.99717e-05L61.6308 4.53596e-05L30.8154 15.4707Z"
                fill="url(#paint0_linear_31_18004)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_31_18004"
                  x1="74.3812"
                  y1="13.8734"
                  x2="67.6738"
                  y2="-19.6506"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#E1BF64" />
                  <stop offset="0.466346" stop-color="#AA7C11" />
                  <stop offset="1" stop-color="#E6C36A" />
                </linearGradient>
              </defs>
            </svg>
            <p className="view2-info-main-card__text">
              {copy.coefficient.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </article>

          <div className="info-card info-bottom-right">
            {showsBottomTopRightCard && (
              <div className="right-top">
                <PayoutCard
                  className="--right-middle"
                  symbol={isFruits ? payoutSymbols.bottomTopRight : 9}
                  counts={[5, 4, 3]}
                  payoutMultiplier={payoutMultiplier}
                />
                {!isFruits && (
                  <div className="left_top_symbols">
                    <SymbolTile symbol={9} />
                  </div>
                )}
              </div>
            )}

            <div className="right-bottom">
              <PayoutCard
                className="--right-bottom"
                symbol={isFruits ? payoutSymbols.bottomBottomRight : 4}
                counts={[5, 4, 3]}
                payoutMultiplier={payoutMultiplier}
              />
              <div className="left_top_symbols">
                {isFruits ? (
                  <SymbolTile symbol={payoutSymbols.bottomBottomRight} />
                ) : gameId === "babylon" ? (
                  <>
                    <SymbolTile symbol={5} />
                    <SymbolTile symbol={4} />
                  </>
                ) : (
                  <>
                    <SymbolTile symbol={4} />
                    <SymbolTile symbol={3} />
                    <SymbolTile symbol={2} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="view2-info-mobile">
          <article className="view2-info-main-card view2-info-mobile__box">
            <div className="main-card-top">
              <SymbolTile symbol={isFruits ? payoutSymbols.main : 12} className="--wild-main" />
              <PayoutRows
                symbol={payoutSymbols.main}
                counts={isFruits ? [5, 4, 3] : [5, 4, 3, 2]}
                payoutMultiplier={payoutMultiplier}
              />
            </div>
            <p className="view2-info-main-card__text">
              {copy.freeSpins.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <SymbolTile symbol={0} className="--free-bag" />
          </article>

          <div className="view2-info-mobile__symbols">
            <SymbolTile symbol={isFruits ? payoutSymbols.topRight : 10} />
            {!isFruits && <SymbolTile symbol={11} />}
          </div>
          <PayoutCard
            className="view2-info-mobile__box"
            symbol={payoutSymbols.topRight}
            counts={isFruits ? [5, 4, 3] : [5, 4, 3, 2]}
            payoutMultiplier={payoutMultiplier}
          />

          {showsBottomTopRightCard && (
            <div className="view2-info-mobile__row">
              <div className="view2-info-mobile__symbols">
                <SymbolTile symbol={isFruits ? payoutSymbols.bottomTopRight : 9} />
              </div>
              <PayoutCard
                className="view2-info-mobile__box"
                symbol={isFruits ? payoutSymbols.bottomTopRight : 9}
                counts={[5, 4, 3]}
                payoutMultiplier={payoutMultiplier}
              />
            </div>
          )}

          <div className="view2-info-mobile__symbols">
            <SymbolTile symbol={isFruits ? payoutSymbols.topLeft : 8} />
            {!isFruits && <SymbolTile symbol={7} />}
          </div>
          <PayoutCard
            className="view2-info-mobile__box"
            symbol={payoutSymbols.topLeft}
            counts={gameId === "babylon" ? [5, 4, 3, 2] : [5, 4, 3]}
            payoutMultiplier={payoutMultiplier}
          />

          <div className="view2-info-mobile__row">
            <div className="view2-info-mobile__symbols">
              <SymbolTile symbol={isFruits ? payoutSymbols.bottomTopLeft : 6} />
              {isFruits ? null : gameId !== "babylon" && <SymbolTile symbol={5} />}
            </div>
            <PayoutCard
              className="view2-info-mobile__box"
              symbol={isFruits ? payoutSymbols.bottomTopLeft : gameId === "babylon" ? 6 : 5}
              counts={gameId === "babylon" ? [5, 4, 3, 2] : [5, 4, 3]}
              payoutMultiplier={payoutMultiplier}
            />
          </div>

          <div className="view2-info-mobile__row">
            <div className="view2-info-mobile__symbols">
              {isFruits ? (
                  <SymbolTile symbol={payoutSymbols.bottomBottomRight} />
                ) : gameId === "babylon" ? (
                  <>
                    <SymbolTile symbol={5} />
                    <SymbolTile symbol={4} />
                  </>
                ) : (
                  <>
                    <SymbolTile symbol={4} />
                    <SymbolTile symbol={3} />
                    <SymbolTile symbol={2} />
                  </>
                )}
            </div>
            <PayoutCard
              className="view2-info-mobile__box"
              symbol={isFruits ? payoutSymbols.bottomBottomRight : 4}
              counts={[5, 4, 3]}
              payoutMultiplier={payoutMultiplier}
            />
          </div>

          <div className="view2-info-mobile__row">
            <div className="view2-info-mobile__symbols">
              {gameId === "babylon" ? <><SymbolTile symbol={3} /><SymbolTile symbol={2} /><SymbolTile symbol={isFruits ? payoutSymbols.bottomBottomLeft : 1} /></> : <SymbolTile symbol={isFruits ? payoutSymbols.bottomBottomLeft : 1} />}
            </div>
            <PayoutCard
              className="view2-info-mobile__box"
              symbol={isFruits ? payoutSymbols.bottomBottomLeft : 1}
              counts={gameId === "babylon" ? [5, 4, 3] : [5, 4, 3, 2]}
              payoutMultiplier={payoutMultiplier}
            />
          </div>

          <article className="view2-info-coeff-card view2-info-mobile__box">
            <div className="zero-card-top">
              <SymbolTile symbol={0} className="--coeff-bag" />
              <div className="view2-info-coeff-card__payout">
                <ZeroPayoutRows
                  payoutMultiplier={payoutMultiplier}
                  combinationId={selectedCombinationId}
                  compact
                />
              </div>
            </div>
            <img
              className="view2-info-coeff-card__arrow"
              src="/assets/img/view2-coeff-arrow.png"
              alt=""
              aria-hidden="true"
            />
            <p className="view2-info-main-card__text">
              {copy.coefficient.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </article>
        </div>
      </div>
    </View2SymbolAssetsContext.Provider>
  );
}
