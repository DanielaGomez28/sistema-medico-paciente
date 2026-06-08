'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Clock, 
  User, 
  Mail, 
  Phone,
  CheckCircle,
  Truck,
  Play,
  XCircle,
  PackageCheck
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatCurrency } from '../lib/currency';
import {
  getDispatchSemaphore,
  getDispatchStatusLabel,
  getDispatchTransitionClassName,
} from '../lib/statusColors';
import { Badge, Modal, ModalBody, ListCard } from './ui';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus, note: string) => void;
}

export default function OrderDetailModal({ order, onClose, onUpdateStatus }: OrderDetailModalProps) {
  const [transitionNote, setTransitionNote] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);

  if (!order) return null;

  const handleStatusChangeClick = (status: OrderStatus) => {
    setTargetStatus(status);
    setShowNoteField(true);
  };

  const submitStatusChange = () => {
    if (targetStatus) {
      const note = transitionNote.trim() || `Estado cambiado a ${targetStatus}.`;
      onUpdateStatus(order.id, targetStatus, note);
      setTransitionNote('');
      setShowNoteField(false);
      setTargetStatus(null);
    }
  };

  const getTimelineIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente': return Clock;
      case 'En Preparación': return Play;
      case 'Enviado': return Truck;
      case 'Entregado': return CheckCircle;
      case 'Cancelado': return XCircle;
    }
  };

  // Determine what next status choices are available
  const getNextAvailableStatuses = (current: OrderStatus): OrderStatus[] => {
    switch (current) {
      case 'Pendiente':
        return ['En Preparación', 'Cancelado'];
      case 'En Preparación':
        return ['Enviado', 'Cancelado'];
      case 'Enviado':
        return ['Entregado'];
      case 'Entregado':
      case 'Cancelado':
      default:
        return [];
    }
  };

  const nextOptions = getNextAvailableStatuses(order.status);

  return (
    <Modal open={!!order} onClose={onClose} size="xl">
      {order && (
        <>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 border-b border-surface-850 shrink-0 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="zenith-section-title max-w-[min(100%,14rem)] truncate font-mono sm:max-w-none">{order.id}</h3>
            <Badge status={order.status}>{getDispatchStatusLabel(order.status)}</Badge>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ModalBody className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          
          {/* Main order detail and list (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Delivery Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info Card */}
              <div className="p-4 bg-surface-950/40 border border-surface-850 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Información del Cliente
                </h4>
                <div>
                  <p className="text-sm font-semibold text-white">{order.customerName}</p>
                  <p className="text-xs text-surface-400 flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" /> {order.customerEmail}
                  </p>
                </div>
              </div>

              {/* Delivery / Payment Card */}
              <div className="p-4 bg-surface-950/40 border border-surface-850 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Envío y Pago
                </h4>
                <div className="text-xs space-y-1">
                  <p className="text-surface-300 font-semibold flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-surface-400" /> Método: {order.paymentMethod}
                  </p>
                  <p className="text-surface-400 mt-1 truncate" title={order.shippingAddress}>
                    Dirección: {order.shippingAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Product items list */}
            <div className="border border-surface-850 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-surface-950/25 border-b border-surface-850">
                <h4 className="zenith-section-title">Artículos del Pedido</h4>
              </div>
              <div className="zenith-table-wrap hidden lg:block">
                <table className="zenith-table text-sm">
                  <thead>
                    <tr className="border-b border-surface-850 bg-surface-950/10 text-xs text-surface-400 font-bold uppercase">
                      <th className="px-4 py-3 zenith-table__stack">Producto</th>
                      <th className="px-4 py-3 text-right">Precio</th>
                      <th className="px-4 py-3 text-center">Cant.</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-850/60">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-950/10">
                        <td className="px-4 py-3 zenith-table__stack">
                          <p className="font-semibold text-white">{item.productName}</p>
                          <span className="text-[10px] text-surface-500 font-mono">ID: {item.productId}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-surface-400">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-white">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-white">
                          {formatCurrency((item.price * item.quantity))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden p-4 space-y-3">
                {order.items.map((item, idx) => (
                  <ListCard
                    key={idx}
                    title={item.productName}
                    subtitle={`ID: ${item.productId}`}
                    fields={[
                      {
                        label: 'Precio',
                        value: formatCurrency(item.price),
                      },
                      { label: 'Cantidad', value: item.quantity },
                      {
                        label: 'Total',
                        value: formatCurrency((item.price * item.quantity)),
                      },
                    ]}
                  />
                ))}
              </div>

              {/* Financial Breakdowns */}
              <div className="p-4 bg-surface-950/30 border-t border-surface-850 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-surface-400">Subtotal:</span>
                  <span className="font-mono text-surface-300">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">IVA (21%):</span>
                  <span className="font-mono text-surface-300">
                    {formatCurrency(order.tax)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-secondary-400">
                    <span>Descuento:</span>
                    <span className="font-mono font-semibold">
                      -{formatCurrency(order.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-surface-850 pt-2 text-white">
                  <span>Total Pedido:</span>
                  <span className="font-mono text-primary-400">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Status updates control section */}
            {nextOptions.length > 0 ? (
              <div className="p-4 bg-surface-950/20 border border-surface-850 rounded-xl space-y-3">
                <h4 className="zenith-field-label">Acciones de Despacho (Semáforo)</h4>
                
                {!showNoteField ? (
                  <div className="flex flex-wrap gap-2.5">
                    {nextOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChangeClick(status)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border shadow transition-colors flex items-center gap-1 cursor-pointer ${getDispatchTransitionClassName(status)}`}
                      >
                        {status === 'Cancelado' ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <PackageCheck className="h-3.5 w-3.5" />
                        )}
                        <span>Pasar a {getDispatchStatusLabel(status)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-primary-400 font-semibold">
                        Añadir nota para la transición a{' '}
                        <span className="underline font-bold">
                          {targetStatus ? getDispatchStatusLabel(targetStatus) : ''}
                        </span>
                        :
                      </p>
                      <button 
                        onClick={() => setShowNoteField(false)} 
                        className="text-[10px] text-surface-500 hover:text-surface-300 uppercase font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                    <textarea
                      value={transitionNote}
                      onChange={(e) => setTransitionNote(e.target.value)}
                      placeholder="Ej: Embalaje completado, transportista asignado, nota de seguimiento #..."
                      className="w-full text-xs bg-surface-900 border border-surface-800 rounded-lg p-2.5 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 min-h-[60px]"
                    />
                    <button
                      onClick={submitStatusChange}
                      className="px-4 py-2 text-xs font-semibold bg-[var(--zenith-btn-solid-bg)] hover:bg-[var(--zenith-btn-solid-hover)] text-[var(--zenith-btn-solid-fg)] border border-[var(--zenith-btn-solid-border)] rounded-lg transition-colors cursor-pointer"
                    >
                      Confirmar Cambio de Estado
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-surface-950/20 border border-surface-850 rounded-xl text-center text-xs text-surface-500 font-medium">
                Este pedido ha finalizado y no se pueden realizar más transiciones de estado ({order.status}).
              </div>
            )}
          </div>

          {/* Sidebar vertical timeline (1 column) */}
          <div className="bg-surface-950/30 border border-surface-850 rounded-xl p-5 flex flex-col space-y-4">
            <div>
              <h4 className="zenith-section-title">Línea de Tiempo del Pedido</h4>
              <p className="text-xs text-surface-500">Historial y notas de cambios de estado.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="relative border-l border-surface-800 ml-3 pl-6 space-y-6 pb-2">
                {order.history.map((hist, idx) => {
                  const Icon = getTimelineIcon(hist.status);
                  const isLast = idx === order.history.length - 1;
                  const semaphore = getDispatchSemaphore(hist.status);

                  return (
                    <div key={idx} className="relative">
                      <span
                        className={`absolute -left-[37px] top-0 h-6.5 w-6.5 rounded-full flex items-center justify-center border-2 border-surface-900 dispatch-timeline-dot--${semaphore} ${
                          isLast ? '' : 'opacity-80'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                      </span>

                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className={`text-xs font-bold leading-none flex items-center gap-1.5 ${isLast ? 'text-white' : 'text-surface-400'}`}>
                            <span className={`dispatch-badge__dot dispatch-badge__dot--${semaphore}`} aria-hidden />
                            {getDispatchStatusLabel(hist.status)}
                          </span>
                          <span className="text-[9px] text-surface-500 font-mono">
                            {new Date(hist.timestamp).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-surface-450 italic leading-relaxed">
                          {hist.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
        </ModalBody>
        </>
      )}
    </Modal>
  );
}
