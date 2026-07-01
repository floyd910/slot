import "./View2PurchasePanel.css";
import { useLanguage } from "../i18n.jsx";
import { buildView2PurchasePanelViewModel } from "../viewModels/view2PurchasePanelViewModel.js";

export default function View2PurchasePanel({ amount, deferredBalance, balance, totalPurchase }) {
  const { t } = useLanguage();
  const containers = buildView2PurchasePanelViewModel({
    amount,
    balance,
    deferredBalance,
    t,
    totalPurchase,
  });

  return (
    <div className="purchase-panel view2-purchase-panel">
      <div className="purchase-panel__mobile">
        {containers.map((fields, index) => (
          <div className="purchase-panel__container" key={index}>
            {fields.map((field) => (
              <PurchaseInput
                key={field.title}
                center={field.center}
                title={field.title}
                value={field.value}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PurchaseInput({ title, value, center = false }) {
  return (
    <div className={`purchase-input${center ? " purchase-input--center" : ""}`}>
      <div className="purchase-input__title">{title}</div>
      <div className="purchase-input__value">{value}</div>
    </div>
  );
}