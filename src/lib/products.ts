import { Product } from '../types';

/**
 * Determina si un producto es un medicamento basado en su tipo o SKU.
 *
 * @param {Product} product - Producto a evaluar.
 * @returns {boolean} `true` si es un medicamento, `false` de lo contrario.
 */
export function isMedicationProduct(product: Product): boolean {
  return product.productType === 'medicamento' || product.sku.startsWith('RX-');
}
