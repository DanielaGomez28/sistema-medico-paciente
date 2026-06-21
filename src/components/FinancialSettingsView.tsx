'use client';

import React, { useState, useEffect } from 'react';
import { Percent, History, Save, ShieldAlert, CheckCircle, X } from 'lucide-react';
import { PageHeader, Button, Modal, ModalBody, ListCard } from './ui';

/**
 * Interfaz para representar un registro en el historial de auditoría financiera.
 * @interface AuditLogEntry
 */
interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  previousValue: string;
  newValue: string;
  status: 'Aplicado' | 'Revertido';
}

const DEFAULT_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'AUD-301', timestamp: '2026-05-15 09:30:12', adminName: 'Carlos Mendoza', action: 'Configuración Inicial de Tasa', previousValue: '0.0%', newValue: '8.0%', status: 'Aplicado' },
  { id: 'AUD-302', timestamp: '2026-05-28 14:22:05', adminName: 'Carlos Mendoza', action: 'Actualización por Acuerdo Comercial', previousValue: '8.0%', newValue: '8.0%', status: 'Aplicado' },
];

/**
 * Vista de Configuración Financiera (Comisiones).
 * Exclusiva del panel de Administrador. Sirve para definir las reglas de negocio base:
 * - Tipo de comisión (Porcentaje o Monto Fijo).
 * - Monto o porcentaje pagadero por transacción exitosa a los médicos.
 * - Umbral mínimo de venta.
 * Todas las modificaciones generan una huella inmutable en el historial de auditoría.
 *
 * @returns {JSX.Element}
 */
