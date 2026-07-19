/**
 * @fileoverview Tipos compartidos de index.
 * @description Expone contratos de tipado reutilizados en los distintos módulos del frontend.
 */
/**
 * Representa un producto o medicamento dentro del catálogo del sistema.
 * @interface Product
 * @property {string} id - Identificador único del producto.
 * @property {string} name - Nombre del producto o medicamento.
 * @property {string} sku - Código de referencia único (Stock Keeping Unit).
 * @property {string} category - Categoría a la que pertenece el producto.
 * @property {number} price - Precio de venta del producto.
 * @property {number} stock - Cantidad actual disponible en inventario.
 * @property {number} minStock - Cantidad mínima permitida antes de generar alerta.
 * @property {string} imageColor - Representación de color o gradiente (Tailwind) para la imagen.
 * @property {'medicamento' | 'general'} [productType] - Clasificación del tipo de producto.
 */
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  imageColor: string; // Tailwind gradient or color representation
  productType?: 'medicamento' | 'general';
}

/**
 * Representa a un cliente o paciente en el sistema.
 * @interface Customer
 * @property {string} id - Identificador único del cliente.
 * @property {string} name - Nombre completo del cliente.
 * @property {string} email - Correo electrónico de contacto.
 * @property {string} phone - Número de teléfono.
 * @property {string} address - Dirección de residencia o envío.
 * @property {string} municipio - Municipio de residencia (ej: Libertador).
 * @property {string} state - Estado de residencia (ej: Distrito Capital).
 * @property {number} totalOrders - Cantidad total de pedidos realizados.
 * @property {number} totalSpent - Monto total gastado históricamente.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  municipio: string;
  state: string;
  totalOrders: number;
  totalSpent: number;
}

/**
 * Representa un ítem individual dentro de un pedido.
 * @interface OrderItem
 * @property {string} productId - ID del producto referenciado.
 * @property {string} productName - Nombre del producto al momento de la compra.
 * @property {number} price - Precio unitario al momento de la compra.
 * @property {number} quantity - Cantidad comprada.
 */
export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

/**
 * Estados posibles en los que puede estar un pedido.
 * @type {OrderStatus}
 */
export type OrderStatus = 'Pendiente' | 'En Preparación' | 'Enviado' | 'Entregado' | 'Cancelado';

/**
 * Registro del historial de cambios de estado de un pedido.
 * @interface OrderStatusHistory
 * @property {OrderStatus} status - Estado en el que ingresó.
 * @property {string} timestamp - Fecha y hora del cambio de estado (ISO 8601).
 * @property {string} note - Nota o comentario adicional sobre el cambio.
 */
export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

/**
 * Representa un pedido realizado por un cliente.
 * @interface Order
 * @property {string} id - Identificador único del pedido.
 * @property {string} customerId - ID del cliente que realizó el pedido.
 * @property {string} customerName - Nombre del cliente al momento del pedido.
 * @property {string} customerEmail - Correo del cliente.
 * @property {OrderItem[]} items - Lista de ítems o productos en el pedido.
 * @property {number} subtotal - Monto total antes de impuestos y descuentos.
 * @property {number} tax - Monto de impuestos aplicados.
 * @property {number} discount - Monto de descuento aplicado.
 * @property {number} total - Monto final a pagar.
 * @property {OrderStatus} status - Estado actual del pedido.
 * @property {'Tarjeta' | 'Transferencia' | 'Efectivo'} paymentMethod - Método de pago utilizado.
 * @property {string} shippingAddress - Dirección de entrega del pedido.
 * @property {string} createdAt - Fecha y hora de creación del pedido (ISO 8601).
 * @property {OrderStatusHistory[]} history - Historial de estados por los que ha pasado el pedido.
 */
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'Tarjeta' | 'Transferencia' | 'Efectivo';
  shippingAddress: string;
  createdAt: string;
  history: OrderStatusHistory[];
}
