// src/utils/currency.js
// ✅ We use dollars everywhere (same as Frappe Desk)

export function formatPriceAUD(amount) {
  const n = Number(amount)
  const value = Number.isFinite(n) ? n : 0

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
