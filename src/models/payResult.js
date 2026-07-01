export const normalizePayResult = (result = {}) => ({
  ...result,
  idCard: result.idCard ?? result.IdCard ?? result.IDCard ?? null,
  requestId: result.requestId ?? null,
  paidAt: result.paidAt ?? result.PayDate ?? new Date().toISOString(),
});