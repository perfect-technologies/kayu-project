/**
 * Format an amount as Congolese Francs (CDF).
 * formatCDF(25000) → "25 000 FC"
 */
export function formatCDF(amount: number): string {
  const formatted = formatNumber(amount);
  return `${formatted} FC`;
}

/**
 * Format a number with space as thousands separator.
 * formatNumber(25000) → "25 000"
 */
export function formatNumber(amount: number): string {
  const parts = amount.toFixed(0).split(".");
  const integerPart = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return integerPart;
}
