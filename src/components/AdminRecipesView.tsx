'use client';

/**
 * @fileoverview Vista administrativa de recipes emitidos.
 * @description Muestra una tabla con los recipes emitidos, similar a la vista del paciente
 * pero adaptada para el administrador sin la sección de retiro.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { translateStatus, getRecipeStatusBadgeClassName } from '../lib/statusColors';
import {
  FileText,
  Eye,
  X,
  Printer,
  FileCheck,
  Download,
  Search,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../lib/api';
import PrintablePrescription from './PrintablePrescription';
import ListCard from './ui/ListCard';

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

// OJO: los items de una receta ya emitida usan claves en ESPAÑOL (nombre,
// cantidad_prescrita) porque son el payload que arma el formulario del
// médico al crear la receta -- nunca se tradujo. Es distinto del catálogo
// de productos, que sí usa inglés porque es un DTO real del backend. No
// mezclar los dos (ver el mismo comentario en DoctorView.tsx/PatientView.tsx).
interface RecipeItem {
  id: string;
  lineId?: string;
  nombre: string;
  dosis?: string;
  presentacion?: string;
  laboratorio?: string;
  principio_activo?: string;
  cantidad_prescrita?: number;
  cantidad_dispensada?: number;
  remaining_quantity?: number;
  treatment_days?: number | null;
  daily_doses?: number | null;
}

interface AdminRecipe {
  recipeId: string;
  patientName?: string;
  doctorName?: string;
  clinicalStatus: string;
  commercialStatus: string;
  fulfillmentStatus?: string;
  createdAt: string;
  recipeExpiresAt: string;
  observaciones?: string;
  items?: RecipeItem[];
}

const ADMIN_RECIPE_LIST_INITIAL_COUNT = 5;
const ADMIN_RECIPE_LIST_LOAD_MORE_COUNT = 5;

/**
 * Vista administrativa de recetas médicas: lista, filtra por búsqueda y
 * muestra el estado clínico, comercial y de despacho de cada receta.
 *
 * @returns {JSX.Element} Panel de administración de recetas.
 */
