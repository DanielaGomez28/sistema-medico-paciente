/**
 * @fileoverview Utilidad de frontend customer location.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
import { Customer } from '../types';
import { INITIAL_CUSTOMERS } from '../data/mockData';

/**
 * Versión actual del esquema de datos de clientes.
 * @constant {number}
 */
export const CUSTOMERS_DATA_VERSION = 2;

const SEED_CUSTOMER_BY_ID = Object.fromEntries(
  INITIAL_CUSTOMERS.map((customer) => [customer.id, customer])
);

const SPANISH_CITIES = new Set([
  'Madrid',
  'Barcelona',
  'Salamanca',
  'Sevilla',
  'Bilbao',
  'Málaga',
  'Zaragoza',
  'Murcia',
]);

const SPANISH_ADDRESS_PATTERN =
  /Calle de|º[A-Z]|Ático|Avenida Diagonal|Paseo de la Castellana|Plaza Mayor|Bajo C|Calle Betis/i;

/**
 * Formatea la ubicación de un cliente (municipio y estado).
 *
 * @param {Pick<Customer, 'municipio' | 'state'>} customer - Objeto parcial del cliente con municipio y estado.
 * @returns {string} La ubicación formateada (ej: "Libertador, Distrito Capital").
 */
export function formatCustomerLocation(customer: Pick<Customer, 'municipio' | 'state'>) {
  return `${customer.municipio}, ${customer.state}`;
}

/**
 * Formatea la dirección completa de un cliente, incluyendo su ubicación.
 *
 * @param {Pick<Customer, 'address' | 'municipio' | 'state'>} customer - Objeto parcial del cliente.
 * @returns {string} Dirección completa formateada.
 */
export function formatCustomerAddress(customer: Pick<Customer, 'address' | 'municipio' | 'state'>) {
  return `${customer.address} — ${formatCustomerLocation(customer)}`;
}

/**
 * Determina si un cliente tiene un formato de datos heredado (legacy).
 * Esto incluye números con formato de España (+34) o direcciones españolas, 
 * así como la ausencia de municipio o estado.
 *
 * @param {Customer & { city?: string }} raw - Objeto de cliente en bruto, potencialmente con campo `city` heredado.
 * @returns {boolean} `true` si el cliente usa formato legacy, de lo contrario `false`.
 */
export function isLegacyCustomer(raw: Customer & { city?: string }): boolean {
  const legacyCity = raw.city ?? '';
  const municipio = raw.municipio ?? '';
  const state = raw.state ?? '';

  if (raw.phone?.includes('+34')) return true;
  if (legacyCity && !state) return true;
  if (SPANISH_CITIES.has(legacyCity)) return true;
  if (SPANISH_CITIES.has(municipio) && !state) return true;
  if (SPANISH_ADDRESS_PATTERN.test(raw.address ?? '')) return true;
  if (!state || !municipio) return true;

  return false;
}

/**
 * Migra registros antiguos (formato español o con campo `city`) al nuevo esquema venezolano.
 * 
 * @param {Customer & { city?: string }} raw - Objeto cliente crudo con datos legacy.
 * @returns {Customer} El cliente migrado y validado bajo el esquema actual.
 */
export function migrateCustomer(raw: Customer & { city?: string }): Customer {
  const legacy = isLegacyCustomer(raw);
  const seed = SEED_CUSTOMER_BY_ID[raw.id];

  if (legacy && seed) {
    return {
      ...seed,
      totalOrders: raw.totalOrders ?? seed.totalOrders,
      totalSpent: raw.totalSpent ?? seed.totalSpent,
    };
  }

  const municipio = raw.municipio ?? raw.city ?? '';
  const state = raw.state ?? '';
  let phone = raw.phone ?? '';
  let address = raw.address ?? '';

  if (legacy) {
    if (phone.includes('+34')) {
      phone = '0412-0000000';
    }
    if (SPANISH_ADDRESS_PATTERN.test(address)) {
      address = 'Av. Principal, Urb. Centro, Edif. Residencial, Piso 1';
    }
  }

  const { city: _city, ...rest } = raw;

  return {
    ...rest,
    address,
    phone,
    municipio: legacy && !state ? 'Libertador' : municipio,
    state: legacy && !state ? 'Distrito Capital' : state,
  };
}

/**
 * Carga la lista de clientes desde el almacenamiento local o una cadena JSON.
 * Si no hay datos, retorna los clientes semilla por defecto. Migra automáticamente.
 *
 * @param {string | null} stored - Cadena JSON con los clientes guardados en almacenamiento.
 * @returns {Customer[]} Lista de clientes validados y listos para uso.
 */
export function loadCustomersFromStorage(stored: string | null): Customer[] {
  if (!stored) {
    return INITIAL_CUSTOMERS;
  }

  const parsed = JSON.parse(stored) as (Customer & { city?: string })[];
  return parsed.map(migrateCustomer);
}

/**
 * Verifica si es necesario actualizar el almacenamiento de clientes
 * porque la versión guardada es anterior a la actual de la aplicación.
 *
 * @param {number | null} storedVersion - Versión actual en el almacenamiento.
 * @returns {boolean} `true` si debe refrescarse, `false` en caso contrario.
 */
export function shouldRefreshCustomersStorage(storedVersion: number | null): boolean {
  return storedVersion === null || storedVersion < CUSTOMERS_DATA_VERSION;
}
