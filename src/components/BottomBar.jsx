export default function BottomBar({ player, stake, selectedCombination, freeSpinsLeft, multiplier }) {
  return (
    <footer className="bottom-bar">
      <Info label="Balance" value={`${Number(player?.balance ?? 0).toFixed(2)} ${player?.currency ?? ""}`} />
      <Info label="Purchase" value={stake.toFixed(2)} />
      <Info label="Cashback" value="0.00" />
      <Info label="Combination" value={selectedCombination?.title ?? "-"} />
      <Info label="Stake" value={stake.toFixed(2)} />
      <Info label="Minimum" value="0.10" />
      <Info label="Free Spins Left" value={freeSpinsLeft > 0 ? freeSpinsLeft : "-"} />
      <Info label="Multiplier" value={multiplier > 1 ? `x${multiplier}` : "x1"} />
    </footer>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-cell">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
