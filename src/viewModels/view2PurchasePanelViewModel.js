const formatAmount = (value) => Number(value ?? 0).toFixed(2);

export function buildView2PurchasePanelViewModel({
  amount,
  balance,
  deferredBalance,
  t,
  totalPurchase,
}) {
  return [
    [
      { title: "M X2", value: formatAmount(amount) },
      { center: true, title: t("balance"), value: formatAmount(deferredBalance) },
    ],
    [
      { title: t("purchaseAmount"), value: formatAmount(totalPurchase) },
      { center: true, title: t("balance"), value: formatAmount(balance) },
    ],
  ];
}