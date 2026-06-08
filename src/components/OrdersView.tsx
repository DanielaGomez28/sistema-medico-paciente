'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Eye, Calendar, Plus } from 'lucide-react';
import { Order } from '../types';
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
        title="Registro de Pedidos"
        description="Listado, filtrado e histórico de transacciones."
        actions={
          <Button onClick={onOpenNewOrder}>
            <Plus className="h-4 w-4" />
            Registrar Pedido
          </Button>
        }
      />

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
            <option value="Pendiente">Pendiente</option>
            <option value="En Preparación">En Preparación</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregado">Entregado</option>
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
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
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
                    <tr key={order.id} className="hover:bg-surface-850/20 transition-colors group">
                      <td className="px-6 py-4.5 font-mono font-bold text-white text-xs">{order.id}</td>
                      <td className="px-6 py-4.5">
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
                        {order.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="px-6 py-4.5 text-xs text-surface-400 font-medium">{order.paymentMethod}</td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <Badge status={order.status}>{order.status}</Badge>
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
                  badge={<Badge status={order.status}>{order.status}</Badge>}
                  fields={[
                    { label: 'Fecha', value: orderDate },
                    { label: 'Artículos', value: `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}` },
                    { label: 'Total', value: order.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) },
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
