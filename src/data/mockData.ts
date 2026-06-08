import { Product, Customer, Order } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Teclado Mecánico RGB Aura',
    sku: 'TEC-MEC-001',
    category: 'Tecnología',
    price: 89.99,
    stock: 25,
    minStock: 5,
    imageColor: 'from-primary to-secondary',
  },
  {
    id: 'prod-2',
    name: 'Ratón Inalámbrico Pro Mouse',
    sku: 'RAT-INA-002',
    category: 'Tecnología',
    price: 59.99,
    stock: 40,
    minStock: 8,
    imageColor: 'from-primary to-primary-600',
  },
  {
    id: 'prod-3',
    name: 'Monitor UltraWide 34" Curved',
    sku: 'MON-CUR-003',
    category: 'Tecnología',
    price: 349.99,
    stock: 8,
    minStock: 3,
    imageColor: 'from-primary to-secondary',
  },
  {
    id: 'prod-4',
    name: 'Auriculares Cancelación Ruido ANC-9',
    sku: 'AUR-ANC-004',
    category: 'Audio',
    price: 129.99,
    stock: 15,
    minStock: 4,
    imageColor: 'from-secondary to-secondary-600',
  },
  {
    id: 'prod-5',
    name: 'Silla Ergonómica Premium Aero',
    sku: 'SIL-ERG-005',
    category: 'Oficina',
    price: 249.99,
    stock: 4,
    minStock: 5, // Triggers alert since stock < minStock
    imageColor: 'from-secondary to-secondary-600',
  },
  {
    id: 'prod-6',
    name: 'Escritorio Elevable Eléctrico',
    sku: 'ESC-ELE-006',
    category: 'Oficina',
    price: 399.99,
    stock: 6,
    minStock: 2,
    imageColor: 'from-primary to-primary-600',
  },
  {
    id: 'prod-7',
    name: 'Lámpara de Escritorio LED Inteligente',
    sku: 'LAM-LED-007',
    category: 'Hogar',
    price: 39.99,
    stock: 50,
    minStock: 10,
    imageColor: 'from-primary to-secondary',
  },
  {
    id: 'prod-8',
    name: 'Cargador Inalámbrico MagSafe 3 en 1',
    sku: 'CAR-MAG-008',
    category: 'Tecnología',
    price: 45.99,
    stock: 3,
    minStock: 6, // Triggers alert
    imageColor: 'from-primary to-primary-600',
  },
  {
    id: 'prod-9',
    name: 'Soporte de Aluminio para Portátil',
    sku: 'SOP-ALU-009',
    category: 'Oficina',
    price: 29.99,
    stock: 35,
    minStock: 10,
    imageColor: 'from-secondary to-secondary-600',
  },
  {
    id: 'prod-10',
    name: 'Micrófono USB Profesional Podcast',
    sku: 'MIC-USB-010',
    category: 'Audio',
    price: 79.99,
    stock: 12,
    minStock: 4,
    imageColor: 'from-primary to-secondary',
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+34 612 345 678',
    address: 'Calle de Alcalá 142, 3ºB',
    city: 'Madrid',
    totalOrders: 4,
    totalSpent: 899.95,
  },
  {
    id: 'cust-2',
    name: 'Ana Gómez Román',
    email: 'ana.gomez@email.com',
    phone: '+34 699 888 777',
    address: 'Avenida Diagonal 450, Ático',
    city: 'Barcelona',
    totalOrders: 2,
    totalSpent: 489.98,
  },
  {
    id: 'cust-3',
    name: 'Luis Rodríguez Silva',
    email: 'luis.rod@email.com',
    phone: '+34 600 111 222',
    address: 'Plaza Mayor 5, Bajo C',
    city: 'Salamanca',
    totalOrders: 1,
    totalSpent: 129.99,
  },
  {
    id: 'cust-4',
    name: 'Sofía Peralta Vega',
    email: 'sofia.peralta@email.com',
    phone: '+34 677 333 444',
    address: 'Paseo de la Castellana 210',
    city: 'Madrid',
    totalOrders: 3,
    totalSpent: 1145.92,
  },
  {
    id: 'cust-5',
    name: 'David Ortiz Alarcón',
    email: 'david.ortiz@email.com',
    phone: '+34 655 444 333',
    address: 'Calle Betis 12, 1ºA',
    city: 'Sevilla',
    totalOrders: 0,
    totalSpent: 0,
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'PED-1001',
    customerId: 'cust-1',
    customerName: 'Carlos Mendoza',
    customerEmail: 'carlos.mendoza@email.com',
    items: [
      {
        productId: 'prod-1',
        productName: 'Teclado Mecánico RGB Aura',
        price: 89.99,
        quantity: 1,
      },
      {
        productId: 'prod-2',
        productName: 'Ratón Inalámbrico Pro Mouse',
        price: 59.99,
        quantity: 1,
      }
    ],
    subtotal: 149.98,
    tax: 31.50, // 21% IVA
    discount: 0,
    total: 181.48,
    status: 'Entregado',
    paymentMethod: 'Tarjeta',
    shippingAddress: 'Calle de Alcalá 142, 3ºB, Madrid',
    createdAt: '2026-06-01T10:30:00Z',
    history: [
      { status: 'Pendiente', timestamp: '2026-06-01T10:30:00Z', note: 'Pedido recibido a través de la web.' },
      { status: 'En Preparación', timestamp: '2026-06-01T14:15:00Z', note: 'Embalaje y preparación de los productos.' },
      { status: 'Enviado', timestamp: '2026-06-02T09:00:00Z', note: 'Enviado por DHL Express. Seguimiento: #DHL98234.' },
      { status: 'Entregado', timestamp: '2026-06-03T12:45:00Z', note: 'Firmado por el destinatario.' }
    ]
  },
  {
    id: 'PED-1002',
    customerId: 'cust-4',
    customerName: 'Sofía Peralta Vega',
    customerEmail: 'sofia.peralta@email.com',
    items: [
      {
        productId: 'prod-3',
        productName: 'Monitor UltraWide 34" Curved',
        price: 349.99,
        quantity: 2,
      },
      {
        productId: 'prod-9',
        productName: 'Soporte de Aluminio para Portátil',
        price: 29.99,
        quantity: 1,
      }
    ],
    subtotal: 729.97,
    tax: 153.29,
    discount: 50.00, // Promotional discount
    total: 833.26,
    status: 'Enviado',
    paymentMethod: 'Transferencia',
    shippingAddress: 'Paseo de la Castellana 210, Madrid',
    createdAt: '2026-06-05T08:20:00Z',
    history: [
      { status: 'Pendiente', timestamp: '2026-06-05T08:20:00Z', note: 'Esperando confirmación de transferencia bancaria.' },
      { status: 'En Preparación', timestamp: '2026-06-05T11:00:00Z', note: 'Transferencia verificada. Pedido en almacén.' },
      { status: 'Enviado', timestamp: '2026-06-06T15:30:00Z', note: 'Entregado a SEUR. Tracking: #SEUR40092.' }
    ]
  },
  {
    id: 'PED-1003',
    customerId: 'cust-2',
    customerName: 'Ana Gómez Román',
    customerEmail: 'ana.gomez@email.com',
    items: [
      {
        productId: 'prod-5',
        productName: 'Silla Ergonómica Premium Aero',
        price: 249.99,
        quantity: 1,
      },
      {
        productId: 'prod-7',
        productName: 'Lámpara de Escritorio LED Inteligente',
        price: 39.99,
        quantity: 2,
      }
    ],
    subtotal: 329.97,
    tax: 69.29,
    discount: 15.00,
    total: 384.26,
    status: 'En Preparación',
    paymentMethod: 'Tarjeta',
    shippingAddress: 'Avenida Diagonal 450, Ático, Barcelona',
    createdAt: '2026-06-07T14:45:00Z',
    history: [
      { status: 'Pendiente', timestamp: '2026-06-07T14:45:00Z', note: 'Pago aprobado mediante pasarela Stripe.' },
      { status: 'En Preparación', timestamp: '2026-06-07T17:00:00Z', note: 'Asignado a operario en pasillo 4.' }
    ]
  },
  {
    id: 'PED-1004',
    customerId: 'cust-3',
    customerName: 'Luis Rodríguez Silva',
    customerEmail: 'luis.rod@email.com',
    items: [
      {
        productId: 'prod-4',
        productName: 'Auriculares Cancelación Ruido ANC-9',
        price: 129.99,
        quantity: 1,
      }
    ],
    subtotal: 129.99,
    tax: 27.30,
    discount: 0,
    total: 157.29,
    status: 'Pendiente',
    paymentMethod: 'Efectivo',
    shippingAddress: 'Plaza Mayor 5, Bajo C, Salamanca',
    createdAt: '2026-06-07T22:10:00Z',
    history: [
      { status: 'Pendiente', timestamp: '2026-06-07T22:10:00Z', note: 'Pedido contra reembolso registrado.' }
    ]
  }
];
