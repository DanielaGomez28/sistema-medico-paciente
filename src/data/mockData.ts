/**
 * @fileoverview Datos de soporte mock data.
 * @description Centraliza semillas, catálogos o estructuras temporales consumidas por la interfaz.
 */
import { Product, Customer, Order } from '../types';

/**
 * Colección inicial de productos o medicamentos de prueba.
 * Utilizado para sembrar la base de datos o el almacenamiento local.
 * @constant {Product[]}
 */
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'med-1',
    name: 'Ramipril 5mg',
    sku: 'RX-RAM-001',
    category: 'Cardiovascular',
    price: 12.50,
    stock: 120,
    minStock: 20,
    imageColor: 'from-primary to-secondary',
    productType: 'medicamento',
  },
  {
    id: 'med-2',
    name: 'Aspirina 100mg',
    sku: 'RX-ASP-002',
    category: 'Analgesia / Antiagregante',
    price: 6.00,
    stock: 450,
    minStock: 50,
    imageColor: 'from-primary to-primary-600',
    productType: 'medicamento',
  },
  {
    id: 'med-3',
    name: 'Amoxicilina 875mg + Ácido Clavulánico 125mg',
    sku: 'RX-AMO-003',
    category: 'Antibiótico',
    price: 18.20,
    stock: 80,
    minStock: 15,
    imageColor: 'from-secondary to-secondary-600',
    productType: 'medicamento',
  },
  {
    id: 'med-4',
    name: 'Metformina 850mg',
    sku: 'RX-MET-004',
    category: 'Antidiabético',
    price: 9.80,
    stock: 310,
    minStock: 40,
    imageColor: 'from-primary to-secondary',
    productType: 'medicamento',
  },
  {
    id: 'med-5',
    name: 'Atorvastatina 20mg',
    sku: 'RX-ATO-005',
    category: 'Hipolipemiante',
    price: 15.40,
    stock: 150,
    minStock: 25,
    imageColor: 'from-secondary to-secondary-600',
    productType: 'medicamento',
  },
  {
    id: 'med-6',
    name: 'Ibuprofeno 600mg',
    sku: 'RX-IBU-006',
    category: 'Antiinflamatorio',
    price: 4.50,
    stock: 500,
    minStock: 60,
    imageColor: 'from-primary to-primary-600',
    productType: 'medicamento',
  },
];

/**
 * Colección inicial de clientes o pacientes de prueba.
 * @constant {Customer[]}
 */
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '0412-3456789',
    address: 'Av. Principal de Las Mercedes, Edif. Humana, Piso 4, Urb. Las Mercedes',
    municipio: 'Baruta',
    state: 'Miranda',
    totalOrders: 4,
    totalSpent: 899.95,
  },
  {
    id: 'cust-2',
    name: 'Ana Gómez Román',
    email: 'ana.gomez@email.com',
    phone: '0424-8887777',
    address: 'Av. 100, Residencias El Viñedo, Urb. El Trigal Norte',
    municipio: 'Valencia',
    state: 'Carabobo',
    totalOrders: 2,
    totalSpent: 489.98,
  },
  {
    id: 'cust-3',
    name: 'Luis Rodríguez Silva',
    email: 'luis.rod@email.com',
    phone: '0414-6001122',
    address: 'Av. Lara, C.C. Barquisimeto Plaza, Nivel PB, Local 12',
    municipio: 'Iribarren',
    state: 'Lara',
    totalOrders: 1,
    totalSpent: 129.99,
  },
  {
    id: 'cust-4',
    name: 'Sofía Peralta Vega',
    email: 'sofia.peralta@email.com',
    phone: '0416-6773344',
    address: 'Av. Francisco de Miranda, Urb. Campo Alegre, Torre Parque Cristal, Piso 8',
    municipio: 'Chacao',
    state: 'Distrito Capital',
    totalOrders: 3,
    totalSpent: 1145.92,
  },
  {
    id: 'cust-5',
    name: 'David Ortiz Alarcón',
    email: 'david.ortiz@email.com',
    phone: '0426-6554433',
    address: 'Av. Las Delicias, Centro Médico de Maracay, Consultorio 3',
    municipio: 'Girardot',
    state: 'Aragua',
    totalOrders: 0,
    totalSpent: 0,
  }
];

