export function formatCurrency(value: number): string {
  return `Bs. ${value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
