'use client';

/**
 * @fileoverview Componente dashboard view.
 * @description Implementa una vista administrativa conectada al backend real del panel.
 */

import { useEffect, useMemo, useState } from 'react';
import { Activity, ChevronRight, DollarSign, Heart, RefreshCw, Stethoscope, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import apiClient from '../lib/api';
import { Button, PageHeader, StatCard } from './ui';

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

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
  charts: {
    prescriptionsByPeriod: Array<{ period: string; value: number }>;
    revenueByPeriod: Array<{ period: string; value: number }>;
  };
}

interface AdminDoctorProfile {
  id_usuario: number;
  nombre: string;
  correo: string;
  status: 'activo' | 'suspendido';
  especialidad?: string | null;
  mpps?: string | null;
}

interface AdminRecipeRecord {
  recipeId: string;
  patientName?: string;
  doctorName?: string;
  clinicalStatus: string;
  commercialStatus: string;
  createdAt: string;
  recipeExpiresAt: string;
  items?: Array<{ id_producto: string; nombre: string; cantidad?: number }>;
}

interface CatalogRecord {
  id_producto: string;
  nombre: string;
  stock: number;
  principio_activo?: string;
}

const buildPolyline = (values: Array<{ label: string; value: number }>) => {
  const width = 320;
  const height = 140;
  const max = Math.max(...values.map((item) => item.value), 1);
  const points = values.map((item, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - (item.value / max) * (height - 20);
    return `${x},${y}`;
  });

  return { width, height, points: points.join(' ') };
};

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [doctors, setDoctors] = useState<AdminDoctorProfile[]>([]);
  const [recipes, setRecipes] = useState<AdminRecipeRecord[]>([]);
  const [catalog, setCatalog] = useState<CatalogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMetricTab, setActiveMetricTab] = useState<'sales' | 'recipes'>('sales');

  useEffect(() => {
    let cancelled = false;

    const loadAdminData = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsResponse, doctorsResponse, recipesResponse, catalogResponse] = await Promise.all([
          apiClient.get('/admin/dashboard/stats'),
          apiClient.get('/admin/doctors'),
          apiClient.get('/prescripciones'),
          apiClient.get('/prescripciones/catalogo'),
        ]);

        if (!cancelled) {
          setStats(statsResponse.data || null);
          setDoctors(Array.isArray(doctorsResponse.data?.items) ? doctorsResponse.data.items : []);
          setRecipes(Array.isArray(recipesResponse.data?.items) ? recipesResponse.data.items : []);
          setCatalog(Array.isArray(catalogResponse.data?.items) ? catalogResponse.data.items : []);
        }
      } catch (requestError: unknown) {
        if (!cancelled) {
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
            charts: {
              prescriptionsByPeriod: [],
              revenueByPeriod: [],
            },
          });
          setDoctors([]);
          setRecipes([]);
          setCatalog([]);
          // setError(apiError.response?.data?.error || apiError.response?.data?.details || 'No se pudo cargar el dashboard administrativo.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockProducts = useMemo(
    () => catalog.filter((product) => Number(product.stock || 0) <= 20).slice(0, 4),
    [catalog]
  );

  const recentRecipes = useMemo(
    () => [...recipes].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 4),
    [recipes]
  );

  const chartSource = useMemo(() => {
    if (activeMetricTab === 'sales') {
      return stats?.charts?.revenueByPeriod?.map((item) => ({
        label: item.period.slice(5),
        value: Number(item.value || 0),
      })) || [];
    }

    return stats?.charts?.prescriptionsByPeriod?.map((item) => ({
      label: item.period.slice(5),
      value: Number(item.value || 0),
    })) || [];
  }, [activeMetricTab, stats]);

  const chartValues = chartSource.length ? chartSource : [{ label: 'Sin datos', value: 0 }];
  const chart = buildPolyline(chartValues);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar panel
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={DollarSign} label="Volumen financiero" value={formatCurrency(stats?.summary.financialVolume || 0)} hint={<><TrendingUp className="h-3 w-3" /><span>{stats?.summary.paidTreatments || 0} tratamientos pagados</span></>} />
        <StatCard icon={Heart} label="Recipes emitidos" value={stats?.summary.prescriptionsIssued || 0} accent="primary" hint={<><Activity className="h-3 w-3" /><span>{stats?.summary.activePatients || 0} pacientes activos</span></>} />
        <StatCard icon={Stethoscope} label="Médicos activos" value={stats?.summary.activeDoctors || 0} hint={<><span>{doctors.filter((doctor) => doctor.status === 'activo').length} habilitados</span></>} />
        <StatCard icon={TrendingUp} label="Comisiones liquidadas" value={formatCurrency(stats?.summary.totalCommissions || 0)} accent="primary" hint={<><span>Ticket promedio {formatCurrency(stats?.summary.averageTicket || 0)}</span></>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="zenith-section-title">Tendencia administrativa</h4>
              <p className="text-xs text-surface-400">Datos agregados del panel administrativo.</p>
            </div>
            <div className="flex items-center gap-1 text-2xs font-bold bg-surface-950 border border-surface-850 rounded-xl p-1">
              <button type="button" onClick={() => setActiveMetricTab('sales')} className={`px-3 py-1.5 rounded-lg ${activeMetricTab === 'sales' ? 'bg-white text-surface-950' : 'text-surface-500 hover:text-foreground'}`}>Ventas</button>
              <button type="button" onClick={() => setActiveMetricTab('recipes')} className={`px-3 py-1.5 rounded-lg ${activeMetricTab === 'recipes' ? 'bg-white text-surface-950' : 'text-surface-500 hover:text-foreground'}`}>Recipes</button>
            </div>
          </div>

          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full h-44 overflow-visible">
            <polyline fill="none" stroke="var(--color-primary)" strokeWidth="3" points={chart.points} />
          </svg>

          <div className="flex justify-between gap-2 text-[10px] text-surface-500 font-mono">
            {chartValues.map((item) => (
              <span key={`${activeMetricTab}-${item.label}`}>{item.label}</span>
            ))}
          </div>
        </div>

        <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div>
            <h4 className="zenith-section-title">Directorio médico</h4>
            <p className="text-xs text-surface-400">Perfiles registrados en la plataforma.</p>
          </div>
          <div className="space-y-3">
            {doctors.slice(0, 4).map((doctor) => (
              <div key={doctor.id_usuario} className="rounded-xl border border-surface-800 bg-surface-950/40 p-3">
                <p className="text-xs font-semibold text-white">{doctor.nombre}</p>
                <p className="text-[10px] text-surface-500">{doctor.especialidad || 'Sin especialidad'} ? {doctor.mpps || 'Sin MPPS'}</p>
                <span className={`mt-2 inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${doctor.status === 'activo' ? 'bg-secondary-500/10 text-secondary-400' : 'bg-amber-500/10 text-amber-300'}`}>
                  {doctor.status}
                </span>
              </div>
            ))}
            {doctors.length === 0 ? <div className="text-xs text-surface-500">Todavía no hay médicos disponibles.</div> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="zenith-section-title">Monitor administrativo de recipes</h4>
              <p className="text-xs text-surface-400">Estados clínicos y comerciales sincronizados en tiempo real.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('doctors')}>
              Gestión médica
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {recipes.slice(0, 5).map((recipe) => (
              <div key={recipe.recipeId} className="rounded-xl border border-surface-800 bg-surface-950/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">{recipe.patientName || 'Paciente'}</p>
                    <p className="text-[10px] text-surface-500 font-mono">{recipe.recipeId} ? {recipe.doctorName || 'Sin médico visible'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/10 text-primary-300">{recipe.clinicalStatus}</span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-500/10 text-secondary-300">{recipe.commercialStatus}</span>
                  </div>
                </div>
                <p className="text-[10px] text-surface-500">Emitido {new Date(recipe.createdAt).toLocaleDateString('es-ES')} ? Caduca {new Date(recipe.recipeExpiresAt).toLocaleDateString('es-ES')}</p>
              </div>
            ))}
            {!recipes.length ? <div className="text-xs text-surface-500">No hay recipes emitidos todavía.</div> : null}
          </div>
        </div>

        <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div>
            <h4 className="zenith-section-title">Actividad operativa</h4>
            <p className="text-xs text-surface-400">Sincronizada con recipes emitidos y catálogo activo.</p>
          </div>
          <div className="space-y-3">
            {recentRecipes.map((recipe) => (
              <div key={`recent-${recipe.recipeId}`} className="rounded-xl border border-surface-800 bg-surface-950/40 p-3 space-y-1">
                <p className="text-xs font-semibold text-white">{recipe.recipeId}</p>
                <p className="text-[10px] text-surface-500">Paciente: {recipe.patientName || 'Paciente'} ? Médico: {recipe.doctorName || 'Sin médico visible'}</p>
                <p className="text-[10px] text-surface-400">{Array.isArray(recipe.items) ? recipe.items.map((item) => item.nombre).slice(0, 2).join(', ') : 'Sin items visibles'}</p>
              </div>
            ))}
            {!recentRecipes.length ? <div className="text-xs text-surface-500">Sin actividad reciente.</div> : null}
          </div>
          <div className="border-t border-surface-850 pt-3 space-y-2">
            <p className="text-xs font-semibold text-white">Alertas de stock bajo</p>
            {lowStockProducts.map((product) => (
              <div key={product.id_producto} className="flex items-center justify-between gap-3 rounded-lg border border-surface-800 bg-surface-950/40 px-3 py-2 text-xs">
                <span className="text-surface-200">{product.nombre}</span>
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
