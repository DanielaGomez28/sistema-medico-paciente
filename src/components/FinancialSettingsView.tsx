'use client';

import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  History, 
  Save, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { PageHeader, Button } from './ui';

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
  { id: 'AUD-302', timestamp: '2026-05-28 14:22:05', adminName: 'Carlos Mendoza', action: 'Actualización por Acuerdo Farma-Humana', previousValue: '8.0%', newValue: '8.0%', status: 'Aplicado' }
];

export default function FinancialSettingsView() {
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent');
  const [commissionValue, setCommissionValue] = useState<number>(8.0);
  const [minSaleThreshold, setMinSaleThreshold] = useState<number>(0.0);
  
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(DEFAULT_AUDIT_LOG);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from local storage
  useEffect(() => {
    const localRate = localStorage.getItem('zenith_commission_rate');
    const localType = localStorage.getItem('zenith_commission_type');
    const localThreshold = localStorage.getItem('zenith_commission_threshold');
    const localLog = localStorage.getItem('zenith_commission_audit_log');

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

    const prevRateText = commissionType === 'percent' ? `${commissionValue.toFixed(1)}%` : `$${commissionValue.toFixed(2)}`;
    
    // Save new settings
    localStorage.setItem('zenith_commission_rate', commissionValue.toString());
    localStorage.setItem('zenith_commission_type', commissionType);
    localStorage.setItem('zenith_commission_threshold', minSaleThreshold.toString());

    // Generate Audit Log entry
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nextAuditId = `AUD-${auditLog.length + 301}`;
    
    const newEntry: AuditLogEntry = {
      id: nextAuditId,
      timestamp,
      adminName: 'Carlos Mendoza',
      action: 'Actualización Manual de Tasa de Comisión',
      previousValue: prevRateText,
      newValue: commissionType === 'percent' ? `${commissionValue.toFixed(1)}%` : `$${commissionValue.toFixed(2)}`,
      status: 'Aplicado'
    };

    const updatedLog = [newEntry, ...auditLog];
    setAuditLog(updatedLog);
    localStorage.setItem('zenith_commission_audit_log', JSON.stringify(updatedLog));

    // Dispatch custom event to notify doctor view of rate change
    window.dispatchEvent(new Event('zenith_commission_update'));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Políticas Financieras y Comisiones"
        description="Establezca los incentivos de Farma-Humana y administre las comisiones de los médicos."
      />

      {saveSuccess && (
        <div className="p-4 bg-secondary-500/10 border border-secondary-500/25 rounded-2xl flex items-center gap-2.5 text-secondary-455 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>¡Políticas financieras actualizadas y propagadas en caliente con éxito!</span>
        </div>
      )}

      {/* Grid: Settings Left, Log Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Financial Rules Form (5 cols) */}
        <form onSubmit={handleUpdate} className="lg:col-span-5 bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
            <Percent className="h-4.5 w-4.5 text-primary-400" />
            <h3 className="font-bold text-white text-base">Parámetros de Comisión</h3>
          </div>

          {/* Toggle Type */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-surface-450 uppercase">Regla de Negocio / Formato</label>
            <div className="grid grid-cols-2 gap-2 bg-surface-950 p-1 rounded-xl border border-surface-850">
              <button
                type="button"
                onClick={() => setCommissionType('percent')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  commissionType === 'percent' ? 'bg-primary-600 text-white shadow' : 'text-surface-500 hover:text-surface-350'
                }`}
              >
                Porcentual (%)
              </button>
              <button
                type="button"
                onClick={() => setCommissionType('fixed')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  commissionType === 'fixed' ? 'bg-primary-600 text-white shadow' : 'text-surface-500 hover:text-surface-350'
                }`}
              >
                Monto Fijo ($)
              </button>
            </div>
          </div>

          {/* Commission rate input */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-surface-450 uppercase">
              {commissionType === 'percent' ? 'Comisión del Médico (%)' : 'Comisión por Transacción ($)'}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-550 font-bold text-xs">
                {commissionType === 'percent' ? '%' : '$'}
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={commissionValue}
                onChange={e => setCommissionValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2.5 bg-surface-950 border border-surface-850 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-secondary-500"
              />
            </div>
            <p className="text-[10px] text-surface-500">
              {commissionType === 'percent' 
                ? 'El porcentaje se calcula sobre el total neto de la venta de medicamentos en la receta.' 
                : 'Monto plano fijo en divisas pagadero por cada ticket de venta efectiva.'}
            </p>
          </div>

          {/* Minimal sale threshold */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-surface-450 uppercase">Monto de Venta Mínimo para Comisión</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-550 font-bold text-xs">$</div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minSaleThreshold}
                onChange={e => setMinSaleThreshold(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2.5 bg-surface-950 border border-surface-850 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-secondary-500"
              />
            </div>
            <p className="text-[10px] text-surface-550">
              Ventas menores a este umbral no generarán incentivo financiero para el médico.
            </p>
          </div>

          <div className="p-3 bg-primary-500/5 border border-primary-500/15 rounded-xl flex gap-2.5 text-[10px] text-surface-400">
            <ShieldAlert className="h-4.5 w-4.5 text-primary-400 shrink-0" />
            <span>Al actualizar la tasa, la plataforma notificará en espejo a Farma-Humana y los cálculos de comisiones médicas vigentes se recalcularán automáticamente en caliente.</span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-secondary to-secondary-655 hover:from-secondary-600 hover:to-secondary-755 text-white rounded-xl text-xs font-black shadow-md shadow-secondary-650/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>Actualizar Políticas Financieras</span>
          </button>
        </form>

        {/* Audit Log Panel (7 cols) */}
        <div className="lg:col-span-7 bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
            <History className="h-4.5 w-4.5 text-secondary-455" />
            <div>
              <h3 className="font-bold text-white text-base">Bitácora de Auditoría Financiera</h3>
              <p className="text-xs text-surface-400">Historial completo de modificaciones de reglas contables.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-850 text-surface-500 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">ID</th>
                  <th>Fecha/Hora</th>
                  <th>Operador</th>
                  <th>Tasa Anterior</th>
                  <th>Tasa Nueva</th>
                  <th className="text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/60 text-surface-300">
                {auditLog.map(entry => (
                  <tr key={entry.id} className="hover:bg-surface-950/10">
                    <td className="py-3 font-mono font-bold text-surface-550">{entry.id}</td>
                    <td className="font-mono text-surface-400">{entry.timestamp}</td>
                    <td className="font-semibold text-white">{entry.adminName}</td>
                    <td className="font-mono text-surface-500">{entry.previousValue}</td>
                    <td className="font-mono font-bold text-primary-300">{entry.newValue}</td>
                    <td className="text-right">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-secondary-500/10 text-secondary-450">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
}
