'use client';

/**
 * @fileoverview Componente dashboard view.
 * @description Implementa una vista administrativa conectada al backend real del panel.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ChevronRight, DollarSign, Heart, RefreshCw, Stethoscope, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import apiClient from '../lib/api';
import { translateStatus, getRecipeStatusBadgeClassName, getDoctorStatusBadgeClassName } from '../lib/statusColors';
import { Button, PageHeader, StatCard } from './ui';

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

/** Props del componente `DashboardView`. */
interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

interface AdminDashboardStats {
  generatedAt: string;
  summary: {
    activeDoctors: number;
    activePatients: number;
    prescriptionsIssued: number;
    paidTreatments: number;
    financialVolume: number;
    totalCommissions: number;
    averageTicket: number;
  };
}

interface AdminDoctorProfile {
  id: number;
  name: string;
  email: string;
  status: 'activo' | 'suspendido';
  specialty?: string | null;
  mpps?: string | null;
}

interface AdminRecipeRecord {
  recipeId: string;
  patientName?: string;
  doctorName?: string;
  clinicalStatus: string;
  commercialStatus: string;
  fulfillmentStatus?: string;
  createdAt: string;
  recipeExpiresAt: string;
  items?: Array<{ id: string; name: string; cantidad?: number }>;
}

interface CatalogRecord {
  id: string;
  name: string;
  stock: number;
  activeIngredient?: string;
}

/**
 * Vista de panel administrativo: muestra estadísticas generales del sistema
 * (pedidos, ingresos, etc.) y permite navegar a otras secciones.
 *
 * @param {DashboardViewProps} props - Propiedades del componente.
 * @returns {JSX.Element} Panel de dashboard administrativo.
 */
