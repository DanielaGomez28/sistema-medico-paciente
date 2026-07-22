'use client';

/**
 * @fileoverview Pasarela temporal de pago mock.
 * @description Permite simular una decisión de pago sin acoplar el flujo principal a un proveedor definitivo.
 */

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '../../lib/api';

/**
 * Contenido interactivo de la pasarela temporal.
 * @returns {JSX.Element}
 */
function PagoMockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = useMemo(() => searchParams.get('recipeId') || '', [searchParams]);
  const [loading, setLoading] = useState<'pay' | 'cancel' | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleDecision = async (decision: 'pay' | 'cancel') => {
    if (!recipeId) {
      setError('No se recibió una receta válida para procesar el pago.');
      return;
    }

    try {
      setLoading(decision);
      setError('');
      const response = await apiClient.post('/pagos/mock/decision', { recipeId, decision });
      setMessage(response.data?.message || 'Decisión procesada correctamente.');
      setTimeout(() => {
        router.push(`/delivery-method?recipeId=${recipeId}`);
      }, 1200);
    } catch (requestError: unknown) {
      setError(
        (requestError as { response?: { data?: { error?: string; details?: string } } })?.response?.data?.error ||
          (requestError as { response?: { data?: { error?: string; details?: string } } })?.response?.data?.details ||
          'No se pudo procesar la decisión en la pasarela temporal.'
      );
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="w-full max-w-lg rounded-3xl border border-surface-800 bg-surface-900/80 p-8 space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-surface-500 font-bold">Pasarela temporal</p>
        <h1 className="text-2xl font-bold">Confirmar pago</h1>
        <p className="text-sm text-surface-400">Receta asociada: <span className="font-mono text-primary-300">{recipeId || 'SIN-RECETA'}</span></p>
      </div>

      <div className="rounded-2xl border border-surface-800 bg-surface-950/70 p-4 text-sm text-surface-300">
        Esta pantalla simula una pasarela externa sin acoplar la lógica del SMP a un proveedor definitivo.
      </div>

      {message ? <div className="rounded-xl border border-secondary-500/30 bg-secondary-500/10 px-4 py-3 text-sm text-secondary-300">{message}</div> : null}
      {error ? <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">{error}</div> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { void handleDecision('pay'); }}
          disabled={loading !== ''}
          className="rounded-2xl bg-secondary-600 hover:bg-secondary-500 disabled:opacity-60 px-4 py-3 font-bold"
        >
          {loading === 'pay' ? 'Procesando pago...' : 'Realizar pago'}
        </button>
        <button
          type="button"
          onClick={() => { void handleDecision('cancel'); }}
          disabled={loading !== ''}
          className="rounded-2xl border border-surface-700 bg-surface-950 hover:bg-surface-900 disabled:opacity-60 px-4 py-3 font-bold text-surface-200"
        >
          {loading === 'cancel' ? 'Cancelando...' : 'No pagar ahora'}
        </button>
      </div>

      {/* Salida siempre disponible: sin esto la pasarela es una pantalla sin
          retorno (no tiene header ni sidebar), y si la decisión falla el
          usuario queda atrapado sin forma de volver al portal. */}
      <button
        type="button"
        onClick={() => { router.push('/'); }}
        disabled={loading !== ''}
        className="w-full rounded-2xl border border-surface-800 bg-transparent hover:bg-surface-900 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-surface-400 hover:text-surface-200 transition-colors"
      >
        Volver al portal
      </button>
    </div>
  );
}

/**
 * Pagina de pasarela temporal envuelta en Suspense para compatibilidad con prerender.
 * @returns {JSX.Element}
 */
export default function PagoMockPage() {
  return (
    <main className="min-h-screen bg-surface-950 text-white flex items-center justify-center px-4 py-10">
      <Suspense
        fallback={
          <div className="w-full max-w-lg rounded-3xl border border-surface-800 bg-surface-900/80 p-8 space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-surface-500 font-bold">Pasarela temporal</p>
            <h1 className="text-2xl font-bold">Confirmar pago</h1>
            <p className="text-sm text-surface-400">Cargando información de la receta...</p>
          </div>
        }
      >
        <PagoMockContent />
      </Suspense>
    </main>
  );
}
