import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';

/**
 * Versión actual del esquema de datos de productos.
 * @constant {number}
 */
export const PRODUCTS_DATA_VERSION = 2;

/**
 * Lista consolidada de categorías de farmacia disponibles.
 * Incluye las categorías de los productos iniciales y 'Farmacia General'.
 * @constant {readonly string[]}
 */
export const PHARMACY_CATEGORIES = [
  ...new Set([
    ...INITIAL_PRODUCTS.map((product) => product.category),
    'Farmacia General',
  ]),
] as const;

/**
 * Categoría de farmacia predeterminada a utilizar cuando no se especifica una.
 * @constant {string}
 */
export const DEFAULT_PHARMACY_CATEGORY = PHARMACY_CATEGORIES[0];

const LEGACY_CATEGORIES = new Set([
  'Tecnología',
  'Audio',
  'Oficina',
  'Hogar',
  'Electrónica',
  'General',
]);

function hasLegacyCatalog(products: Product[]): boolean {
  return products.some(
    (product) =>
      LEGACY_CATEGORIES.has(product.category) ||
      product.productType !== 'medicamento' ||
      !product.id.startsWith('med-')
  );
}

/**
 * Determina si el almacenamiento local de productos debe ser refrescado.
 * Se refresca si la versión es antigua, si no hay productos, o si los productos tienen un esquema antiguo (legacy).
 *
 * @param {number | null} storedVersion - La versión del catálogo almacenada.
 * @param {Product[] | null} products - La lista de productos almacenada.
 * @returns {boolean} `true` si debe refrescarse, `false` de lo contrario.
 */
export function shouldRefreshProductsStorage(
  storedVersion: number | null,
  products: Product[] | null
): boolean {
  if (storedVersion === null || storedVersion < PRODUCTS_DATA_VERSION) {
    return true;
  }
  if (!products?.length) {
    return true;
  }
  return hasLegacyCatalog(products);
}

/**
 * Carga los productos desde el almacenamiento local o una cadena de texto JSON.
 * En caso de falla o falta de datos, retorna la lista de productos por defecto.
 *
 * @param {string | null} raw - Cadena de texto JSON del almacenamiento.
 * @returns {Product[]} Lista de productos validados.
 */
export function loadProductsFromStorage(raw: string | null): Product[] {
  if (!raw) {
    return INITIAL_PRODUCTS;
  }

  try {
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}