export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [doctors, setDoctors] = useState<AdminDoctorProfile[]>([]);
  const [recipes, setRecipes] = useState<AdminRecipeRecord[]>([]);
  const [catalog, setCatalog] = useState<CatalogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Carga los datos del panel administrativo.
   * @param {{ cancelled?: () => boolean }} [options] - Permite descartar el
   *   resultado si el componente se desmontó durante la petición.
   * @returns {Promise<void>}
   */
  const loadAdminData = useCallback(async (options?: { cancelled?: () => boolean }) => {
    const cancelled = () => Boolean(options?.cancelled?.());
    {
      try {
        setLoading(true);
        setError('');
        const [statsResponse, doctorsResponse, recipesResponse, catalogResponse] = await Promise.all([
          apiClient.get('/admin/dashboard/stats'),
          apiClient.get('/admin/doctors'),
          apiClient.get('/prescripciones'),
          apiClient.get('/prescripciones/catalogo'),
        ]);

        if (!cancelled()) {
          setStats(statsResponse.data || null);
          setDoctors(Array.isArray(doctorsResponse.data?.items) ? doctorsResponse.data.items : []);
          setRecipes(Array.isArray(recipesResponse.data?.items) ? recipesResponse.data.items : []);
          setCatalog(Array.isArray(catalogResponse.data?.items) ? catalogResponse.data.items : []);
        }
      } catch (requestError: unknown) {
        if (!cancelled()) {
          // Si el backend no está disponible, caemos en un estado vacío (como si la BD estuviese vacía)
          setStats({
            generatedAt: new Date().toISOString(),
            summary: {
              activeDoctors: 0,
              activePatients: 0,
              prescriptionsIssued: 0,
              paidTreatments: 0,
              financialVolume: 0,
              totalCommissions: 0,
              averageTicket: 0,
            },
          });
          setDoctors([]);
          setRecipes([]);
          setCatalog([]);
          // Sin este aviso, un fallo del panel se veía igual que "todavía no hay
          // datos": el usuario no tenía forma de saber que no se actualizaba.
          const apiError = requestError as ApiErrorPayload;
          setError(apiError.response?.data?.error || 'No se pudieron cargar los datos del panel.');
        }
      } finally {
        if (!cancelled()) {
          setLoading(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Carga inicial de datos. La regla apunta a setState sincrónico en efectos,
    // pero acá el estado que se toca es el del propio fetch (loading/datos), que
    // es justamente lo que hay que sincronizar al montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAdminData({ cancelled: () => cancelled });

    return () => {
      cancelled = true;
    };
  }, [loadAdminData]);

  const lowStockProducts = useMemo(
    () => catalog.filter((product) => Number(product.stock || 0) <= 20).slice(0, 4),
    [catalog]
  );

  const recentRecipes = useMemo(
    () => [...recipes].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 4),
    [recipes]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        className="portal-page-header"
        title="Panel administrativo"
        description="Resumen general del sistema y actividad reciente."
        actions={
          <Button variant="outline" size="sm" onClick={() => { void loadAdminData(); }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar panel
          </Button>
        }
      />

      {error ? (
        <div className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-xs text-danger-500">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={DollarSign} label="Volumen financiero" value={formatCurrency(stats?.summary.financialVolume || 0)} hint={<><TrendingUp className="h-3 w-3" /><span>{stats?.summary.paidTreatments || 0} tratamientos pagados</span></>} />
        <StatCard icon={Heart} label="Recipes emitidos" value={stats?.summary.prescriptionsIssued || 0} accent="primary" hint={<><Activity className="h-3 w-3" /><span>{stats?.summary.activePatients || 0} pacientes activos</span></>} />
        <StatCard icon={Stethoscope} label="Médicos activos" value={stats?.summary.activeDoctors || 0} hint={<><span>{doctors.filter((doctor) => doctor.status === 'activo').length} habilitados</span></>} />
        <StatCard icon={TrendingUp} label="Comisiones liquidadas" value={formatCurrency(stats?.summary.totalCommissions || 0)} accent="primary" hint={<><span>Ticket promedio {formatCurrency(stats?.summary.averageTicket || 0)}</span></>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="portal-dashboard-card space-y-4 cursor-pointer hover:border-surface-700 transition-colors" onClick={() => onNavigate('doctors')}>
          <div>
            <h4 className="zenith-section-title">Directorio médico</h4>
            <p className="text-xs text-surface-400">Perfiles registrados en la plataforma.</p>
          </div>
          <div className="space-y-3">
            {doctors.slice(0, 4).map((doctor) => (
              <div key={doctor.id} className="rounded-xl border border-surface-800 bg-surface-950/40 p-3">
                <p className="text-xs font-semibold text-white">{doctor.name}</p>
                <p className="text-[10px] text-surface-500">{doctor.specialty || 'Sin especialidad'} &bull; {doctor.mpps || 'Sin MPPS'}</p>
                <span className={`mt-2 ${getDoctorStatusBadgeClassName(doctor.status)}`}>
                  {doctor.status}
                </span>
              </div>
            ))}
            {doctors.length === 0 ? <div className="text-xs text-surface-500">Todavía no hay médicos disponibles.</div> : null}
          </div>
        </div>

        <div className="portal-dashboard-card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="zenith-section-title">Monitor administrativo de recipes</h4>
              <p className="text-xs text-surface-400">Estados clínicos y comerciales sincronizados en tiempo real.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('recipes')}>
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {recipes.slice(0, 5).map((recipe) => (
              <div key={recipe.recipeId} className="rounded-xl border border-surface-800 bg-surface-950/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">{recipe.patientName || 'Paciente'}</p>
                    <p className="text-[10px] text-surface-500 font-mono">Recipe: {recipe.recipeId} &bull; {recipe.doctorName || 'Sin médico visible'}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className={`recipe-status-badge ${getRecipeStatusBadgeClassName(recipe.clinicalStatus)}`}>
                      {translateStatus(recipe.clinicalStatus)}
                    </span>
                    <span className={`recipe-status-badge ${getRecipeStatusBadgeClassName(recipe.commercialStatus)}`}>
                      {translateStatus(recipe.commercialStatus)}
                    </span>
                    <span className={`recipe-status-badge ${getRecipeStatusBadgeClassName(recipe.fulfillmentStatus || 'pending')}`}>
                      {translateStatus(recipe.fulfillmentStatus || 'pending')}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-surface-500">
                  Emitido {new Date(recipe.createdAt).toLocaleDateString('es-ES')}
                  {recipe.fulfillmentStatus === 'fully_fulfilled' ? ' • Agotado' : ''}
                </p>
              </div>
            ))}
            {!recipes.length ? <div className="text-xs text-surface-500">No hay recipes emitidos todavía.</div> : null}
          </div>
        </div>

        <div className="portal-dashboard-card space-y-4">
          <div>
            <h4 className="zenith-section-title">Actividad operativa</h4>
            <p className="text-xs text-surface-400">Sincronizada con recipes emitidos y catálogo activo.</p>
          </div>
          <div className="space-y-3">
            {recentRecipes.map((recipe) => (
              <div key={`recent-${recipe.recipeId}`} className="rounded-xl border border-surface-800 bg-surface-950/40 p-3 space-y-1">
                <p className="text-xs font-semibold text-white">Recipe: {recipe.recipeId}</p>
                <p className="text-[10px] text-surface-500">Paciente: {recipe.patientName || 'Paciente'} &bull; Médico: {recipe.doctorName || 'Sin médico visible'}</p>
                <p className="text-[10px] text-surface-400">{Array.isArray(recipe.items) ? recipe.items.map((item) => item.name).slice(0, 2).join(', ') : 'Sin items visibles'}</p>
              </div>
            ))}
            {!recentRecipes.length ? <div className="text-xs text-surface-500">Sin actividad reciente.</div> : null}
          </div>
          <div className="border-t border-surface-850 pt-3 space-y-2">
            <p className="text-xs font-semibold text-white">Alertas de stock bajo</p>
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-surface-800 bg-surface-950/40 px-3 py-2 text-xs">
                <span className="text-surface-200">{product.name}</span>
                <span className="font-mono text-amber-300">{product.stock} u.</span>
              </div>
            ))}
            {!lowStockProducts.length ? <div className="text-xs text-surface-500">Sin alertas de stock bajo.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
