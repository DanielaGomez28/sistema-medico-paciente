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
 * Mapeo estático de estados a clases de colores semáforo.
 * @constant {Record<OrderStatus, string>}
 */
export const orderStatusColors: Record<OrderStatus, string> = {
  Pendiente: 'dispatch-semaphore--red',
  'En Preparación': 'dispatch-semaphore--yellow',
  Enviado: 'dispatch-semaphore--green',
  Entregado: 'dispatch-semaphore--green',
  Cancelado: 'dispatch-semaphore--neutral',
};

/**
 * Traduce estados de back-end (inglés) a español para la UI.
 * @param {string} status - Estado a traducir.
 * @returns {string} Estado traducido.
 */
export function translateStatus(status: string): string {
  const map: Record<string, string> = {
    'active': 'Activo',
    'activo': 'Activo',
    'activa': 'Activo',
    'expired': 'Expirado',
    'paid': 'Pagado',
    'pending_payment': 'Pago Pendiente',
    'awaiting_payment': 'Pago pendiente',
    'unpaid': 'No Pagado',
    'pending': 'Pendiente',
    'partial': 'Parcial',
    'fully_fulfilled': 'Completado',
    'not_fulfilled': 'No surtido',
    'inventory_reserved': 'Inventario reservado',
    'dispatched_to_pharmacy': 'Despachado a farmacia',
    'checkout_pending': 'Checkout Pendiente',
    'payment_confirmed': 'Pago Confirmado',
  };
  return map[status?.toLowerCase()] || status;
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
    not_fulfilled: 'recipe-status-badge--not-fulfilled',
  };

  return map[normalized] ?? 'recipe-status-badge--neutral';
}
