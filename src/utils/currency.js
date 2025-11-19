// src/utils/currency.js

// 🔹 Assumption:
// API gives price in *cents* (e.g. 1899 => 18.99 AUD)
// If later they change it to full dollars, you just switch fromMinorUnit to false where needed.

export function formatPriceAUD(amount, options = {}) {
  const { fromMinorUnit = true } = options;

  if (amount == null || isNaN(amount)) {
    return "$0.00";
  }

  const value = fromMinorUnit ? amount / 100 : amount;

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
