/**
 * Formats a number as price with space thousands separator and ₽ symbol
 * e.g., 29500 → "29 500 ₽"
 */
export function formatPrice(num) {
  if (num == null) return 'По запросу';
  if (num === 'по запросу' || isNaN(num)) return 'По запросу';
  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

/**
 * Formats a number with space thousands separator (no currency symbol)
 * e.g., 29500 → "29 500"
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Formats ISO date string to DD.MM.YYYY
 * e.g., "2026-05-26" → "26.05.2026"
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Formats payback months
 * e.g., 8.857 → "~8.9 мес."
 */
export function formatMonths(num) {
  if (num == null || !isFinite(num) || num <= 0) return '—';
  return `~${num.toFixed(1)} мес.`;
}