/**
 * Colección inicial de pedidos de prueba.
 * @constant {Order[]}
 */
export const INITIAL_ORDERS: Order[] = [
  {
    id: 'PED-1001',
    customerId: 'cust-1',
    customerName: 'Carlos Mendoza',
    customerEmail: 'carlos.mendoza@email.com',
    items: [
      {
        productId: 'med-1',
        productName: 'Ramipril 5mg',
        price: 12.50,
        quantity: 2,
      },
      {
        productId: 'med-2',
        productName: 'Aspirina 100mg',
        price: 6.00,
        quantity: 1,
      }
    ],
    subtotal: 31.00,
    tax: 6.51,
    discount: 0,
    total: 37.51,
    status: 'Entregado',
    paymentMethod: 'Tarjeta',
    shippingAddress: 'Av. Principal de Las Mercedes, Edif. Humana, Piso 4, Urb. Las Mercedes — Baruta, Miranda',
    createdAt: '2026-06-01T10:30:00Z',
    history: [
      { status: 'Pendiente', timestamp: '2026-06-01T10:30:00Z', note: 'Pedido recibido a través de la web.' },
      { status: 'En Preparación', timestamp: '2026-06-01T14:15:00Z', note: 'Embalaje y preparación de los medicamentos.' },
      { status: 'Enviado', timestamp: '2026-06-02T09:00:00Z', note: 'Enviado por mensajería farmacéutica. Seguimiento: #FAR98234.' },
      { status: 'Entregado', timestamp: '2026-06-03T12:45:00Z', note: 'Entregado al paciente.' }
    ]
  },
  {
    id: 'PED-1002',
    customerId: 'cust-4',
    customerName: 'Sofía Peralta Vega',
    customerEmail: 'sofia.peralta@email.com',
    items: [
      {
        productId: 'med-4',
        productName: 'Metformina 850mg',
        price: 9.80,
        quantity: 2,
      },
      {
        productId: 'med-5',
        productName: 'Atorvastatina 20mg',
        price: 15.40,
        quantity: 1,
      }
    ],
    subtotal: 35.00,
    tax: 7.35,
    discount: 5.00,
    total: 37.35,
    status: 'Enviado',
    paymentMethod: 'Transferencia',
    shippingAddress: 'Av. Francisco de Miranda, Urb. Campo Alegre, Torre Parque Cristal, Piso 8 — Chacao, Distrito Capital',
    createdAt: '2026-06-05T08:20:00Z',
    history: [
      { status: 'Pendiente', timestamp: '2026-06-05T08:20:00Z', note: 'Esperando confirmación de transferencia bancaria.' },
      { status: 'En Preparación', timestamp: '2026-06-05T11:00:00Z', note: 'Transferencia verificada. Pedido en farmacia.' },
      { status: 'Enviado', timestamp: '2026-06-06T15:30:00Z', note: 'Listo para retiro en sucursal Farmacia.' }
    ]
  },
  {
    id: 'PED-1003',
    customerId: 'cust-2',
    customerName: 'Ana Gómez Román',
    customerEmail: 'ana.gomez@email.com',
    items: [
      {
        productId: 'med-3',
        productName: 'Amoxicilina 875mg + Ácido Clavulánico 125mg',
        price: 18.20,
        quantity: 1,
      },
      {
        productId: 'med-6',
        productName: 'Ibuprofeno 600mg',
        price: 4.50,
        quantity: 2,
      }
    ],
    subtotal: 27.20,
    tax: 5.71,
    discount: 2.00,
    total: 30.91,
    status: 'En Preparación',
    paymentMethod: 'Tarjeta',
    shippingAddress: 'Av. 100, Residencias El Viñedo, Urb. El Trigal Norte — Valencia, Carabobo',
    createdAt: '2026-06-07T14:45:00Z',
    history: [
      { status: 'Pendiente', timestamp: '2026-06-07T14:45:00Z', note: 'Pago aprobado mediante pasarela externa.' },
      { status: 'En Preparación', timestamp: '2026-06-07T17:00:00Z', note: 'Medicamentos en preparación en almacén.' }
    ]
  },
  {
    id: 'PED-1004',
    customerId: 'cust-3',
    customerName: 'Luis Rodríguez Silva',
    customerEmail: 'luis.rod@email.com',
    items: [
      {
        productId: 'med-2',
        productName: 'Aspirina 100mg',
        price: 6.00,
        quantity: 3,
      }
    ],
    subtotal: 18.00,
    tax: 3.78,
    discount: 0,
    total: 21.78,
    status: 'Pendiente',
    paymentMethod: 'Efectivo',
    shippingAddress: 'Av. 5 de Julio, Centro Comercial Barquisimeto, Local 12, Barquisimeto',
    createdAt: '2026-06-07T22:10:00Z',
    history: [
      { status: 'Pendiente', timestamp: '2026-06-07T22:10:00Z', note: 'Pedido registrado pendiente de pago.' }
    ]
  }
];


