import { OrderStatus } from '../types';

export type DispatchSemaphore = 'red' | 'yellow' | 'green' | 'neutral';

/** Semáforo estricto del módulo de despacho */
export const dispatchSemaphoreByStatus: Record<OrderStatus, DispatchSemaphore> = {
  Pendiente: 'red',
  'En Preparación': 'yellow',
  Enviado: 'green',
  Entregado: 'green',
  Cancelado: 'neutral',
};

export const dispatchStatusLabels: Record<OrderStatus, string> = {
  Pendiente: 'Pendiente',
  'En Preparación': 'Preparado',
  Enviado: 'Despachado',
  Entregado: 'Despachado — Entregado',
  Cancelado: 'Cancelado',
};

export function getDispatchSemaphore(status: OrderStatus | string): DispatchSemaphore {
  return dispatchSemaphoreByStatus[status as OrderStatus] ?? 'neutral';
}

export function getDispatchStatusLabel(status: OrderStatus | string): string {
  return dispatchStatusLabels[status as OrderStatus] ?? String(status);
}

export function getOrderStatusClassName(status: OrderStatus | string): string {
  const semaphore = getDispatchSemaphore(status);
  if (semaphore === 'neutral') {
    return 'dispatch-semaphore--neutral';
  }
  return `dispatch-semaphore--${semaphore}`;
}

export function getDispatchRowClassName(status: OrderStatus | string): string {
  const semaphore = getDispatchSemaphore(status);
  if (semaphore === 'neutral') {
    return 'dispatch-row--neutral';
  }
  return `dispatch-row--${semaphore}`;
}

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

export const orderStatusColors: Record<OrderStatus, string> = {
  Pendiente: 'dispatch-semaphore--red',
  'En Preparación': 'dispatch-semaphore--yellow',
  Enviado: 'dispatch-semaphore--green',
  Entregado: 'dispatch-semaphore--green',
  Cancelado: 'dispatch-semaphore--neutral',
};
