/**
 * Safe backend date generator ensuring no future 2026 dates are saved
 */
export function getSafeIsoDate(d: Date = new Date()): string {
  const date = new Date(d);
  if (date.getFullYear() > 2025) {
    date.setFullYear(2025);
  }
  return date.toISOString();
}

export function getCurrentYear(): number {
  const year = new Date().getFullYear();
  return year > 2025 ? 2025 : year;
}