/**
 * Registro de medico de prueba para el dashboard administrativo.
 */
export interface DashboardDoctorRecord {
  id: string;
  name: string;
  specialty: string;
  license: string;
  recipesCount: number;
  commissionsEarned: number;
  status: 'Activo' | 'Inactivo';
}

/**
 * Registro de paciente de prueba para el dashboard administrativo.
 */
export interface DashboardPatientRecord {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastRecipeDate: string;
  withdrawalStatus: string;
}

/**
 * Registro de movimiento de stock de prueba para el dashboard administrativo.
 */
export interface DashboardStockMovement {
  id: string;
  medication: string;
  type: 'Entrada' | 'Salida';
  quantity: number;
  date: string;
  sourceDest: string;
}

/**
 * Seed de paciente vinculado para el portal medico.
 */
export interface DoctorLinkedPatientSeed {
  systemId?: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  phone: string;
  condition: string;
  allergies: string;
  lastVisit: string;
  medications: string[];
}

/**
 * Registro de comision de prueba para el portal medico.
 */
export interface DoctorCommissionSeed {
  id: string;
  date: string;
  patientName: string;
  medication: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'Acreditado' | 'Pendiente';
}

/**
 * Registro de recipe de prueba para el portal medico.
 */
export interface DoctorRecipeLogSeed {
  id: string;
  date: string;
  patientName: string;
  patientId: string;
  medications: string[];
  branch: string;
  status: 'Enviado' | 'Confirmado' | 'Retirado';
}

/**
 * Coleccion de medicos de prueba centralizada para el dashboard.
 */
export const DASHBOARD_DOCTOR_RECORDS: DashboardDoctorRecord[] = [
  { id: 'MED-101', name: 'Dr. Alejandro Ríos', specialty: 'Cardiología', license: 'MPPS 28.490 ? CMDC-12.458', recipesCount: 120, commissionsEarned: 1450.80, status: 'Activo' },
  { id: 'MED-102', name: 'Dra. Elena Vargas', specialty: 'Medicina General', license: 'MPPS 49.321 ? CMV-08.912', recipesCount: 85, commissionsEarned: 980.50, status: 'Activo' },
  { id: 'MED-103', name: 'Dr. Juan Pérez', specialty: 'Pediatría', license: 'MPPS 10.293 ? CMC-05.441', recipesCount: 42, commissionsEarned: 320.00, status: 'Activo' },
  { id: 'MED-104', name: 'Dra. Patricia Gómez', specialty: 'Endocrinología', license: 'MPPS 22.810 ? CMDC-09.104', recipesCount: 68, commissionsEarned: 740.20, status: 'Activo' },
  { id: 'MED-105', name: 'Dr. Roberto Sánchez', specialty: 'Dermatología', license: 'MPPS 19.340 ? CMM-03.287', recipesCount: 15, commissionsEarned: 110.00, status: 'Inactivo' },
];

/**
 * Coleccion de pacientes de prueba centralizada para el dashboard.
 */
export const DASHBOARD_PATIENT_RECORDS: DashboardPatientRecord[] = [
  { id: 'PX-992-8849', name: 'Sofía Peralta', age: 28, condition: 'Hipertensión Arterial Leve', lastRecipeDate: '08 Jun, 2026', withdrawalStatus: 'Listo para retirar' },
  { id: 'PX-992-1029', name: 'Carlos Mendoza', age: 45, condition: 'Diabetes Tipo 2 (Controlada)', lastRecipeDate: '05 Jun, 2026', withdrawalStatus: 'Retirado' },
  { id: 'PX-992-0344', name: 'Ana Gómez Román', age: 34, condition: 'Ninguna (Chequeo anual)', lastRecipeDate: '01 Jun, 2026', withdrawalStatus: 'Retirado' },
  { id: 'PX-992-0811', name: 'Luis Rodríguez Silva', age: 52, condition: 'Chequeo de Presión Arterial', lastRecipeDate: '28 May, 2026', withdrawalStatus: 'Pendiente por retirar' },
  { id: 'PX-992-4112', name: 'David Ortiz Alarcón', age: 39, condition: 'Hipotiroidismo Crónico', lastRecipeDate: '15 May, 2026', withdrawalStatus: 'Retirado' },
];

