'use client';

/**
 * @fileoverview Componente financial settings view.
 * @description Administra la política financiera y la auditoría real sincronizada con backend.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, History, Percent, Save, ShieldAlert, Users, X } from 'lucide-react';
import { PageHeader, Button, Modal, ModalBody, ListCard } from './ui';
import apiClient from '../lib/api';
import { formatCurrency } from '../lib/currency';

/** Médico con su comisión y saldo, para el detalle por médico. */
interface DoctorCommissionRow {
  id: number;
  name: string;
  specialty?: string | null;
  status?: string;
  assignedCommission?: number | null;
  commissionRatePct?: number;
  commissionRateSource?: 'doctor' | 'global';
  availableBalance?: number;
  currency?: string;
  transactions?: Array<{
    recipeId: string;
    orderId: string;
    amount: number;
    commissionAmount: number;
    settledAt: string;
    medications?: string;
  }>;
}

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

/** Entrada del registro de auditoría de cambios en configuración financiera. */
interface AuditLogEntry {
  id?: string;
  id_log?: number;
  actorUserId?: string;
  id_superusuario?: number;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  createdAt?: string;
  fecha_hora_exacta?: string;
  timestamp?: string;
  details?: Record<string, { previous?: unknown; next?: unknown }>;
}

/**
 * Vista de configuración financiera: permite ajustar la comisión del sistema
 * y consultar el historial de auditoría de cambios realizados.
 *
 * @returns {JSX.Element} Panel de configuración financiera.
 */
