'use client';

/**
 * @fileoverview Componente dashboard view.
 * @description Implementa una vista administrativa conectada al backend real del panel.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ChevronRight, DollarSign, Heart, RefreshCw, Stethoscope, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import apiClient from '../lib/api';
import { translateStatus, getRecipeStatusBadgeClassName } from '../lib/statusColors';
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
  charts: {
    prescriptionsByPeriod: Array<{ period: string; value: number }>;
    revenueByPeriod: Array<{ period: string; value: number }>;
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
 * Calcula la geometría del gráfico de tendencia.
 * Se reserva un margen interno porque la línea se dibujaba de borde a borde y,
 * con el grosor del trazo, la mitad quedaba recortada fuera del viewBox.
 * @param {Array<{label: string, value: number}>} values - Serie a graficar.
 * @returns {object} Dimensiones, coordenadas, ruta del área y máximo de la serie.
 */
const buildPolyline = (values: Array<{ label: string; value: number }>) => {
  const width = 320;
  const height = 140;
  const padX = 6;
  const padTop = 12;
  const padBottom = 10;
  const max = Math.max(...values.map((item) => item.value), 1);
  const usableW = width - padX * 2;
  const usableH = height - padTop - padBottom;

  const coords = values.map((item, index) => {
    const x = values.length === 1 ? width / 2 : padX + (index / (values.length - 1)) * usableW;
    const y = padTop + (1 - item.value / max) * usableH;
    return { x, y, ...item };
  });

  const points = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const baseline = height - padBottom;
  const areaPath = coords.length
    ? `M ${coords[0].x},${baseline} ${coords.map((c) => `L ${c.x},${c.y}`).join(' ')} L ${coords[coords.length - 1].x},${baseline} Z`
    : '';

  return { width, height, points, coords, areaPath, max, baseline, padTop };
};

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
  const [activeMetricTab, setActiveMetricTab] = useState<'sales' | 'recipes'>('sales');

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
            charts: {
              prescriptionsByPeriod: [],
              revenueByPeriod: [],
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
  // Con la serie vacía o toda en cero el trazo quedaba pegado al borde inferior,
  // pareciendo un gráfico roto en vez de "sin datos".
  const hasChartData = chartSource.length > 0 && chartSource.some((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button variant="outline" size="sm" onClick={() => { void loadAdminData(); }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar panel
          </Button>
        }
      />

      {error ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
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
        <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="zenith-section-title">Tendencia administrativa</h4>
              <p className="text-xs text-surface-400">Datos agregados del panel administrativo.</p>
            </div>
            <div className="flex items-center gap-1 text-2xs font-bold rounded-xl p-1 bg-[#f8f9fa] border border-[#e9ecef] dark:bg-surface-855 dark:border-surface-800">
              <button
                type="button"
                onClick={() => setActiveMetricTab('sales')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  activeMetricTab === 'sales'
                    ? 'bg-white text-surface-950 shadow-sm dark:bg-surface-800 dark:text-foreground dark:shadow-none'
                    : 'text-surface-500 hover:text-foreground dark:text-surface-400 dark:hover:text-foreground'
                }`}
              >
                Ventas
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricTab('recipes')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  activeMetricTab === 'recipes'
                    ? 'bg-white text-surface-950 shadow-sm dark:bg-surface-800 dark:text-foreground dark:shadow-none'
                    : 'text-surface-500 hover:text-foreground dark:text-surface-400 dark:hover:text-foreground'
                }`}
              >
                Recipes
              </button>
            </div>
          </div>

          {hasChartData ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-2xs text-surface-500 uppercase tracking-wider font-bold">
                  Máximo del período
                </span>
                <span className="text-sm font-bold text-foreground font-mono">
                  {activeMetricTab === 'sales' ? formatCurrency(chart.max) : chart.max}
                </span>
              </div>

              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                className="w-full h-44"
                preserveAspectRatio="none"
                role="img"
                aria-label={`Tendencia de ${activeMetricTab === 'sales' ? 'ventas' : 'récipes'}`}
              >
                {/* Guías horizontales para dar referencia de altura al trazo. */}
                {[0, 0.5, 1].map((ratio) => {
                  const y = chart.padTop + ratio * (chart.baseline - chart.padTop);
                  return (
                    <line
                      key={ratio}
                      x1="0"
                      y1={y}
                      x2={chart.width}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-surface-700/40"
                    />
                  );
                })}

                <path d={chart.areaPath} fill="var(--color-primary)" opacity="0.12" />

                <polyline
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chart.points}
                />

                {/* Un solo dato no dibuja línea: el punto lo deja visible igual. */}
                {chart.coords.map((c) => (
                  <circle key={`${c.label}-${c.x}`} cx={c.x} cy={c.y} r="2.5" fill="var(--color-primary)" />
                ))}
              </svg>

              <div className="flex justify-between gap-2 text-[10px] text-surface-500 font-mono">
                {chartValues.map((item) => (
                  <span key={`${activeMetricTab}-${item.label}`} className="truncate">{item.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-surface-800 text-center">
              <TrendingUp className="h-5 w-5 text-surface-600" />
              <p className="text-xs text-surface-500">
                Todavía no hay {activeMetricTab === 'sales' ? 'ventas' : 'récipes'} registrados en el período.
              </p>
            </div>
          )}
        </div>

        <div className="bg-surface-900/60 border border-surface-800 rounded-xl p-6 backdrop-blur-md space-y-4 cursor-pointer hover:border-surface-700 transition-colors" onClick={() => onNavigate('doctors')}>
          <div>
            <h4 className="zenith-section-title">Directorio médico</h4>
            <p className="text-xs text-surface-400">Perfiles registrados en la plataforma.</p>
          </div>
          <div className="space-y-3">
            {doctors.slice(0, 4).map((doctor) => (
              <div key={doctor.id} className="rounded-xl border border-surface-800 bg-surface-950/40 p-3">
                <p className="text-xs font-semibold text-white">{doctor.name}</p>
                <p className="text-[10px] text-surface-500">{doctor.specialty || 'Sin especialidad'} &bull; {doctor.mpps || 'Sin MPPS'}</p>
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
        <div className="bg-surface-900/60 border border-surface-800 rounded-xl p-6 backdrop-blur-md space-y-4">
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
                    <p className="text-[10px] text-surface-500 font-mono">{recipe.recipeId} &bull; {recipe.doctorName || 'Sin médico visible'}</p>
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
                <p className="text-[10px] text-surface-500">Emitido {new Date(recipe.createdAt).toLocaleDateString('es-ES')} &bull; Caduca {new Date(recipe.recipeExpiresAt).toLocaleDateString('es-ES')}</p>
              </div>
            ))}
            {!recipes.length ? <div className="text-xs text-surface-500">No hay recipes emitidos todavía.</div> : null}
          </div>
        </div>

        <div className="bg-surface-900/60 border border-surface-800 rounded-xl p-6 backdrop-blur-md space-y-4">
          <div>
            <h4 className="zenith-section-title">Actividad operativa</h4>
            <p className="text-xs text-surface-400">Sincronizada con recipes emitidos y catálogo activo.</p>
          </div>
          <div className="space-y-3">
            {recentRecipes.map((recipe) => (
              <div key={`recent-${recipe.recipeId}`} className="rounded-xl border border-surface-800 bg-surface-950/40 p-3 space-y-1">
                <p className="text-xs font-semibold text-white">{recipe.recipeId}</p>
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