/**
 * Coleccion de movimientos de inventario de prueba centralizada para el dashboard.
 */
export const DASHBOARD_STOCK_MOVEMENTS: DashboardStockMovement[] = [
  { id: 'MOV-104', medication: 'Ramipril 5mg', type: 'Salida', quantity: 30, date: '08 Jun, 2026', sourceDest: 'Farmacia Caracas' },
  { id: 'MOV-103', medication: 'Metformina 850mg', type: 'Salida', quantity: 60, date: '05 Jun, 2026', sourceDest: 'Farmacia Central Valencia' },
  { id: 'MOV-102', medication: 'Atorvastatina 20mg', type: 'Salida', quantity: 30, date: '01 Jun, 2026', sourceDest: 'Farmacia Maracaibo' },
  { id: 'MOV-101', medication: 'Ibuprofeno 600mg', type: 'Entrada', quantity: 500, date: '29 May, 2026', sourceDest: 'Laboratorio Proveedor S.A.' },
  { id: 'MOV-100', medication: 'Amoxicilina 875mg', type: 'Entrada', quantity: 200, date: '25 May, 2026', sourceDest: 'Droguería Médica S.A.' },
];

/**
 * Pacientes vinculados de prueba centralizados para el portal medico.
 */
export const DOCTOR_LINKED_PATIENT_SEEDS: DoctorLinkedPatientSeed[] = [
  {
    systemId: 'patient_sofia_peralta',
    patientId: 'V-28450123',
    name: 'Sofía Peralta',
    age: 28,
    gender: 'Femenino',
    bloodType: 'O+',
    phone: '+58 412 600 1234',
    condition: 'Hipertensión Arterial Leve',
    allergies: 'Penicilina',
    lastVisit: '08 Jun, 2026',
    medications: ['Ramipril 5mg', 'Aspirina 100mg'],
  },
  {
    systemId: 'patient_carlos_mendoza',
    patientId: 'V-15234891',
    name: 'Carlos Mendoza',
    age: 45,
    gender: 'Masculino',
    bloodType: 'A-',
    phone: '+58 424 699 9876',
    condition: 'Diabetes Tipo 2 (Controlada)',
    allergies: 'Ninguna conocida',
    lastVisit: '01 Jun, 2026',
    medications: ['Metformina 850mg'],
  },
  {
    systemId: 'patient_ana_martinez',
    patientId: 'V-22341567',
    name: 'Ana Gómez Román',
    age: 34,
    gender: 'Femenino',
    bloodType: 'B+',
    phone: '+58 414 611 2233',
    condition: 'Ninguna (Chequeo anual)',
    allergies: 'Ninguna conocida',
    lastVisit: '15 May, 2026',
    medications: [],
  },
  {
    systemId: 'patient_luis_rodriguez',
    patientId: 'V-18765432',
    name: 'Luis Rodríguez Silva',
    age: 52,
    gender: 'Masculino',
    bloodType: 'O-',
    phone: '+58 416 622 3344',
    condition: 'Hipertensión controlada',
    allergies: 'Sulfonamidas',
    lastVisit: '28 May, 2026',
    medications: ['Ibuprofeno 600mg'],
  },
];

/**
 * Comisiones de prueba centralizadas para el portal medico.
 */