export default function AdminRecipesView() {
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<AdminRecipe | null>(null);
  const [recipesVisibleCount, setRecipesVisibleCount] = useState(ADMIN_RECIPE_LIST_INITIAL_COUNT);

  /**
   * Recarga el listado de récipes desde el servidor.
   * @param {{ cancelled?: () => boolean }} [options] - Permite descartar el
   *   resultado si el componente se desmontó durante la petición.
   * @returns {Promise<void>}
   */
  const loadRecipes = useCallback(async (options?: { cancelled?: () => boolean }) => {
    const isCancelled = () => Boolean(options?.cancelled?.());

    try {
      setLoading(true);
      const response = await apiClient.get('/prescripciones');
      if (!isCancelled()) {
        setRecipes(Array.isArray(response.data?.items) ? response.data.items : []);
      }
    } catch {
      if (!isCancelled()) {
        setRecipes([]);
      }
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Ver nota equivalente en DashboardView: carga inicial del listado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecipes({ cancelled: () => cancelled });

    return () => {
      cancelled = true;
    };
  }, [loadRecipes]);

  useEffect(() => {
    setRecipesVisibleCount(ADMIN_RECIPE_LIST_INITIAL_COUNT);
  }, [recipes, searchQuery]);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const base = !query
      ? recipes
      : recipes.filter((recipe) =>
          [recipe.recipeId, recipe.patientName || '', recipe.doctorName || '', recipe.clinicalStatus, recipe.commercialStatus]
            .join(' ')
            .toLowerCase()
            .includes(query)
        );

    return [...base].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [recipes, searchQuery]);

  const visibleRecipes = useMemo(
    () => filteredRecipes.slice(0, recipesVisibleCount),
    [filteredRecipes, recipesVisibleCount]
  );

  const hasMoreRecipes = filteredRecipes.length > recipesVisibleCount;
  const canShowLessRecipes = recipesVisibleCount > ADMIN_RECIPE_LIST_INITIAL_COUNT;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => getRecipeStatusBadgeClassName(status);

  const getMedicationSummary = (recipe: AdminRecipe) => {
    if (!recipe.items || recipe.items.length === 0) return 'Sin medicamentos';
    return recipe.items.map((item) => item.nombre).join(', ');
  };

  const renderStatusBadge = (status?: string) => (
    <span className={`recipe-status-badge ${getStatusColor(status || '')}`}>
      {translateStatus(status || 'pending')}
    </span>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="zenith-section-title text-lg">Récipes Emitidos por Especialistas</h2>
          <p className="text-xs text-surface-400 mt-1">Monitor administrativo de todas las prescripciones médicas del sistema.</p>
        </div>
        <button
          type="button"
          onClick={() => { void loadRecipes(); }}
          disabled={loading}
          className="px-4 py-2.5 bg-surface-900 border border-surface-800 rounded-xl text-surface-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
        <input
          type="text"
          placeholder="Buscar por código, paciente, médico o estado..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface-900/60 border border-surface-800 rounded-xl text-xs text-white placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="portal-dashboard-card portal-dashboard-card--flush">
        <div className="zenith-table-wrap admin-recipes-table hidden lg:block">
          <table className="zenith-table zenith-table--divided text-xs">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr className="admin-recipes-table__head-row border-b border-surface-850">
                <th className="admin-recipes-table__head zenith-table__code">Código</th>
                <th className="admin-recipes-table__head">Emisión</th>
                <th className="admin-recipes-table__head zenith-table__wrap">Medicamento</th>
                <th className="admin-recipes-table__head zenith-table__wrap">Paciente</th>
                <th className="admin-recipes-table__head zenith-table__wrap">Especialista</th>
                <th className="admin-recipes-table__head">Clínico</th>
                <th className="admin-recipes-table__head">Reserva</th>
                <th className="admin-recipes-table__head">Entrega</th>
                <th className="admin-recipes-table__head">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecipes.map((recipe) => (
                <tr
                  key={recipe.recipeId}
                  className="hover:bg-surface-850/25 transition-colors"
                >
                  <td className="py-3 pr-2 font-mono text-[10px] text-surface-300 zenith-table__code align-top">
                    {recipe.recipeId}
                  </td>
                  <td className="py-3 text-surface-400 whitespace-nowrap align-top">{formatDate(recipe.createdAt)}</td>
                  <td className="py-3 zenith-table__wrap align-top">
                    <span className="text-surface-200 font-semibold break-words line-clamp-2">{getMedicationSummary(recipe)}</span>
                    {recipe.items && recipe.items.length > 0 ? (
                      <p className="text-[10px] text-surface-500 mt-0.5">
                        {recipe.items.length} {recipe.items.length === 1 ? 'unidad' : 'unidad(es)'}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 zenith-table__wrap text-surface-300 break-words align-top">{recipe.patientName || 'Sin paciente'}</td>
                  <td className="py-3 zenith-table__wrap text-surface-200 font-semibold break-words align-top">{recipe.doctorName || 'Sin médico'}</td>
                  <td className="py-3 align-top">{renderStatusBadge(recipe.clinicalStatus)}</td>
                  <td className="py-3 align-top">{renderStatusBadge(recipe.commercialStatus)}</td>
                  <td className="py-3 align-top">{renderStatusBadge(recipe.fulfillmentStatus || 'not_fulfilled')}</td>
                  <td className="py-3 text-right align-top">
                    <button
                      type="button"
                      onClick={() => setSelectedRecipe(recipe)}
                      className="admin-recipe-view-btn inline-flex max-w-full items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      <Eye className="h-3 w-3 shrink-0" />
                      <span className="truncate">Ver PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-3 p-4">
          {visibleRecipes.map((recipe) => (
            <ListCard
              key={recipe.recipeId}
              title={<span className="font-mono text-[10px] break-all">Recipe: {recipe.recipeId}</span>}
              subtitle={recipe.patientName || 'Sin paciente'}
              badge={renderStatusBadge(recipe.clinicalStatus)}
              fields={[
                { label: 'Emisión', value: formatDate(recipe.createdAt) },
                { label: 'Medicamento', value: getMedicationSummary(recipe) },
                { label: 'Especialista', value: recipe.doctorName || 'Sin médico' },
                { label: 'Reserva', value: translateStatus(recipe.commercialStatus) },
                { label: 'Entrega', value: translateStatus(recipe.fulfillmentStatus || 'not_fulfilled') },
              ]}
              actions={
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(recipe)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-500/10 border border-secondary-500/25 text-secondary-400 rounded-lg text-[10px] font-bold hover:bg-secondary-500/20 transition-colors cursor-pointer"
                >
                  <Eye className="h-3 w-3" />
                  Visualizar / PDF
                </button>
              }
            />
          ))}
        </div>

        {!loading && filteredRecipes.length > 0 && (hasMoreRecipes || canShowLessRecipes) ? (
          <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-2 border-t border-surface-850">
            {canShowLessRecipes ? (
              <button
                type="button"
                onClick={() =>
                  setRecipesVisibleCount((current) =>
                    Math.max(ADMIN_RECIPE_LIST_INITIAL_COUNT, current - ADMIN_RECIPE_LIST_LOAD_MORE_COUNT)
                  )
                }
                className="admin-recipe-list-toggle text-xs cursor-pointer"
              >
                Leer menos
              </button>
            ) : (
              <span aria-hidden="true" />
            )}
            {hasMoreRecipes ? (
              <button
                type="button"
                onClick={() =>
                  setRecipesVisibleCount((current) => current + ADMIN_RECIPE_LIST_LOAD_MORE_COUNT)
                }
                className="admin-recipe-list-toggle text-xs cursor-pointer ml-auto"
              >
                Leer más
              </button>
            ) : null}
          </div>
        ) : null}

        {filteredRecipes.length === 0 && !loading && (
          <div className="text-center py-12 text-surface-500 text-xs">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
            {searchQuery ? 'No se encontraron recipes que coincidan con la búsqueda.' : 'No hay recipes emitidos todavía.'}
          </div>
        )}
      </div>

      {/* Recipe Detail Modal (printable) */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-surface-950/75 backdrop-blur-sm" onClick={() => setSelectedRecipe(null)}></div>

          <div className="relative bg-white text-surface-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[95vh] print:max-h-full print:shadow-none print:w-full print:rounded-none">

            <div className="flex items-center justify-between px-6 py-3.5 bg-surface-900 text-white border-b border-surface-800 print:hidden">
              <span className="text-xs font-bold font-mono text-primary-400 flex items-center gap-1.5">
                <FileCheck className="h-4.5 w-4.5" />
                VISTA PREVIA DEL RÉCIPE CLÍNICO
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                  title="Descargar"
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs bg-surface-850 hover:bg-surface-800 text-white font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-surface-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <PrintablePrescription
              recipeId={selectedRecipe.recipeId}
              issuedAt={formatDate(selectedRecipe.createdAt)}
              expiresAt={formatDate(selectedRecipe.recipeExpiresAt)}
              patientName={selectedRecipe.patientName || 'Sin paciente asignado'}
              doctorName={selectedRecipe.doctorName || 'Sin médico asignado'}
              notes={selectedRecipe.observaciones}
              facilityName="+SALUD"
              facilitySubtitle="Sistema Médico-Paciente"
              documentLabel="Récipe clínico"
              signatureFooter="Validado por el sistema"
              verificationLabel="Verificable en el portal +Salud"
              items={(selectedRecipe.items || []).map((item, idx) => ({
                id: item.lineId || `${selectedRecipe.recipeId}-${idx}`,
                name: item.nombre,
                instructions: item.dosis,
                presentation: item.presentacion,
                laboratory: item.laboratorio,
                activeIngredient: item.principio_activo,
                prescribedQuantity: item.cantidad_prescrita,
                dispensedQuantity: item.cantidad_dispensada,
                treatmentDays: item.treatment_days,
                dailyDoses: item.daily_doses,
              }))}
            />

            {/* Estado administrativo: no forma parte del recetario que ve el paciente. */}
            <div className="px-8 pb-8 print:hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Estado clínico</p>
                  <p className="text-sm font-semibold text-gray-700">{translateStatus(selectedRecipe.clinicalStatus)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Estado comercial</p>
                  <p className="text-sm font-semibold text-gray-700">{translateStatus(selectedRecipe.commercialStatus)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Estado de entrega</p>
                  <p className="text-sm font-semibold text-gray-700">{translateStatus(selectedRecipe.fulfillmentStatus || '')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Válido hasta</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(selectedRecipe.recipeExpiresAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
