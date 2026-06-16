'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Eye, Calendar, Plus } from 'lucide-react';
import { Order } from '../types';
import { formatCurrency } from '../lib/currency';
import { getDispatchRowClassName, getDispatchStatusLabel } from '../lib/statusColors';
import {
  PageHeader,
  Button,
  FilterBar,
  Input,
  Select,
  Badge,
  EmptyState,
  Card,
  ListCard,
} from './ui';

interface OrdersViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onOpenNewOrder: () => void;
}

export default function OrdersView({ orders, onSelectOrder, onOpenNewOrder }: OrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');

  const dispatchCounts = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === 'Pendiente').length,
      prepared: orders.filter((o) => o.status === 'En Preparación').length,
      dispatched: orders.filter((o) => o.status === 'Enviado' || o.status === 'Entregado').length,
    }),
    [orders]
  );

  const processedOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        const matchesPayment = paymentFilter === 'All' || order.paymentMethod === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'total-desc') return b.total - a.total;
        if (sortBy === 'total-asc') return a.total - b.total;
        return 0;
      });
  }, [orders, searchTerm, statusFilter, paymentFilter, sortBy]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={onOpenNewOrder}>
            <Plus className="h-4 w-4" />
            Registrar Pedido
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="zenith-card dispatch-panel--red p-4 flex items-center justify-between gap-3">
          <div>
            <p className="zenith-field-label flex items-center gap-1.5">
              <span className="dispatch-badge__dot dispatch-badge__dot--red" aria-hidden />
              Pendientes
            </p>
            <p className="dispatch-panel__count--red text-2xl font-bold mt-1 tabular-nums">
              {dispatchCounts.pending}
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">Rojo</span>
        </div>
        <div className="zenith-card dispatch-panel--yellow p-4 flex items-center justify-between gap-3">
          <div>
            <p className="zenith-field-label flex items-center gap-1.5">
              <span className="dispatch-badge__dot dispatch-badge__dot--yellow" aria-hidden />
              Preparados
            </p>
            <p className="dispatch-panel__count--yellow text-2xl font-bold mt-1 tabular-nums">
              {dispatchCounts.prepared}
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">Amarillo</span>
        </div>
        <div className="zenith-card dispatch-panel--green p-4 flex items-center justify-between gap-3">
          <div>
            <p className="zenith-field-label flex items-center gap-1.5">
              <span className="dispatch-badge__dot dispatch-badge__dot--green" aria-hidden />
              Despachados
            </p>
            <p className="dispatch-panel__count--green text-2xl font-bold mt-1 tabular-nums">
              {dispatchCounts.dispatched}
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">Verde</span>
        </div>
      </div>

      <FilterBar columns={4}>
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Buscar por ID o cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-surface-500 shrink-0" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Todos los Estados</option>
            <option value="Pendiente">Pendiente (Rojo)</option>
            <option value="En Preparación">Preparado (Amarillo)</option>
            <option value="Enviado">Despachado (Verde)</option>
            <option value="Entregado">Despachado — Entregado (Verde)</option>
            <option value="Cancelado">Cancelado</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-surface-500 shrink-0" />
          <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="All">Todos los Pagos</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Efectivo">Efectivo</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-surface-500 shrink-0" />
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="date-desc">Fecha: Recientes Primero</option>
            <option value="date-asc">Fecha: Antiguos Primero</option>
            <option value="total-desc">Total: Mayor a Menor</option>
            <option value="total-asc">Total: Menor a Mayor</option>
          </Select>
        </div>
      </FilterBar>

      <Card className="p-0 overflow-hidden">
        {processedOrders.length > 0 ? (
          <>
            <div className="zenith-table-wrap hidden lg:block">
              <table className="zenith-table text-sm">
                <thead>
                  <tr className="border-b border-surface-850 bg-surface-950/20 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Artículos</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Pago</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-850">
                  {processedOrders.map((order) => {
                    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    const orderDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-surface-850/20 transition-colors group ${getDispatchRowClassName(order.status)}`}
                      >
                        <td className="px-6 py-4.5 font-mono font-bold text-white text-xs">{order.id}</td>
                        <td className="px-6 py-4.5 zenith-table__stack">
                          <div className="flex flex-col">
                            <span className="font-semibold text-surface-200">{order.customerName}</span>
                            <span className="text-[10px] text-surface-500">{order.customerEmail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-xs text-surface-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-surface-500" />
                            {orderDate}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-xs text-surface-300 font-medium">
                          {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                        </td>
                        <td className="px-6 py-4.5 font-mono font-semibold text-white text-sm">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4.5 text-xs text-surface-400 font-medium">{order.paymentMethod}</td>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <Badge status={order.status}>{getDispatchStatusLabel(order.status)}</Badge>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <Button variant="outline" size="sm" onClick={() => onSelectOrder(order)}>
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="lg:hidden space-y-3 p-4">
              {processedOrders.map((order) => {
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const orderDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <ListCard
                    key={order.id}
                    title={order.id}
                    subtitle={order.customerName}
                    className={getDispatchRowClassName(order.status)}
                    badge={<Badge status={order.status}>{getDispatchStatusLabel(order.status)}</Badge>}
                    fields={[
                      { label: 'Fecha', value: orderDate },
                      { label: 'Artículos', value: `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}` },
                      { label: 'Total', value: formatCurrency(order.total) },
                      { label: 'Pago', value: order.paymentMethod },
                    ]}
                    actions={
                      <Button variant="outline" size="sm" onClick={() => onSelectOrder(order)}>
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Button>
                    }
                  />
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No se encontraron pedidos"
            description="Intente cambiar las palabras clave o restablecer los filtros de búsqueda."
            className="border-0 rounded-none bg-transparent"
          />
        )}
      </Card>
    </div>
  );
}