export const DOCTOR_COMMISSION_SEEDS: DoctorCommissionSeed[] = [
  { id: 'COM-2026-041', date: '08 Jun, 2026', patientName: 'Sofía Peralta', medication: 'Ramipril 5mg + Aspirina 100mg', saleAmount: 18.50, commissionRate: 8, commissionAmount: 1.48, status: 'Acreditado' },
  { id: 'COM-2026-038', date: '05 Jun, 2026', patientName: 'Carlos Mendoza', medication: 'Metformina 850mg', saleAmount: 9.80, commissionRate: 8, commissionAmount: 0.78, status: 'Acreditado' },
  { id: 'COM-2026-031', date: '01 Jun, 2026', patientName: 'Ana Gómez Román', medication: 'Atorvastatina 20mg', saleAmount: 15.40, commissionRate: 8, commissionAmount: 1.23, status: 'Acreditado' },
  { id: 'COM-2026-029', date: '28 May, 2026', patientName: 'Luis Rodríguez Silva', medication: 'Ibuprofeno 600mg', saleAmount: 4.50, commissionRate: 8, commissionAmount: 0.36, status: 'Pendiente' },
  { id: 'COM-2026-022', date: '20 May, 2026', patientName: 'Sofía Peralta', medication: 'Aspirina 100mg', saleAmount: 6.00, commissionRate: 8, commissionAmount: 0.48, status: 'Acreditado' },
];

/**
 * Bitacora de recipes de prueba centralizada para el portal medico.
 */
export const DOCTOR_RECIPE_LOG_SEEDS: DoctorRecipeLogSeed[] = [
  { id: 'REC-2026-904', date: '08 Jun, 2026', patientName: 'Sofía Peralta', patientId: 'V-28450123', medications: ['Ramipril 5mg', 'Aspirina 100mg'], branch: 'Farmacia Caracas', status: 'Confirmado' },
  { id: 'REC-2026-901', date: '05 Jun, 2026', patientName: 'Carlos Mendoza', patientId: 'V-15234891', medications: ['Metformina 850mg'], branch: 'Farmacia Central Valencia', status: 'Retirado' },
  { id: 'REC-2026-887', date: '01 Jun, 2026', patientName: 'Ana Gómez Román', patientId: 'V-22341567', medications: ['Atorvastatina 20mg'], branch: 'Farmacia Maracaibo', status: 'Retirado' },
  { id: 'REC-2026-881', date: '28 May, 2026', patientName: 'Luis Rodríguez Silva', patientId: 'V-18765432', medications: ['Ibuprofeno 600mg'], branch: 'Farmacia Central Caracas', status: 'Enviado' },
];


/**
 * Registro de receta visible de prueba para el portal paciente.
 */
export interface PatientRecipeSeed {
  id: string;
  date: string;
  expiryDate: string;
  medication: string;
  dosage: string;
  instructions: string;
  doctor: string;
  specialty: string;
  doctorLicense: string;
  status: 'Activo' | 'Expirado';
}

/**
 * Registro de tratamiento visible de prueba para el portal paciente.
 */
export interface PatientTreatmentSeed {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduleTimes: string[];
  startDate: string;
  endDate: string;
  doctor: string;
  specialty: string;
  recipeId: string;
  totalDoses: number;
  takenDoses: number;
  status: 'En curso' | 'Completado' | 'Pausado';
  instructions: string;
}

/**
 * Registro de toma visible de prueba para el portal paciente.
 */
export interface PatientDoseLogSeed {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'Tomada' | 'Omitida' | 'Pendiente';
  date: string;
}

/**
 * Registro de alerta visible de prueba para el portal paciente.
 */
export interface PatientTreatmentAlertSeed {
  id: string;
  type: 'recordatorio' | 'control' | 'renovacion';
  title: string;
  message: string;
  date: string;
}

/**
 * Valores de perfil por defecto para el portal medico.
 */
export interface DoctorProfileDefaultsSeed {
  bankHolderId: string;
  bankEntity: string;
  bankAccountType: 'Corriente' | 'Ahorro';
  bankAccountNumber: string;
  bankMobilePhone: string;
  profilePhone: string;
  profileRegistryId: string;
  consultorioAddress: string;
  consultorioState: string;
  consultorioMunicipio: string;
}

/**
 * Valores de perfil por defecto para el portal paciente.
 */
export interface PatientProfileDefaultsSeed {
  profilePhone: string;
  deliveryAddress: string;
  deliveryState: string;
  deliveryMunicipio: string;
  selectedBranch: string;
}

/**
 * Configuracion mock del flujo de pago del portal paciente.
 */
export interface PatientPaymentSeed {
  gatewayUrl: string;
}

