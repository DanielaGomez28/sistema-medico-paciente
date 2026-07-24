/**
 * @fileoverview Sanitizadores y validadores de entrada para formularios.
 * @description Centraliza el filtrado de lo que el usuario puede TECLEAR en cada
 * tipo de campo. La regla es bloquear el caracter invalido en el momento de la
 * escritura en vez de reclamar al enviar: si un campo es un telefono, una letra
 * simplemente no aparece.
 *
 * OJO: esto es una capa de experiencia de usuario, NO una capa de seguridad. El
 * backend valida igual todo lo que recibe, porque cualquiera puede saltarse el
 * navegador. Un filtro que solo vive en el cliente es una sugerencia, no una
 * validacion.
 */

/** Longitud maxima de un numero telefonico venezolano sin separadores. */
const PHONE_DIGITS = 11;

/** Longitud maxima de una cedula venezolana. */
const CEDULA_DIGITS = 8;

// ---------------------------------------------------------------------------
// Sanitizadores: se aplican en onChange y devuelven el valor ya filtrado.
// ---------------------------------------------------------------------------

/**
 * Deja solo digitos.
 * @param {string} value - Valor tecleado.
 * @param {number} [maxLength] - Cantidad maxima de digitos a conservar.
 * @returns {string} Valor con unicamente digitos.
 */
export const onlyDigits = (value: string, maxLength?: number): string => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
};

/**
 * Deja solo letras, espacios y los signos propios de un nombre.
 * Acepta tildes y ñ mediante propiedades Unicode: un patron limitado a `A-Za-z`
 * rechazaria "Andrés Muñoz" y el usuario nunca entenderia por que.
 *
 * @param {string} value - Valor tecleado.
 * @param {number} [maxLength=120] - Longitud maxima.
 * @returns {string} Valor sin digitos ni simbolos ajenos a un nombre.
 */
export const onlyLetters = (value: string, maxLength = 120): string =>
  String(value ?? '')
    .replace(/[^\p{L}\s.'-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);

/**
 * Formatea un telefono venezolano como `0414-1234567`.
 * @param {string} value - Valor tecleado.
 * @returns {string} Telefono formateado.
 */
export const formatPhone = (value: string): string => {
  const digits = onlyDigits(value, PHONE_DIGITS);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
};

/**
 * Formatea una cedula venezolana con separadores de miles (`12.345.678`).
 * @param {string} value - Valor tecleado.
 * @returns {string} Cedula formateada.
 */
export const formatCedula = (value: string): string => {
  const digits = onlyDigits(value, CEDULA_DIGITS);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Acepta un decimal positivo con hasta dos decimales. Permite el punto final
 * mientras se escribe (`12.`) para no bloquear el tecleo a mitad de camino.
 *
 * @param {string} value - Valor tecleado.
 * @returns {string} Valor numerico decimal valido.
 */
export const decimalAmount = (value: string): string => {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole.slice(0, 9);
  return `${whole.slice(0, 9)}.${rest.join('').slice(0, 2)}`;
};

/**
 * Entero positivo acotado a un maximo.
 * @param {string} value - Valor tecleado.
 * @param {number} [max=999] - Valor maximo permitido.
 * @returns {string} Entero dentro del rango.
 */
export const boundedInteger = (value: string, max = 999): string => {
  const digits = onlyDigits(value, String(max).length);
  if (!digits) return '';
  return String(Math.min(Number(digits), max));
};

/**
 * Normaliza un registro MPPS: digitos con prefijo `MPPS-` opcional.
 * @param {string} value - Valor tecleado.
 * @returns {string} Registro MPPS normalizado en mayusculas.
 */
export const formatMpps = (value: string): string =>
  String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 17);

/**
 * Normaliza un registro sanitario especial (`RSE-50001`).
 * @param {string} value - Valor tecleado.
 * @returns {string} Registro normalizado en mayusculas.
 */
export const formatSanitaryRegistration = (value: string): string =>
  String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 20);

/**
 * Deja solo digitos y guiones, para numeros de cuenta bancaria.
 * @param {string} value - Valor tecleado.
 * @param {number} [maxLength=20] - Longitud maxima.
 * @returns {string} Numero de cuenta filtrado.
 */
export const accountNumber = (value: string, maxLength = 20): string =>
  String(value ?? '').replace(/[^\d-]/g, '').slice(0, maxLength);

/**
 * Texto libre acotado, sin caracteres usados en inyecciones de marcado.
 * @param {string} value - Valor tecleado.
 * @param {number} [maxLength=200] - Longitud maxima.
 * @returns {string} Texto saneado.
 */
export const safeText = (value: string, maxLength = 200): string =>
  String(value ?? '').replace(/[<>{}]/g, '').slice(0, maxLength);

/**
 * Normaliza un correo electronico: sin espacios y en minusculas.
 * @param {string} value - Valor tecleado.
 * @returns {string} Correo normalizado.
 */
export const normalizeEmail = (value: string): string =>
  String(value ?? '').replace(/\s/g, '').toLowerCase().slice(0, 120);

// ---------------------------------------------------------------------------
// Validadores: se aplican al enviar y devuelven un mensaje o null.
// ---------------------------------------------------------------------------

/**
 * Valida un telefono venezolano de 11 digitos con prefijo de operadora.
 * @param {string} value - Telefono a validar.
 * @param {boolean} [required=false] - Si el campo es obligatorio.
 * @returns {string | null} Mensaje de error, o `null` si es valido.
 */
export const validatePhone = (value: string, required = false): string | null => {
  const digits = onlyDigits(value);
  if (!digits) return required ? 'El telefono es obligatorio.' : null;
  if (digits.length !== PHONE_DIGITS) return 'El telefono debe tener 11 digitos (ej. 0414-1234567).';
  if (!/^0(2|4)\d{2}/.test(digits)) return 'El telefono debe comenzar con un codigo valido (0212, 0414, 0424...).';
  return null;
};

/**
 * Valida un correo electronico.
 * @param {string} value - Correo a validar.
 * @param {boolean} [required=false] - Si el campo es obligatorio.
 * @returns {string | null} Mensaje de error, o `null` si es valido.
 */
export const validateEmail = (value: string, required = false): string | null => {
  const email = String(value ?? '').trim();
  if (!email) return required ? 'El correo es obligatorio.' : null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'El correo no tiene un formato valido.';
  return null;
};

/**
 * Valida un nombre propio: solo letras y al menos dos caracteres.
 * @param {string} value - Nombre a validar.
 * @param {boolean} [required=true] - Si el campo es obligatorio.
 * @returns {string | null} Mensaje de error, o `null` si es valido.
 */
export const validateName = (value: string, required = true): string | null => {
  const name = String(value ?? '').trim();
  if (!name) return required ? 'El nombre es obligatorio.' : null;
  if (name.length < 2) return 'El nombre es demasiado corto.';
  if (/\d/.test(name)) return 'El nombre no puede contener numeros.';
  return null;
};

/**
 * Valida una edad dentro de un rango humano posible.
 * @param {string | number} value - Edad a validar.
 * @param {boolean} [required=false] - Si el campo es obligatorio.
 * @returns {string | null} Mensaje de error, o `null` si es valido.
 */
export const validateAge = (value: string | number, required = false): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return required ? 'La edad es obligatoria.' : null;
  const age = Number(raw);
  if (!Number.isInteger(age)) return 'La edad debe ser un numero entero.';
  if (age < 0 || age > 130) return 'La edad debe estar entre 0 y 130 anios.';
  return null;
};

