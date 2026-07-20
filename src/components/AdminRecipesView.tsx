'use client';

/**
 * @fileoverview Vista administrativa de recipes emitidos.
 * @description Muestra una tabla con los recipes emitidos, similar a la vista del paciente
 * pero adaptada para el administrador sin la sección de retiro.
 */

import { useEffect, useMemo, useState } from 'react';
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

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

interface RecipeItem {
  id_producto: string;
  nombre: string;
  cantidad_prescrita?: number;
  remaining_quantity?: number;
}

interface AdminRecipe {
  recipeId: string;
  patientName?: string;
  doctorName?: string;
  clinicalStatus: string;
  commercialStatus: string;
  createdAt: string;
  recipeExpiresAt: string;
  items?: RecipeItem[];
}

export default function AdminRecipesView() {
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<AdminRecipe | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRecipes = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/prescripciones');
        if (!cancelled) {
          setRecipes(Array.isArray(response.data?.items) ? response.data.items : []);
        }
      } catch {
        if (!cancelled) {
          setRecipes([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadRecipes();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return recipes;

    return recipes.filter((recipe) =>
      [recipe.recipeId, recipe.patientName || '', recipe.doctorName || '', recipe.clinicalStatus, recipe.commercialStatus]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [recipes, searchQuery]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activa':
      case 'active':
        return 'bg-secondary-500/10 text-secondary-400 border-secondary-500/25';
      case 'dispensada':
      case 'dispensed':
        return 'bg-primary-500/10 text-primary-400 border-primary-500/25';
      case 'vencida':
      case 'expired':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      default:
        return 'bg-surface-800/50 text-surface-400 border-surface-700';
    }
  };

  const getMedicationSummary = (recipe: AdminRecipe) => {
    if (!recipe.items || recipe.items.length === 0) return 'Sin medicamentos';
    return recipe.items.map((item) => item.nombre).join(', ');
  };

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
          onClick={() => window.location.reload()}
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
          className="w-full pl-10 pr-4 py-3 bg-surface-900/60 border border-surface-800 rounded-2xl text-xs text-white placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-800 text-surface-400 font-bold uppercase tracking-wider">
                <th className="text-left px-6 py-4">Código</th>
                <th className="text-left px-6 py-4">Emisión</th>
                <th className="text-left px-6 py-4">Medicamento</th>
                <th className="text-left px-6 py-4">Paciente</th>
                <th className="text-left px-6 py-4">Especialista</th>
                <th className="text-left px-6 py-4">Estado</th>
                <th className="text-right px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-850">
              {filteredRecipes.map((recipe) => (
                <tr
                  key={recipe.recipeId}
                  className="hover:bg-surface-850/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-surface-300 text-[10px]">{recipe.recipeId}</span>
                  </td>
                  <td className="px-6 py-4 text-surface-300">{formatDate(recipe.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className="text-surface-200 font-semibold">{getMedicationSummary(recipe)}</span>
                    {recipe.items && recipe.items.length > 0 && (
                      <p className="text-[10px] text-surface-500 mt-0.5">
                        {recipe.items.length} {recipe.items.length === 1 ? 'unidad' : 'unidad(es)'}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-surface-300">{recipe.patientName || 'Sin paciente'}</td>
                  <td className="px-6 py-4">
                    <span className="text-surface-200 font-semibold">{recipe.doctorName || 'Sin médico'}</span>
                    <p className="text-[10px] text-surface-500 mt-0.5">Prescripción clínica</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(recipe.clinicalStatus)}`}>
                      {recipe.clinicalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedRecipe(recipe)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-500/10 border border-secondary-500/25 text-secondary-400 rounded-lg text-[10px] font-bold hover:bg-secondary-500/20 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3 w-3" />
                      Visualizar / PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecipes.length === 0 && (
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

          <div className="relative bg-white text-surface-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] print:max-h-full print:shadow-none print:w-full print:rounded-none">

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

            <div className="overflow-y-auto p-8 print:p-0 print:overflow-visible space-y-6">
              {/* Header */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">RÉCIPE MÉDICO</h2>
                    <p className="text-xs text-gray-500 font-mono">{selectedRecipe.recipeId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Fecha de emisión</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(selectedRecipe.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Doctor / Patient info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Especialista</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.doctorName || 'Sin médico asignado'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Paciente</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.patientName || 'Sin paciente asignado'}</p>
                </div>
              </div>

              {/* Medications table */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Medicamentos prescritos</p>
                <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                      <th className="text-left px-4 py-2.5">Medicamento</th>
                      <th className="text-center px-4 py-2.5">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedRecipe.items && selectedRecipe.items.length > 0 ? (
                      selectedRecipe.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.nombre}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.cantidad_prescrita || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-4 py-4 text-center text-gray-400">Sin medicamentos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Status */}
              <div className="flex gap-4 pt-2 border-t border-gray-200">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Estado clínico</p>
                  <p className="text-sm font-semibold text-gray-700">{selectedRecipe.clinicalStatus}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Estado comercial</p>
                  <p className="text-sm font-semibold text-gray-700">{selectedRecipe.commercialStatus}</p>
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