/**
 * Recetas visibles de prueba centralizadas para el portal paciente.
 */
export const PATIENT_RECIPE_SEEDS: PatientRecipeSeed[] = [
  {
    id: 'REC-2026-904',
    date: '06 Jun, 2026',
    expiryDate: '06 Dic, 2026',
    medication: 'Ramipril 5mg',
    dosage: '28 Comprimidos',
    instructions: 'Tomar 1 comprimido al dia por la manana en ayunas.',
    doctor: 'Dr. Alejandro Rios',
    specialty: 'Cardiologia',
    doctorLicense: 'MPPS 28.490 ? CMDC-12.458',
    status: 'Activo',
  },
  {
    id: 'REC-2026-901',
    date: '01 Jun, 2026',
    expiryDate: '01 Dic, 2026',
    medication: 'Aspirina 100mg',
    dosage: '30 Comprimidos Gastrorresistentes',
    instructions: 'Tomar 1 comprimido diario durante el almuerzo.',
    doctor: 'Dr. Alejandro Rios',
    specialty: 'Cardiologia',
    doctorLicense: 'MPPS 28.490 ? CMDC-12.458',
    status: 'Activo',
  },
  {
    id: 'REC-2026-712',
    date: '15 Abr, 2026',
    expiryDate: '15 May, 2026',
    medication: 'Amoxicilina 875mg + Acido Clavulanico 125mg',
    dosage: '14 Comprimidos',
    instructions: 'Tomar 1 comprimido cada 12 horas con las comidas por 7 dias.',
    doctor: 'Dr. Alejandro Rios',
    specialty: 'Medicina General',
    doctorLicense: 'MPPS 28.490 ? CMDC-12.458',
    status: 'Expirado',
  },
];

/**
 * Tratamientos visibles de prueba centralizados para el portal paciente.
 */
export const PATIENT_TREATMENT_SEEDS: PatientTreatmentSeed[] = [
  {
    id: 'trt-1',
    name: 'Ramipril 5mg',
    dosage: '1 comprimido',
    frequency: '1 vez al dia (manana)',
    scheduleTimes: ['08:00'],
    startDate: '06 Jun, 2026',
    endDate: '06 Dic, 2026',
    doctor: 'Dr. Alejandro Rios',
    specialty: 'Cardiologia',
    recipeId: 'REC-2026-904',
    totalDoses: 28,
    takenDoses: 14,
    status: 'En curso',
    instructions: 'Tomar en ayunas con un vaso de agua. Controlar presion arterial semanalmente.',
  },
  {
    id: 'trt-2',
    name: 'Aspirina 100mg',
    dosage: '1 comprimido gastrorresistente',
    frequency: '1 vez al dia (almuerzo)',
    scheduleTimes: ['13:00'],
    startDate: '01 Jun, 2026',
    endDate: '01 Dic, 2026',
    doctor: 'Dr. Alejandro Rios',
    specialty: 'Cardiologia',
    recipeId: 'REC-2026-901',
    totalDoses: 30,
    takenDoses: 20,
    status: 'En curso',
    instructions: 'Tomar durante el almuerzo. No masticar el comprimido.',
  },
];

/**
 * Logs de dosis de prueba centralizados para el portal paciente.
 */
export const PATIENT_DOSE_LOG_SEEDS: PatientDoseLogSeed[] = [
  { id: 'dose-1', medicationId: 'trt-1', medicationName: 'Ramipril 5mg', scheduledTime: '08:00', takenAt: '08:05', status: 'Tomada', date: '08 Jun, 2026' },
  { id: 'dose-2', medicationId: 'trt-2', medicationName: 'Aspirina 100mg', scheduledTime: '13:00', status: 'Pendiente', date: '08 Jun, 2026' },
  { id: 'dose-3', medicationId: 'trt-1', medicationName: 'Ramipril 5mg', scheduledTime: '08:00', takenAt: '08:10', status: 'Tomada', date: '07 Jun, 2026' },
  { id: 'dose-4', medicationId: 'trt-2', medicationName: 'Aspirina 100mg', scheduledTime: '13:00', takenAt: '13:15', status: 'Tomada', date: '07 Jun, 2026' },
  { id: 'dose-5', medicationId: 'trt-1', medicationName: 'Ramipril 5mg', scheduledTime: '08:00', status: 'Omitida', date: '06 Jun, 2026' },
  { id: 'dose-6', medicationId: 'trt-2', medicationName: 'Aspirina 100mg', scheduledTime: '13:00', takenAt: '13:05', status: 'Tomada', date: '06 Jun, 2026' },
];

