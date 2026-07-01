import "./View2PurchasePanel.css";
import { useLanguage } from "../i18n.jsx";

export default function View2PurchasePanel({ amount, deferredBalance, balance, totalPurchase }) {
  const { t } = useLanguage();

  return (
    <div className="purchase-panel view2-purchase-panel">
      <div className="purchase-panel__mobile">
        <div className="purchase-panel__container">
          <PurchaseInput title="M X2" value={amount} />
          <PurchaseInput title={t("balance")} value={deferredBalance} center />
        </div>
        <div className="purchase-panel__container">
          <PurchaseInput title={t("purchaseAmount")} value={totalPurchase} />
          <PurchaseInput title={t("balance")} value={balance} center />
        </div>
      </div>
    </div>
  );
}

function PurchaseInput({ title, value, center = false }) {
  return (
    <div className={`purchase-input${center ? " purchase-input--center" : ""}`}>
      <div className="purchase-input__title">{title}</div>
      <div className="purchase-input__value">{Number(value ?? 0).toFixed(2)}</div>
    </div>
  );
}