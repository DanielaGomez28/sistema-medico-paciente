/**
 * Lista oficial inmutable de los 23 estados de Venezuela más
 * las Dependencias Federales y el Distrito Capital.
 * @constant {readonly string[]}
 */
export const VENEZUELAN_STATES = [
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Dependencias Federales',
  'Distrito Capital',
  'Falcón',
  'Guárico',
  'La Guaira',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Táchira',
  'Trujillo',
  'Yaracuy',
  'Zulia',
] as const;

/**
 * Tipo que representa uno de los estados oficiales de Venezuela.
 * @type {VenezuelanState}
 */
export type VenezuelanState = (typeof VENEZUELAN_STATES)[number];

/**
 * Determina si una cadena de texto es un estado válido de Venezuela (Type Guard).
 *
 * @param {string} value - El nombre del estado a evaluar.
 * @returns {value is VenezuelanState} `true` si es válido, `false` en caso contrario.
 */
export function isVenezuelanState(value: string): value is VenezuelanState {
  return (VENEZUELAN_STATES as readonly string[]).includes(value);
}