/**
 * Alertas de tratamiento de prueba centralizadas para el portal paciente.
 */
export const PATIENT_TREATMENT_ALERT_SEEDS: PatientTreatmentAlertSeed[] = [
  {
    id: 'alert-3',
    type: 'renovacion',
    title: 'Renovacion de receta Ramipril',
    message: 'La receta REC-2026-904 vence el 06 Dic, 2026. Solicite renovacion con 15 dias de anticipacion.',
    date: '21 Nov, 2026',
  },
];

/**
 * Valores por defecto centralizados para el perfil del portal medico.
 */
export const DOCTOR_PROFILE_DEFAULTS: DoctorProfileDefaultsSeed = {
  bankHolderId: 'V-14890344',
  bankEntity: 'Banesco Banco Universal',
  bankAccountType: 'Corriente',
  bankAccountNumber: '0134-0100-01-0101234567',
  bankMobilePhone: '0414-1234567',
  profilePhone: '0212-9103348',
  profileRegistryId: 'DR-14890344',
  consultorioAddress: 'Av. Las Delicias, Centro Medico Docente La Trinidad, Piso 3, Consultorio 12',
  consultorioState: 'Miranda',
  consultorioMunicipio: 'Baruta',
};

/**
 * Valores por defecto centralizados para el perfil del portal paciente.
 */
export const PATIENT_PROFILE_DEFAULTS: PatientProfileDefaultsSeed = {
  profilePhone: '0412-6001234',
  deliveryAddress: 'Av. Francisco de Miranda, Urb. Campo Alegre, Edif. Parque Cristal, Piso 4B',
  deliveryState: 'Distrito Capital',
  deliveryMunicipio: 'Chacao',
  selectedBranch: 'Clinica Humana',
};

/**
 * Configuracion centralizada del flujo mock de pagos del portal paciente.
 */
export const PATIENT_PAYMENT_SEED: PatientPaymentSeed = {
  gatewayUrl: 'https://pagos.farmacia.local/checkout',
};


/**
 * Valores por defecto del usuario autenticado cuando el backend no entrega un campo opcional.
 */
export interface AppUserDefaultsSeed {
  adminName: string;
  doctorName: string;
  patientName: string;
}

/**
 * Cuentas de prueba visibles en la pantalla de login.
 */
export interface LoginTestUserSeed {
  email: string;
  password: string;
  role: 'admin' | 'medico' | 'paciente';
  name: string;
}

/**
 * Registro de auditoría financiera de prueba.
 */
export interface FinancialAuditLogSeed {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  previousValue: string;
  newValue: string;
  status: 'Aplicado' | 'Revertido';
}

/**
 * Registro de médicos de prueba para el directorio administrativo.
 */
export interface DoctorsDirectorySeed {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  specialty: string;
  licenseMpps: string;
  colegioMedico: string;
  status: 'Verificado' | 'Pendiente' | 'Inactivo';
  registeredAt: string;
}

/**
 * Textos y parámetros de presentación del portal paciente.
 */
export interface PatientPortalCopySeed {
  fallbackDoctorName: string;
  fallbackPatientName: string;
  fallbackSpecialty: string;
  doctorLicenseLabel: string;
  printableFacilityName: string;
  printableFacilitySubtitle: string;
  printableFacilityAddress: string;
  printableDocumentLabel: string;
  printableSignatureLabel: string;
  printableSignatureFooter: string;
  verificationPortalLabel: string;
  pharmacyBrandName: string;
  pharmacyLegalName: string;
  pharmacyLegalReference: string;
  selectedBranchOptions: string[];
  paymentHoldMinutes: number;
  paymentHoldSeconds: number;
}

/**
 * Valores por defecto del usuario autenticado.
 */
export const APP_USER_DEFAULTS: AppUserDefaultsSeed = {
  adminName: 'Administrador Sistema',
  doctorName: 'Dr. Roberto Gómez',
  patientName: 'Ana Martínez',
};

/**
 * Cuentas demo centralizadas del login.
 */
