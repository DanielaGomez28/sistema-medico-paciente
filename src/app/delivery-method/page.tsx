/**
 * @fileoverview Página de selección de método de entrega para pedidos.
 * @description Permite al paciente elegir entre delivery a domicilio o retiro
 * en sede como paso final tras la generación de una receta, y simula el
 * guardado de la preferencia antes de redirigir al inicio.
 */

'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Truck, Store } from 'lucide-react';

/**
 * Contenido interactivo de selección de método de entrega (delivery o retiro
 * en sede), con confirmación simulada y redirección al inicio.
 *
 * @returns {JSX.Element} Formulario de selección de método de entrega.
 */
function DeliveryMethodContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = useMemo(() => searchParams.get('recipeId') || '', [searchParams]);
  
  const [method, setMethod] = useState<'delivery' | 'pickup' | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = () => {
    if (!method) return;
    setLoading(true);
    // Simular el guardado de la preferencia en el servidor
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }, 1000);
  };

  if (success) {
    return (
      <div className="w-full max-w-lg rounded-3xl border border-secondary-500/30 bg-secondary-500/10 p-10 text-center space-y-4">
        <h2 className="text-xl font-bold text-secondary-300">¡Preferencia guardada!</h2>
        <p className="text-sm text-secondary-200">
          Redirigiendo al inicio...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-3xl border border-surface-800 bg-surface-900/80 p-8 space-y-6">
      <div className="space-y-2 text-center border-b border-surface-850 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-surface-500 font-bold">Paso Final</p>
        <h1 className="text-2xl font-bold">¿Cómo querés recibir tus medicamentos?</h1>
        {recipeId && <p className="text-sm text-surface-400">Receta asociada: <span className="font-mono text-primary-300">{recipeId}</span></p>}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => setMethod('delivery')}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
            method === 'delivery'
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-surface-800 bg-surface-950 hover:border-surface-700'
          }`}
        >
          <div className={`p-3 rounded-full ${method === 'delivery' ? 'bg-primary-500/20 text-primary-400' : 'bg-surface-800 text-surface-400'}`}>
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Servicio de delivery</h3>
            <p className="text-sm text-surface-400">Te lo enviamos directamente a la dirección registrada en tu perfil.</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMethod('pickup')}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
            method === 'pickup'
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-surface-800 bg-surface-950 hover:border-surface-700'
          }`}
        >
          <div className={`p-3 rounded-full ${method === 'pickup' ? 'bg-primary-500/20 text-primary-400' : 'bg-surface-800 text-surface-400'}`}>
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Yo lo busco en la sede</h3>
            <p className="text-sm text-surface-400">Pasá a retirar tu pedido por nuestra sucursal más cercana.</p>
          </div>
        </button>
      </div>

      <div className="pt-4 space-y-3">
        <button
          type="button"
          disabled={!method || loading}
          onClick={handleConfirm}
          className="w-full rounded-2xl bg-secondary-600 hover:bg-secondary-500 disabled:opacity-50 disabled:hover:bg-secondary-600 px-4 py-4 font-bold transition-all"
        >
          {loading ? 'Guardando...' : 'Confirmar preferencia'}
        </button>

        {/* Salida siempre disponible: esta pantalla no tiene header ni sidebar,
            así que sin este botón el usuario queda atrapado si no quiere elegir
            un método ahora. */}
        <button
          type="button"
          disabled={loading}
          onClick={() => { router.push('/'); }}
          className="w-full rounded-2xl border border-surface-800 bg-transparent hover:bg-surface-900 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-surface-400 hover:text-surface-200 transition-colors"
        >
          Volver al portal
        </button>
      </div>
    </div>
  );
}

/**
 * Página que envuelve el contenido de selección de método de entrega en un
 * `Suspense` boundary, requerido por el uso de `useSearchParams`.
 *
 * @returns {JSX.Element} Layout de la página de método de entrega.
 */
export default function DeliveryMethodPage() {
  return (
    <main className="portal-flow-page min-h-screen bg-surface-950 text-foreground flex items-center justify-center px-4 py-10">
      <Suspense
        fallback={
          <div className="w-full max-w-lg rounded-3xl border border-surface-800 bg-surface-900/80 p-8 text-center text-surface-400">
            Cargando opciones...
          </div>
        }
      >
        <DeliveryMethodContent />
      </Suspense>
    </main>
  );
}
