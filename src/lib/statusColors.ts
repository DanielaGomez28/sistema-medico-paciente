/**
 * @fileoverview Utilidades de color y etiquetado para estados de pedidos.
 * @description Centraliza el mapeo entre `OrderStatus` y su representación
 * visual (semáforo, clases CSS, etiquetas traducidas) usada en las vistas de
 * despacho, recetas y órdenes.
 */

import { OrderStatus } from '../types';

/**
 * Representa el color semáforo para el estado de despacho de un pedido.
 * @type {DispatchSemaphore}
 */
export type DispatchSemaphore = 'red' | 'yellow' | 'green' | 'neutral';

/** Semáforo estricto del módulo de despacho */
export const dispatchSemaphoreByStatus: Record<OrderStatus, DispatchSemaphore> = {
  Pendiente: 'red',
  'En Preparación': 'yellow',
  Enviado: 'green',
  Entregado: 'green',
  Cancelado: 'neutral',
};

/**
 * Etiquetas descriptivas para cada estado de despacho.
 * @constant {Record<OrderStatus, string>}
 */
export const dispatchStatusLabels: Record<OrderStatus, string> = {
  Pendiente: 'Pendiente',
  'En Preparación': 'Preparado',
  Enviado: 'Despachado',
  Entregado: 'Despachado - Entregado',
  Cancelado: 'Cancelado',
};

/**
 * Obtiene el color de semáforo correspondiente a un estado de pedido.
 *
 * @param {OrderStatus | string} status - Estado actual del pedido.
 * @returns {DispatchSemaphore} Color de semáforo ('red', 'yellow', 'green', 'neutral').
 */
export function getDispatchSemaphore(status: OrderStatus | string): DispatchSemaphore {
  return dispatchSemaphoreByStatus[status as OrderStatus] ?? 'neutral';
}

/**
 * Obtiene la etiqueta amigable correspondiente a un estado de pedido.
 *
 * @param {OrderStatus | string} status - Estado del pedido.
 * @returns {string} Etiqueta descriptiva para mostrar en la interfaz.
 */
export function getDispatchStatusLabel(status: OrderStatus | string): string {
  return dispatchStatusLabels[status as OrderStatus] ?? String(status);
}

/**
 * Devuelve la clase CSS correspondiente para el indicador de estado.
 *
 * @param {OrderStatus | string} status - Estado del pedido.
 * @returns {string} Nombre de la clase CSS.
 */
export function getOrderStatusClassName(status: OrderStatus | string): string {
  const semaphore = getDispatchSemaphore(status);
  if (semaphore === 'neutral') {
    return 'dispatch-semaphore--neutral';
  }
  return `dispatch-semaphore--${semaphore}`;
}

/**
 * Devuelve la clase CSS correspondiente para la fila de una tabla de despachos.
 *
 * @param {OrderStatus | string} status - Estado del pedido.
 * @returns {string} Nombre de la clase CSS de la fila.
 */
export function getDispatchRowClassName(status: OrderStatus | string): string {
  const semaphore = getDispatchSemaphore(status);
  if (semaphore === 'neutral') {
    return 'dispatch-row--neutral';
  }
  return `dispatch-row--${semaphore}`;
}

/**
 * Devuelve la clase CSS de transición para acciones de despacho.
 *
 * @param {OrderStatus} status - Estado del pedido.
 * @returns {string} Nombre de la clase CSS para el botón o acción.
 */
export function getDispatchTransitionClassName(status: OrderStatus): string {
  switch (status) {
    case 'En Preparación':
      return 'dispatch-action--yellow';
    case 'Enviado':
    case 'Entregado':
      return 'dispatch-action--green';
    case 'Cancelado':
      return 'dispatch-action--neutral';
    default:
      return 'dispatch-action--neutral';
  }
}

