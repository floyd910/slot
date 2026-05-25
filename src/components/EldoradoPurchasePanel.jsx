import "./EldoradoPurchasePanel.css";

export default function EldoradoPurchasePanel({
  amount,
  deferredBalance,
  balance,
  totalPurchase,
}) {
  return (
    <div className="purchase-panel eldorado-purchase-panel">
      <div className="purchase-panel__mobile">
        <div className="purchase-panel__container">
          <PurchaseInput title="РќР° X2" value={amount} />
          <PurchaseInput title="Р’ Р±Р°Р»Р°РЅСЃ" value={deferredBalance} center />
        </div>
        <div className="purchase-panel__container">
          <PurchaseInput title="РЎСѓРјРјР° РїРѕРєСѓРїРєРё" value={totalPurchase} />
          <PurchaseInput title="Р‘Р°Р»Р°РЅСЃ" value={balance} center />
        </div>
      </div>
    </div>
  );
}

function PurchaseInput({ title, value, center = false }) {
  return (
    <div className={`purchase-input${center ? " --center" : ""}`}>
      <div className="purchase-input__title">{title}</div>
      <div className="purchase-input__value">
        {Number(value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}
