import SymbolIcon from "./SymbolIcon.jsx";

export default function Paytable({ rows, onClose, loading, error }) {
  return (
    <section className="modal-layer">
      <div className="paytable-panel">
        <div className="panel-heading">
          <div>
            <small>Info</small>
            <h2>Payments and Symbols</h2>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
        {loading && <div className="state-panel">Loading payment table...</div>}
        {error && <div className="state-panel error">{error}</div>}
        {!loading && !error && rows.length === 0 && <div className="state-panel">No payment data</div>}
        {!loading && !error && rows.length > 0 && (
          <div className="paytable-scroll">
            <table>
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Scatter</th>
                  <th>x1</th>
                  <th>x2</th>
                  <th>x3</th>
                  <th>x4</th>
                  <th>x5</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.match}>
                    <td>{row.match}</td>
                    <td>
                      <span className="scatter-cell">
                        <SymbolIcon value={0} /> {row.bag}
                      </span>
                    </td>
                    <td>{row.base}</td>
                    <td>{row.x2}</td>
                    <td>{row.x3}</td>
                    <td>{row.x4}</td>
                    <td>{row.x5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="rules-strip">
          <span>0 = scatter</span>
          <span>12 = Wild</span>
          <span>3+ scatters = 15 free spins</span>
          <span>Free spin wins use x3</span>
        </div>
      </div>
    </section>
  );
}
