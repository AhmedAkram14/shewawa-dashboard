export function formatPrice(piastres: number): string {
  return (piastres / 100).toFixed(2);
}
