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
                  <th />
                  <th>x1</th>
                  <th>x2</th>
                  <th>x3</th>
                  <th>x4</th>
                  <th>x5</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.symbol}>
                    <th>{row.symbol}</th>
                    {[1, 2, 3, 4, 5].map((count) => (
                      <td key={count}>{row[`x${count}`] == null ? "" : Number(row[`x${count}`]).toFixed(2)}</td>
                    ))}
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