/**
 * Valida un registro MPPS: de 4 a 12 digitos, con prefijo opcional.
 * @param {string} value - Registro a validar.
 * @param {boolean} [required=true] - Si el campo es obligatorio.
 * @returns {string | null} Mensaje de error, o `null` si es valido.
 */
export const validateMpps = (value: string, required = true): string | null => {
  const mpps = String(value ?? '').trim();
  if (!mpps) return required ? 'El registro MPPS es obligatorio.' : null;
  if (!/^(MPPS-)?\d{4,12}$/i.test(mpps)) return 'El MPPS debe tener entre 4 y 12 digitos (ej. MPPS-12345).';
  return null;
};

/**
 * Valida un registro sanitario especial con prefijo `RSE-`.
 * @param {string} value - Registro a validar.
 * @returns {string | null} Mensaje de error, o `null` si es valido.
 */
export const validateSanitaryRegistration = (value: string): string | null => {
  const rse = String(value ?? '').trim();
  if (!rse) return null;
  if (!/^RSE-[\d-]{4,20}$/i.test(rse)) return 'El registro sanitario debe tener el formato RSE-50001.';
  return null;
};

/**
 * Valida una contrasenia con un minimo razonable de robustez.
 * @param {string} value - Contrasenia a validar.
 * @param {boolean} [required=true] - Si el campo es obligatorio.
 * @returns {string | null} Mensaje de error, o `null` si es valida.
 */
export const validatePassword = (value: string, required = true): string | null => {
  const password = String(value ?? '');
  if (!password) return required ? 'La contrasenia es obligatoria.' : null;
  if (password.length < 8) return 'La contrasenia debe tener al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'La contrasenia debe combinar letras y numeros.';
  return null;
};

/**
 * Valida un monto decimal positivo.
 * @param {string | number} value - Monto a validar.
 * @param {{ min?: number; max?: number; required?: boolean }} [options] - Rango permitido.
 * @returns {string | null} Mensaje de error, o `null` si es valido.
 */
export const validateAmount = (
  value: string | number,
  options: { min?: number; max?: number; required?: boolean } = {}
): string | null => {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, required = false } = options;
  const raw = String(value ?? '').trim();
  if (!raw) return required ? 'El monto es obligatorio.' : null;
  const amount = Number(raw);
  if (Number.isNaN(amount)) return 'El monto debe ser un numero.';
  if (amount < min) return `El monto no puede ser menor a ${min}.`;
  if (amount > max) return `El monto no puede ser mayor a ${max}.`;
  return null;
};

/**
 * Valida una cedula venezolana de 6 a 8 digitos.
 * @param {string} value - Cedula a validar.
 * @param {boolean} [required=false] - Si el campo es obligatorio.
 * @returns {string | null} Mensaje de error, o `null` si es valida.
 */
export const validateCedula = (value: string, required = false): string | null => {
  const digits = onlyDigits(value);
  if (!digits) return required ? 'La cedula es obligatoria.' : null;
  if (digits.length < 6 || digits.length > CEDULA_DIGITS) return 'La cedula debe tener entre 6 y 8 digitos.';
  return null;
};

/**
 * Ejecuta varias validaciones y devuelve el primer error encontrado.
 * @param {Array<string | null>} results - Resultados de validadores individuales.
 * @returns {string | null} Primer mensaje de error, o `null` si todo es valido.
 */
export const firstError = (results: Array<string | null>): string | null =>
  results.find((result) => result !== null) ?? null;
