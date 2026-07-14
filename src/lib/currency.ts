/**
 * @fileoverview Utilidad de frontend currency.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
/**
 * Formatea un número como moneda en Bolívares (VES).
 *
 * @param {number} value - El valor numérico a formatear.
 * @returns {string} El valor formateado con el símbolo "Bs." y decimales.
 */
export function formatCurrency(value: number): string {
  return `Bs. ${value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
