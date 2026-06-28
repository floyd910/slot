import "./View2Paytable.css";
import { PAYOUT_ROWS, formatPayoutValue } from "../utils/payoutTable.js";
import { VIEW2_SYMBOL_CONFIGS } from "./view2Symbols/index.jsx";

const VIEW2_INFO_BACKGROUND =
  "/img/extracted/%D0%B8%D0%B3%D1%80%D0%B0-%D0%A5%D1%83%D1%88%D0%BA%D0%BE%D0%BB-%D1%8D%D0%BB%D0%B5%D0%BC%D0%B5%D0%BD%D1%82%D1%8B-%D0%B8%D0%B3%D1%80%D1%8B-1_0/sprite_001_1282x1026_at_1_1.png";

const SYMBOL_FRAME = {
  12: "4.png",
};

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

const symbolRows = new Map(PAYOUT_ROWS.map((row) => [row.symbol, row]));

const getSymbolImage = (symbol) =>
  SYMBOL_FRAME[symbol]
    ? `/img/view2-symbols/symbol${symbol}/${SYMBOL_FRAME[symbol]}`
    : (VIEW2_SYMBOL_CONFIGS[symbol]?.staticImage ??
      `/img/view2-symbols/symbol${symbol}/1.png`);

const getMatchPayout = (symbol, matchCount, payoutMultiplier) =>
  formatPayoutValue(
    symbolRows.get(symbol)?.values[matchCount - 1],
    payoutMultiplier,
  );

function SymbolTile({ symbol, imageSymbol = symbol, className = "" }) {
  return (
    <span
      className={`view2-info-symbol ${className} symbol-${symbol} info-symbol`}
      aria-hidden="true"
    >
      <img
        className="view2-info-symbol__item"
        src={getSymbolImage(imageSymbol)}
        alt=""
      />
    </span>
  );
}

function PayoutRows({ symbol, counts, payoutMultiplier, compact = false }) {
  return (
    <div className={`view2-info-payout-list${compact ? " --compact" : ""}`}>
      {counts.map((count) => {
        const value = getMatchPayout(symbol, count, payoutMultiplier);

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

function PayoutCard({ className, symbol, counts, payoutMultiplier }) {
  return (
    <article className={`view2-info-card ${className} `}>
      <PayoutRows
        symbol={symbol}
        counts={counts}
        payoutMultiplier={payoutMultiplier}
      />
    </article>
  );
}

export default function View2Paytable({ language, payoutMultiplier }) {
  const copy = VIEW2_COPY[language] ?? VIEW2_COPY.ru;

  return (
    <div
      className="view2-info-paytable"
      style={{ "--view2-info-bg": `url("${VIEW2_INFO_BACKGROUND}")` }}
      aria-label={copy.ariaLabel}
    >
      {/* 
      <SymbolTile symbol={11} className="--decor --camel" />
      <SymbolTile symbol={1} className="--decor --dice-left-a" />
      <SymbolTile symbol={4} className="--decor --dice-right-a" />
      <SymbolTile symbol={3} className="--decor --dice-right-b" /> */}
      <div className="info-top">
        <div className="info-card info-top-left">
          <div className="top-symbols">
            <SymbolTile symbol={7} className="--decor --top-left-b" />
            <SymbolTile symbol={8} className="--decor --top-left-a" />
          </div>
          <PayoutCard
            className="--left-top"
            symbol={8}
            counts={[5, 4, 3]}
            payoutMultiplier={payoutMultiplier}
          />
        </div>
        <article className="view2-info-main-card">
          <div className="main-card-top">
            <SymbolTile symbol={12} className="--wild-main" />
            <PayoutRows
              symbol={12}
              counts={[5, 4, 3, 2]}
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
          <div className="top-symbols">
            <SymbolTile symbol={10} className="--decor --top-right-a" />
            <SymbolTile symbol={9} imageSymbol={11} className="--decor --top-right-b" />
          </div>

          <PayoutCard
            className="--right-top"
            symbol={10}
            counts={[5, 4, 3, 2]}
            payoutMultiplier={payoutMultiplier}
          />
        </div>
      </div>
      <div className="info-bottom">
        <div className="info-card info-bottom-left">
          <div className="left-top">
            <div className="left_top_symbols">
              <SymbolTile symbol={6} />
              <SymbolTile symbol={5} />
            </div>

            <PayoutCard
              className="--left-middle"
              symbol={5}
              counts={[5, 4, 3]}
              payoutMultiplier={payoutMultiplier}
            />
          </div>
          <div className="left-bottom">
            <div className="left_top_symbols">
              <SymbolTile symbol={1} />
            </div>

            <PayoutCard
              className="--left-bottom"
              symbol={1}
              counts={[5, 4, 3, 2]}
              payoutMultiplier={payoutMultiplier}
            />
          </div>
        </div>

        <article className="view2-info-coeff-card">
          <div className="zero-card-top">
            <SymbolTile symbol={0} className="--coeff-bag" />
            <div className="view2-info-coeff-card__payout">
              <PayoutRows
                symbol={0}
                counts={[5, 4, 3, 2]}
                payoutMultiplier={payoutMultiplier}
                compact
              />
            </div>
          </div>
          <span className="view2-info-coeff-card__arrow" aria-hidden="true" />
          <p className="view2-info-coeff-card__text">
            {copy.coefficient.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </article>

        <div className="info-card info-bottom-right">
          <div className="right-top">
            <PayoutCard
              className="--right-middle"
              symbol={9}
              counts={[5, 4, 3]}
              payoutMultiplier={payoutMultiplier}
            />
            <div className="left_top_symbols">
              <SymbolTile symbol={11} imageSymbol={9} />
            </div>
          </div>

          <div className="right-bottom">
            <PayoutCard
              className="--right-bottom"
              symbol={4}
              counts={[5, 4, 3]}
              payoutMultiplier={payoutMultiplier}
            />
            <div className="left_top_symbols">
              <SymbolTile symbol={4} />
              <SymbolTile symbol={3} />
              <SymbolTile symbol={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
