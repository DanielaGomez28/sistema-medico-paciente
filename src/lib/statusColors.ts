import { OrderStatus } from '../types';

export const orderStatusColors: Record<OrderStatus, string> = {
  Pendiente: 'bg-primary/10 text-primary border-primary/20',
  'En Preparación': 'bg-primary/25 text-primary border-primary/30',
  Enviado: 'bg-secondary/10 text-primary border-primary',
  Entregado: 'bg-secondary/20 text-secondary border-secondary/25',
  Cancelado: 'bg-secondary/10 text-secondary border-secondary/40',
};

export function getOrderStatusClassName(status: OrderStatus | string): string {
  return orderStatusColors[status as OrderStatus] ?? 'bg-surface-800 text-surface-300 border-surface-700';
}
