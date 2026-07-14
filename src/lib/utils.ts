/**
 * @fileoverview Utilidad de frontend utils.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