export default function FinancialSettingsView() {
  const [commissionValue, setCommissionValue] = useState<number>(0);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [doctorRows, setDoctorRows] = useState<DoctorCommissionRow[]>([]);
  const [expandedDoctorId, setExpandedDoctorId] = useState<number | null>(null);

  const loadFinancialData = async () => {
    const [configResponse, auditResponse, doctorsResponse] = await Promise.all([
      apiClient.get('/admin/cms/config'),
      apiClient.get('/admin/audit-log?action=system_config_updated'),
      apiClient.get('/admin/doctors'),
    ]);

    setCommissionValue(Number(configResponse.data?.config?.doctorCommissionPct || 0));
    setAuditLog(Array.isArray(auditResponse.data?.items) ? auditResponse.data.items : []);

    // Cada médico puede tener su propia comisión asignada, que prevalece sobre la
    // global. Se consulta su resumen para mostrar la tasa vigente y el saldo real.
    const doctors = Array.isArray(doctorsResponse.data?.items) ? doctorsResponse.data.items : [];
    const rows = await Promise.all(
      doctors.map(async (doctor: DoctorCommissionRow) => {
        try {
          const summary = await apiClient.get(`/pagos/comisiones/medico/${encodeURIComponent(String(doctor.id))}`);
          return { ...doctor, ...summary.data };
        } catch {
          return doctor;
        }
      })
    );
    setDoctorRows(rows);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        setLoadingConfig(true);
        setBackendError('');
        await loadFinancialData();
      } catch (error: unknown) {
        if (!cancelled) {
          const apiError = error as ApiErrorPayload;
          setBackendError(
            apiError.response?.data?.error ||
              apiError.response?.data?.details ||
              'No se pudo cargar la configuración financiera real.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingConfig(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoadingConfig(true);
      setBackendError('');
      await apiClient.put('/admin/cms/config', {
        config: {
          doctorCommissionPct: commissionValue,
        },
      });

      await loadFinancialData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload;
      setBackendError(
        apiError.response?.data?.error ||
          apiError.response?.data?.details ||
          'No se pudo actualizar la comisión global.'
      );
    } finally {
      setLoadingConfig(false);
    }
  };

  const auditRows = useMemo(() => auditLog.map((entry) => {
    const commissionChange = entry.details?.doctorCommissionPct;
    // La API expone la fecha como `timestamp`; sin contemplarla la bitácora
    // mostraba siempre "N/A" en la columna Fecha/Hora.
    const dateVal = entry.timestamp || entry.createdAt || entry.fecha_hora_exacta;
    return {
      id: String(entry.id || entry.id_log || 'N/A'),
      // El id numérico no identifica a nadie al auditar: se prefiere el nombre.
      actor: entry.actorName || entry.actorEmail || `Usuario ${entry.actorUserId || entry.id_superusuario || 'N/A'}`,
      timestamp: dateVal
        ? new Date(dateVal).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'N/A',
      action: 'Actualización de comisión base',
      previousValue: commissionChange?.previous ?? 'N/A',
      newValue: commissionChange?.next ?? 'N/A',
    };
  }), [auditLog]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button variant="outline" onClick={() => setIsAuditLogOpen(true)}>
            <History className="h-4 w-4" />
            Historial de modificaciones
          </Button>
        }
      />

      {backendError ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center gap-2.5 text-amber-300 text-xs">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          <span>{backendError}</span>
        </div>
      ) : null}

      {saveSuccess ? (
        <div className="p-4 bg-surface-800 border border-surface-700 rounded-2xl flex items-center gap-2.5 text-surface-200 text-xs">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>Política financiera actualizada.</span>
        </div>
      ) : null}

      <form onSubmit={handleUpdate} className="admin-surface-card w-full border rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
          <Percent className="h-4.5 w-4.5 text-surface-400" />
          <h3 className="zenith-section-title">% Comisión del sistema</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="zenith-field-label">Comisión del médico (%)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-550 font-bold text-xs">%</div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={commissionValue}
                onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2.5 bg-surface-950 border border-surface-850 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-surface-400"
              />
            </div>
          </div>
          <div className="p-3 bg-surface-950 border border-surface-850 rounded-xl flex gap-2.5 text-[10px] text-surface-400 items-start">
            <ShieldAlert className="h-4.5 w-4.5 text-surface-400 shrink-0" />
            <span>Este porcentaje determina la comisión retenida por la plataforma en cada consulta médica. Todo cambio queda registrado en el historial de auditoría por seguridad.</span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-surface-850">
          <Button type="submit" className="w-full sm:w-auto" disabled={loadingConfig}>
            <Save className="h-4 w-4" />
            Actualizar política financiera
          </Button>
        </div>
      </form>

      {/* Comisiones por médico: la global es el valor por defecto, pero cada
          médico puede tener una asignada que prevalece. Se muestra cuál rige
          para que el porcentaje no se lea como si fuera el mismo para todos. */}
      <div className="admin-surface-card w-full border rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
          <Users className="h-4.5 w-4.5 text-surface-400" />
          <div>
            <h3 className="zenith-section-title">Comisiones por médico</h3>
            <p className="text-xs text-surface-400 mt-0.5">
              Tocá un médico para ver su historial de comisiones liquidadas.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {doctorRows.map((doctor) => {
            const abierto = expandedDoctorId === doctor.id;
            const tasa = doctor.commissionRatePct ?? doctor.assignedCommission ?? commissionValue;
            const propia = doctor.commissionRateSource === 'doctor';

            return (
              <div key={doctor.id} className="rounded-2xl border border-surface-850 bg-surface-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedDoctorId(abierto ? null : doctor.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-900/40 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{doctor.name}</p>
                    <p className="text-[10px] text-surface-500 truncate">
                      {doctor.specialty || 'Sin especialidad'}
                      {doctor.status ? ` • ${doctor.status}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-foreground">{tasa}%</p>
                      <p className="text-[9px] uppercase tracking-wider text-surface-500">
                        {propia ? 'Asignada' : 'Global'}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold font-mono text-foreground">
                        {formatCurrency(Number(doctor.availableBalance || 0))}
                      </p>
                      <p className="text-[9px] uppercase tracking-wider text-surface-500">Acumulado</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-surface-500 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {abierto ? (
                  <div className="border-t border-surface-850 px-4 py-3 space-y-2">
                    {doctor.transactions?.length ? (
                      doctor.transactions.map((t, idx) => (
                        <div key={`${t.recipeId}-${idx}`} className="flex items-start justify-between gap-3 text-xs py-1.5">
                          <div className="min-w-0">
                            <p className="text-surface-200 truncate">{t.medications || `Receta ${t.recipeId}`}</p>
                            <p className="text-[10px] text-surface-500">
                              {new Date(t.settledAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <span className="font-mono font-semibold text-foreground shrink-0">
                            +{formatCurrency(Number(t.commissionAmount || 0))}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-surface-500 py-1.5">
                        Este médico todavía no tiene comisiones liquidadas.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!doctorRows.length ? (
            <p className="text-xs text-surface-500">No hay médicos registrados.</p>
          ) : null}
        </div>
      </div>

      <Modal open={isAuditLogOpen} onClose={() => setIsAuditLogOpen(false)} size="xl" className="max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
          <div>
            <h3 className="zenith-section-title">Historial de modificaciones</h3>
            <p className="text-xs text-surface-400 mt-0.5">Bitácora administrativa.</p>
          </div>
          <button type="button" onClick={() => setIsAuditLogOpen(false)} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ModalBody>
          <div className="lg:hidden space-y-3">
            {auditRows.map((entry) => (
              <ListCard
                key={entry.id}
                title={entry.action}
                subtitle={entry.id}
                badge={<span className="inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[9px] font-semibold bg-surface-800 text-surface-200 border border-surface-700">{entry.actor}</span>}
                fields={[
                  { label: 'Fecha', value: entry.timestamp },
                  { label: 'Valor anterior', value: String(entry.previousValue) },
                  { label: 'Nuevo valor', value: String(entry.newValue) },
                ]}
              />
            ))}
            {!auditRows.length ? <div className="text-xs text-surface-500">No hay auditoría financiera registrada.</div> : null}
          </div>
          <div className="zenith-table-wrap hidden lg:block">
            <table className="zenith-table text-xs">
              <thead>
                <tr className="border-b border-surface-850 text-surface-500 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">ID</th>
                  <th>Fecha/Hora</th>
                  <th>Autor</th>
                  <th>Acción</th>
                  <th>Anterior</th>
                  <th>Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/60 text-surface-300">
                {auditRows.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 font-mono text-surface-400">{entry.id}</td>
                    <td>{entry.timestamp}</td>
                    <td>{entry.actor}</td>
                    <td>{entry.action}</td>
                    <td>{String(entry.previousValue)}</td>
                    <td className="font-semibold text-white">{String(entry.newValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!auditRows.length ? <div className="pt-4 text-xs text-surface-500">No hay auditoría financiera registrada.</div> : null}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