export const LOGIN_TEST_USERS: LoginTestUserSeed[] = [
  { email: 'admin@sistema.local', password: 'admin123', role: 'admin', name: APP_USER_DEFAULTS.adminName },
  { email: 'roberto.gomez@clinica.local', password: 'medico123', role: 'medico', name: APP_USER_DEFAULTS.doctorName },
  { email: 'ana.martinez@email.com', password: 'paciente123', role: 'paciente', name: APP_USER_DEFAULTS.patientName },
];

/**
 * Etiquetas visibles para las cuentas demo del login.
 */
export const LOGIN_TEST_ACCOUNT_LABELS: Record<string, string> = {
  admin: 'Admin',
  medico: 'Médico',
  paciente: 'Paciente',
};

/**
 * Historial financiero inicial para el panel administrativo.
 */
export const FINANCIAL_AUDIT_LOG_SEEDS: FinancialAuditLogSeed[] = [
  { id: 'AUD-301', timestamp: '2026-05-15 09:30:12', adminName: 'Carlos Mendoza', action: 'Configuración inicial de tasa', previousValue: '0.0%', newValue: '8.0%', status: 'Aplicado' },
  { id: 'AUD-302', timestamp: '2026-05-28 14:22:05', adminName: 'Carlos Mendoza', action: 'Actualización por acuerdo comercial', previousValue: '8.0%', newValue: '8.0%', status: 'Aplicado' },
];

/**
 * Directorio inicial de médicos para el panel administrativo.
 */
export const DOCTORS_DIRECTORY_SEEDS: DoctorsDirectorySeed[] = [
  { id: 'MED-101', firstName: 'Alejandro', lastName: 'Ríos', email: 'ale.rios@zenith.com', dni: 'V-14.890.344', specialty: 'Cardiología', licenseMpps: 'MPPS 28.490', colegioMedico: 'CMDC-12.458', status: 'Verificado', registeredAt: '2026-05-10' },
  { id: 'MED-102', firstName: 'Elena', lastName: 'Vargas', email: 'elena.vargas@zenith.com', dni: 'V-16.782.903', specialty: 'Medicina General', licenseMpps: 'MPPS 49.321', colegioMedico: 'CMV-08.912', status: 'Verificado', registeredAt: '2026-05-18' },
  { id: 'MED-103', firstName: 'Juan', lastName: 'Pérez', email: 'juan.perez@zenith.com', dni: 'V-12.334.892', specialty: 'Pediatría', licenseMpps: 'MPPS 10.293', colegioMedico: 'CMC-05.441', status: 'Verificado', registeredAt: '2026-06-01' },
];

/**
 * Especialidades disponibles en el formulario de alta de médicos.
 */
export const DOCTOR_SPECIALTY_OPTIONS: string[] = [
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Ginecología',
  'Medicina General',
  'Neurología',
  'Oftalmología',
  'Pediatría',
  'Psiquiatría',
  'Traumatología',
  'Urología'
];

/**
 * Textos y ventanas temporales del portal paciente.
 */
export const PATIENT_PORTAL_COPY: PatientPortalCopySeed = {
  fallbackDoctorName: APP_USER_DEFAULTS.doctorName,
  fallbackPatientName: APP_USER_DEFAULTS.patientName,
  fallbackSpecialty: 'Prescripción clínica',
  doctorLicenseLabel: 'Validación digital de farmacia',
  printableFacilityName: 'Clínica Zenith',
  printableFacilitySubtitle: 'Servicios de Cardiología y Diagnóstico Especializado',
  printableFacilityAddress: 'Av. Francisco de Miranda, Caracas • Tel: +58 212 345 6789',
  printableDocumentLabel: 'Documento digital firmado',
  printableSignatureLabel: 'Médico autorizado',
  printableSignatureFooter: 'Firma digital verificada',
  verificationPortalLabel: 'Verificar autenticidad en portal.zenithclinica.com',
  pharmacyBrandName: 'Farmacia Central',
  pharmacyLegalName: 'Farmacia Central C.A.',
  pharmacyLegalReference: 'RIF: J-30123456-7 • Av. Francisco de Miranda, Caracas',
  selectedBranchOptions: ['Farmacia Central', 'Farmacia Valencia'],
  paymentHoldMinutes: 20,
  paymentHoldSeconds: 20 * 60,
};
