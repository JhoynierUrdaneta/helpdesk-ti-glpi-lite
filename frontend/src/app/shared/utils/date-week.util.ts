export function computeWeekFromDateStr(dateStr: string): number {
  if (!dateStr) return 1;
  const parts = dateStr.split('-');
  const day = parseInt(parts[2] || '1', 10);
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}
