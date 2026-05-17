import "./Paytable.css";

const labels = {
  title: "Таблица выплат",
  column1: "Номинал лотерейной ставки",
  column2: "Номинал лотерейной комбинации",
  column3: "Группа координат основного игрового поля, составляющие лотерейную комбинацию",
  column4: "Номинал цифрового значения",
  column5: "Обозначение",
  column6: "Количество выпадений цифровых значений в одной группе координат лотерейной комбинации",
};

const matrix = [
  [0, 0, 2, 15, 50],
  [0, 0, 5, 20, 100],
  [0, 0, 5, 20, 100],
  [0, 0, 5, 20, 100],
  [0, 0, 10, 40, 200],
  [0, 0, 10, 40, 200],
  [0, 5, 15, 65, 250],
  [0, 5, 25, 100, 500],
  [0, 5, 30, 200, 1000],
  [0, 10, 80, 1000, 5000],
];

const designations = [
  "eldorado-0.webp",
  "eldorado-1.webp",
  "eldorado-2.webp",
  "eldorado-3.webp",
  "eldorado-4.webp",
  "eldorado-5.webp",
  "eldorado-6.webp",
  "eldorado-7.webp",
  "eldorado-8.webp",
  "eldorado-9.webp",
  "eldorado-10.webp",
];

const fallbackCombinations = {
  1: ["В1-В2-В3-В4-В5"],
  3: ["А1-А2-А3-А4-А5", "В1-В2-В3-В4-В5", "С1-С2-С3-С4-С5"],
  5: ["А1-А2-А3-А4-А5", "В1-В2-В3-В4-В5", "С1-С2-С3-С4-С5", "А1-В2-С3-В4-А5", "С1-В2-А3-В4-С5"],
  7: [
    "А1-А2-А3-А4-А5",
    "В1-В2-В3-В4-В5",
    "С1-С2-С3-С4-С5",
    "А1-В2-С3-В4-А5",
    "С1-В2-А3-В4-С5",
    "B1-A2-A3-A4-B5",
    "B1-C2-C3-C4-B5",
  ],
  9: [
    "А1-А2-А3-А4-А5",
    "В1-В2-В3-В4-В5",
    "С1-С2-С3-С4-С5",
    "А1-В2-С3-В4-А5",
    "С1-В2-А3-В4-С5",
    "B1-A2-A3-A4-B5",
    "B1-C2-C3-C4-B5",
    "A1-A2-B3-C4-C5",
    "C1-C2-B3-A4-A5",
  ],
};

function formatMoney(value, fixed = false) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return fixed ? numeric.toFixed(2) : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(numeric);
}

function formatCoordinate(coordinate) {
  return String(coordinate).replace(/^A/, "А").replace(/^B/, "В").replace(/^C/, "С");
}

function getCombinationNumber(selectedCombination) {
  const title = Number(selectedCombination?.title);
  if (Number.isFinite(title)) return title;
  const id = Number(selectedCombination?.id);
  return Number.isFinite(id) ? id : 1;
}

function getCombinationGroups(selectedCombination, combinationNumber) {
  if (fallbackCombinations[combinationNumber]) {
    return fallbackCombinations[combinationNumber];
  }

  if (Array.isArray(selectedCombination?.groups) && selectedCombination.groups.length > 0) {
    return selectedCombination.groups.map((group) => group.map(formatCoordinate).join("-"));
  }

  if (Array.isArray(selectedCombination?.displayGroups) && selectedCombination.displayGroups.length > 0) {
    return selectedCombination.displayGroups;
  }

  return fallbackCombinations[1];
}

function calculatePayout(value, symbolIndex, stake, combinationNumber) {
  if (!value) return "";
  const total = symbolIndex === 0 ? value * stake * combinationNumber : value * stake;
  return formatMoney(total);
}

function SymbolRows({ stake, combinationNumber }) {
  return matrix.map((row, symbolIndex) => (
    <tr key={symbolIndex}>
      <td>{symbolIndex}</td>
      <td>
        <img className="mevaho-payments__img" alt="image" src={`/img/${designations[symbolIndex]}`} />
      </td>
      {row.map((value, index) => (
        <td key={index}>{calculatePayout(value, symbolIndex, stake, combinationNumber)}</td>
      ))}
    </tr>
  ));
}

function DesktopPayments({ stake, combinationNumber, combinationGroups }) {
  return (
    <table className="mevaho-payments modal-payments__desktop">
      <colgroup>
        <col style={{ width: "15%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "15%" }} />
      </colgroup>
      <thead>
        <tr>
          <th rowSpan="2">{labels.column1}</th>
          <th rowSpan="2">{labels.column2}</th>
          <th rowSpan="2">{labels.column3}</th>
          <th rowSpan="2">{labels.column4}</th>
          <th rowSpan="2">{labels.column5}</th>
          <th colSpan={matrix[0].length}>{labels.column6}</th>
        </tr>
        <tr>
          {matrix[0].map((_, index) => (
            <th key={index}>x{index + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowSpan="100">{formatMoney(stake, true)}</td>
          <td rowSpan="100">{combinationNumber}</td>
          <td rowSpan="100">
            {combinationGroups.map((group, index) => (
              <span className="mevaho-payments__combination" key={group}>
                {group}
                {index !== combinationGroups.length - 1 ? "," : ""}
              </span>
            ))}
          </td>
        </tr>
        <SymbolRows stake={stake} combinationNumber={combinationNumber} />
      </tbody>
    </table>
  );
}

function MobilePayments({ stake, combinationNumber, combinationGroups }) {
  return (
    <div className="mobile-payments modal-payments__mobile">
      <table className="mobile-payments__combination">
        <colgroup>
          <col style={{ width: "30%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "40%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>{labels.column1}</th>
            <th>{labels.column2}</th>
            <th>{labels.column3}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{formatMoney(stake, true)}</td>
            <td>{combinationNumber}</td>
            <td>
              {combinationGroups.map((group, index) => (
                <span className="mevaho-payments__combination" key={group}>
                  {group}
                  {index !== combinationGroups.length - 1 ? "," : ""}
                </span>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
      <table className="mobile-payments__nominal">
        <colgroup>
          <col style={{ width: "10%" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="mevaho-payments__designations" rowSpan="2">
              {labels.column4}
            </th>
            <th rowSpan="2">{labels.column5}</th>
            <th colSpan={matrix[0].length}>{labels.column6}</th>
          </tr>
          <tr>
            {matrix[0].map((_, index) => (
              <th key={index}>x{index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SymbolRows stake={stake} combinationNumber={combinationNumber} />
        </tbody>
      </table>
    </div>
  );
}

export default function Paytable({ rows = [], onClose, loading, error, stake = 10, selectedCombination }) {
  const combinationNumber = getCombinationNumber(selectedCombination);
  const combinationGroups = getCombinationGroups(selectedCombination, combinationNumber);

  return (
    <section className="info-modal --gambusaki">
      <div className="info-modal__container">
        <button type="button" className="info-modal__close" onClick={onClose} aria-label="Close" />
        {loading && <div className="state-panel">Загрузка...</div>}
        {error && <div className="state-panel error">{error}</div>}
        {!loading && !error && (
          <div className="modal-payments">
            <h2 className="modal-payments__title">{labels.title}</h2>
            <DesktopPayments stake={stake} combinationNumber={combinationNumber} combinationGroups={combinationGroups} />
            <MobilePayments stake={stake} combinationNumber={combinationNumber} combinationGroups={combinationGroups} />
          </div>
        )}
      </div>
    </section>
  );
}