export default function FinancialSettingsView() {
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent');
  const [commissionValue, setCommissionValue] = useState<number>(8.0);
  const [minSaleThreshold, setMinSaleThreshold] = useState<number>(0.0);

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(DEFAULT_AUDIT_LOG);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);

  useEffect(() => {
    const localRate = localStorage.getItem('zenith_commission_rate');
    const localType = localStorage.getItem('zenith_commission_type');
    const localThreshold = localStorage.getItem('zenith_commission_threshold');
    const localLog = localStorage.getItem('zenith_commission_audit_log');

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localRate) setCommissionValue(parseFloat(localRate));
    if (localType) setCommissionType(localType as 'percent' | 'fixed');
    if (localThreshold) setMinSaleThreshold(parseFloat(localThreshold));
    if (localLog) {
      setAuditLog(JSON.parse(localLog));
    } else {
      localStorage.setItem('zenith_commission_audit_log', JSON.stringify(DEFAULT_AUDIT_LOG));
    }
  }, []);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const prevRateText = commissionType === 'percent' ? `${commissionValue.toFixed(1)}%` : `Bs. ${commissionValue.toFixed(2)}`;

    localStorage.setItem('zenith_commission_rate', commissionValue.toString());
    localStorage.setItem('zenith_commission_type', commissionType);
    localStorage.setItem('zenith_commission_threshold', minSaleThreshold.toString());

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nextAuditId = `AUD-${auditLog.length + 301}`;

    const newEntry: AuditLogEntry = {
      id: nextAuditId,
      timestamp,
      adminName: 'Carlos Mendoza',
      action: 'Actualización Manual de Tasa de Comisión',
      previousValue: prevRateText,
      newValue: commissionType === 'percent' ? `${commissionValue.toFixed(1)}%` : `Bs. ${commissionValue.toFixed(2)}`,
      status: 'Aplicado',
    };

    const updatedLog = [newEntry, ...auditLog];
    setAuditLog(updatedLog);
    localStorage.setItem('zenith_commission_audit_log', JSON.stringify(updatedLog));

    window.dispatchEvent(new Event('zenith_commission_update'));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button variant="outline" onClick={() => setIsAuditLogOpen(true)}>
            <History className="h-4 w-4" />
            Historial de Cambios
            <span className="ml-1 text-surface-500">({auditLog.length})</span>
          </Button>
        }
      />

      {saveSuccess && (
        <div className="p-4 bg-surface-800 border border-surface-700 rounded-2xl flex items-center gap-2.5 text-surface-200 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>¡Políticas financieras actualizadas y propagadas en caliente con éxito!</span>
        </div>
      )}

      <form
        onSubmit={handleUpdate}
        className="w-full bg-surface-900 border border-surface-800 rounded-3xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
          <Percent className="h-4.5 w-4.5 text-surface-400" />
          <h3 className="zenith-section-title">Parámetros de Comisión</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="zenith-field-label">Regla de Negocio / Formato</label>
            <div className="grid grid-cols-2 gap-2 bg-surface-950 p-1 rounded-xl border border-surface-850">
              <button
                type="button"
                onClick={() => setCommissionType('percent')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  commissionType === 'percent' ? 'bg-white text-surface-950' : 'text-surface-500 hover:text-surface-350'
                }`}
              >
                Porcentual (%)
              </button>
              <button
                type="button"
                onClick={() => setCommissionType('fixed')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  commissionType === 'fixed' ? 'bg-white text-surface-950' : 'text-surface-500 hover:text-surface-350'
                }`}
              >
                Monto Fijo (Bs.)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="zenith-field-label">
              {commissionType === 'percent' ? 'Comisión del Médico (%)' : 'Comisión por Transacción (Bs.)'}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-550 font-bold text-xs">
                {commissionType === 'percent' ? '%' : 'Bs.'}
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={commissionValue}
                onChange={e => setCommissionValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2.5 bg-surface-950 border border-surface-850 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-surface-400"
              />
            </div>
            {commissionType === 'fixed' && (
              <p className="text-[10px] text-surface-500">
                Monto plano fijo en bolívares pagadero por cada ticket de venta efectiva.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="zenith-field-label">Monto de Venta Mínimo para Comisión</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-550 font-bold text-[10px]">Bs.</div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minSaleThreshold}
                onChange={e => setMinSaleThreshold(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2.5 bg-surface-950 border border-surface-850 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-surface-400"
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-surface-950 border border-surface-850 rounded-xl flex gap-2.5 text-[10px] text-surface-400">
          <ShieldAlert className="h-4.5 w-4.5 text-surface-400 shrink-0" />
          <span>
            Al actualizar la tasa, la plataforma notificará a la red de distribución y los cálculos de comisiones médicas vigentes se recalcularán automáticamente en caliente.
          </span>
        </div>

        <div className="flex justify-end pt-2 border-t border-surface-850">
          <Button type="submit" className="w-full sm:w-auto">
            <Save className="h-4 w-4" />
            Actualizar Políticas Financieras
          </Button>
        </div>
      </form>

      <Modal open={isAuditLogOpen} onClose={() => setIsAuditLogOpen(false)} size="xl" className="max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
          <div>
            <h3 className="zenith-section-title">Historial de Cambios Financieros</h3>
            <p className="text-xs text-surface-400 mt-0.5">Historial completo de modificaciones de reglas contables.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAuditLogOpen(false)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ModalBody>
          <div className="zenith-table-wrap hidden lg:block">
            <table className="zenith-table text-xs">
              <thead>
                <tr className="border-b border-surface-850 text-surface-500 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">ID</th>
                  <th>Fecha/Hora</th>
                  <th>Operador</th>
                  <th>Acción</th>
                  <th>Tasa Anterior</th>
                  <th>Tasa Nueva</th>
                  <th className="text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/60 text-surface-300">
                {auditLog.map(entry => (
                  <tr key={entry.id} className="hover:bg-surface-950/10">
                    <td className="py-3 font-mono font-semibold text-surface-400">{entry.id}</td>
                    <td className="font-mono text-surface-400">{entry.timestamp}</td>
                    <td className="font-semibold text-white">{entry.adminName}</td>
                    <td className="text-surface-400">{entry.action}</td>
                    <td className="font-mono text-surface-500">{entry.previousValue}</td>
                    <td className="font-mono font-semibold text-white">{entry.newValue}</td>
                    <td className="text-right whitespace-nowrap">
                      <span className="inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[9px] font-semibold bg-surface-800 text-surface-200 border border-surface-700">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden space-y-3">
            {auditLog.map((entry) => (
              <ListCard
                key={entry.id}
                title={entry.adminName}
                subtitle={entry.id}
                badge={
                  <span className="inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[9px] font-semibold bg-surface-800 text-surface-200 border border-surface-700">
                    {entry.status}
                  </span>
                }
                fields={[
                  { label: 'Fecha', value: entry.timestamp },
                  { label: 'Acción', value: entry.action },
                  { label: 'Tasa anterior', value: entry.previousValue },
                  { label: 'Tasa nueva', value: entry.newValue },
                ]}
              />
            ))}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