/**
 * Catálogo único de estados del récipe, en español.
 *
 * El récipe atraviesa tres ejes independientes y cada columna de la interfaz
 * muestra uno distinto:
 *
 * 1. CLÍNICO (`clinical_status`): vigencia de la prescripción médica.
 *      active   -> el médico la emitió y sigue siendo válida.
 *      expired  -> perdió vigencia clínica y ya no puede surtirse.
 *
 * 2. RESERVA / COMERCIAL (`commercial_status`): en qué punto de la compra está.
 *      dispatched_to_pharmacy -> emitida y enviada a la farmacia; nadie la compró aún.
 *      inventory_reserved     -> el stock quedó apartado mientras el paciente decide.
 *      awaiting_payment       -> hay un carrito armado esperando el pago.
 *      paid                   -> el pago se confirmó.
 *      payment_expired        -> venció el tiempo de la reserva sin pagar; el stock volvió.
 *      inventory_released     -> la reserva se soltó a mano (el paciente no compró ahora).
 *      cancelled              -> la compra se anuló.
 *
 * 3. ENTREGA / SURTIDO (`fulfillment_status`): cuánto se dispensó de lo recetado.
 *      not_fulfilled       -> todavía no se entregó ninguna unidad.
 *      partially_fulfilled -> se entregó una parte; el récipe sigue teniendo saldo.
 *      fully_fulfilled     -> se entregó todo: el récipe quedó AGOTADO.
 *
 * OJO: un récipe no vence por fecha, se agota por uso. `expired` es vigencia
 * clínica; `fully_fulfilled` es agotamiento por dispensación.
 */
const RECIPE_STATUS_LABELS: Record<string, string> = {
  // Clínico
  active: 'Vigente',
  activo: 'Vigente',
  activa: 'Vigente',
  expired: 'Sin vigencia',

  // Reserva / comercial
  dispatched_to_pharmacy: 'En farmacia',
  inventory_reserved: 'Stock apartado',
  awaiting_payment: 'Esperando pago',
  pending_payment: 'Esperando pago',
  checkout_pending: 'Compra en curso',
  checkout_in_progress: 'Compra en curso',
  paid: 'Pagado',
  payment_confirmed: 'Pago confirmado',
  payment_expired: 'Reserva vencida',
  inventory_released: 'Reserva liberada',
  cancelled: 'Anulado',
  unpaid: 'Sin pagar',

  // Entrega / surtido
  not_fulfilled: 'Sin entregar',
  partially_fulfilled: 'Entrega parcial',
  fully_fulfilled: 'Agotado',

  // Despacho a farmacia
  received_by_pharmacy: 'Recibido en farmacia',
  reserved: 'Stock apartado',
  released: 'Reserva liberada',
  confirmed: 'Confirmado',

  // Genéricos
  pending: 'Pendiente',
  partial: 'Parcial',
};

/**
 * Traduce estados de back-end (inglés) a español para la UI.
 * @param {string} status - Estado a traducir.
 * @returns {string} Estado traducido.
 */
export function translateStatus(status: string): string {
  return RECIPE_STATUS_LABELS[status?.toLowerCase()?.trim()] || status;
}

/**
 * Clase CSS del badge de estado de recipe (clínico, comercial o surtido).
 */
export function getRecipeStatusBadgeClassName(status: string): string {
  const normalized = status?.toLowerCase().trim().replace(/\s+/g, '_') || '';

  const map: Record<string, string> = {
    active: 'recipe-status-badge--active',
    activo: 'recipe-status-badge--active',
    activa: 'recipe-status-badge--active',
    inventory_reserved: 'recipe-status-badge--inventory-reserved',
    dispatched_to_pharmacy: 'recipe-status-badge--dispatched-pharmacy',
    awaiting_payment: 'recipe-status-badge--awaiting-payment',
    checkout_pending: 'recipe-status-badge--awaiting-payment',
    not_fulfilled: 'recipe-status-badge--not-fulfilled',
    // Sin estos, los estados de reserva vencida o anulada caían al gris neutro
    // y se leían igual que un estado normal.
    payment_expired: 'recipe-status-badge--expired',
    inventory_released: 'recipe-status-badge--expired',
    expired: 'recipe-status-badge--expired',
    cancelled: 'recipe-status-badge--expired',
    paid: 'recipe-status-badge--paid',
    payment_confirmed: 'recipe-status-badge--paid',
    fully_fulfilled: 'recipe-status-badge--paid',
    partially_fulfilled: 'recipe-status-badge--awaiting-payment',
  };

  return map[normalized] ?? 'recipe-status-badge--neutral';
}

/**
 * Clase CSS del badge de estado de médico (activo / suspendido).
 */
export function getDoctorStatusBadgeClassName(status: string): string {
  const normalized = status?.toLowerCase().trim();

  if (normalized === 'activo') {
    return 'doctor-status-badge doctor-status-badge--active';
  }

  if (normalized === 'suspendido') {
    return 'doctor-status-badge doctor-status-badge--suspended';
  }

  return 'doctor-status-badge doctor-status-badge--neutral';
}
