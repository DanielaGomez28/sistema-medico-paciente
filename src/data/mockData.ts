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
 * Valores por defecto centralizados para el perfil del portal paciente.
 */
export const PATIENT_PROFILE_DEFAULTS: PatientProfileDefaultsSeed = {
  profilePhone: '0412-6001234',
  deliveryAddress: 'Av. Francisco de Miranda, Urb. Campo Alegre, Edif. Parque Cristal, Piso 4B',
  deliveryState: 'Distrito Capital',
  deliveryMunicipio: 'Chacao',
  selectedBranch: 'Farmahumana - Puerto Ordaz (Calle 07)',
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
  adminName: 'Samy Sahili',
  doctorName: 'Cesar Mendoza',
  patientName: 'Karim Sahili',
};

/**
 * Cuentas demo centralizadas del login. Deben coincidir exactamente con los
 * usuarios sembrados por sql/seed/01_seed_demo_data.sql (misma contraseña
 * real: Demo1234!, hash bcrypt generado con la misma librería del backend).
 */
export const LOGIN_TEST_USERS: LoginTestUserSeed[] = [
  { email: 'samy.sahili@massalud.com', password: 'Demo1234!', role: 'admin', name: APP_USER_DEFAULTS.adminName },
  { email: 'cesar.mendoza@massalud.com', password: 'Demo1234!', role: 'medico', name: APP_USER_DEFAULTS.doctorName },
  { email: 'karim.sahili@gmail.com', password: 'Demo1234!', role: 'paciente', name: APP_USER_DEFAULTS.patientName },
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
  printableFacilityName: '+Salud',
  printableFacilitySubtitle: 'Plataforma de Prescripción Médica Digital • Red de Farmacias Aliadas',
  printableFacilityAddress: 'Av. Francisco de Miranda, Caracas • Tel: +58 212 345 6789',
  printableDocumentLabel: 'Documento digital firmado',
  printableSignatureLabel: 'Médico autorizado',
  printableSignatureFooter: 'Firma digital verificada',
  verificationPortalLabel: 'Verificar autenticidad en portal.massalud.com',
  pharmacyBrandName: 'Farmahumana',
  pharmacyLegalName: 'Farmahumana C.A.',
  pharmacyLegalReference: 'Farmacia aliada de +Salud • RIF: J-30123456-7 • Av. Francisco de Miranda, Caracas',
  selectedBranchOptions: [
    'Farmahumana - Puerto Ordaz (Calle 07)'
  ],
  paymentHoldMinutes: 20,
  paymentHoldSeconds: 20 * 60,
};

/**
 * Paso explicativo del módulo de ayuda del portal paciente.
 */
export interface PatientHelpStepSeed {
  title: string;
  description: string;
}

/**
 * Pregunta frecuente del módulo de ayuda del portal paciente.
 */
export interface PatientHelpFaqSeed {
  question: string;
  answer: string;
}

/** Pasos de uso de la plataforma para pacientes. */
export const PATIENT_HELP_STEPS: PatientHelpStepSeed[] = [
  {
    title: 'Seguimiento de tratamiento',
    description:
      'Consulta las tomas programadas del día, marca cada dosis como completada y recibe alertas cuando falte una toma o se acerque el fin de un medicamento.',
  },
  {
    title: 'Récipes médicos',
    description:
      'Revisa las prescripciones emitidas por tu médico, descarga o imprime el documento y verifica vigencia, medicamentos incluidos y estado clínico.',
  },
  {
    title: 'Confirmar pedido',
    description:
      'Cuando tu médico active una propuesta de compra, confirma los productos, elige la sucursal de retiro o delivery y avanza al pago dentro del tiempo límite indicado.',
  },
  {
    title: 'Pago y retiro',
    description:
      'Completa el pago de forma segura. Luego podrás consultar el comprobante, el voucher de retiro y el estado del despacho hasta la entrega.',
  },
  {
    title: 'Perfil y credencial',
    description:
      'Actualiza tu teléfono y dirección de entrega desde Perfil. Usa la credencial QR del menú lateral para identificarte en farmacia o consultorio.',
  },
];

/** Preguntas frecuentes del portal paciente. */
export const PATIENT_HELP_FAQS: PatientHelpFaqSeed[] = [
  {
    question: '¿Cómo veo mis medicamentos del día?',
    answer:
      'Entra a Seguimiento. Allí verás las tomas de hoy, la próxima dosis pendiente y podrás registrar cada toma con un solo clic.',
  },
  {
    question: '¿Qué hago si mi récipe aparece vencido?',
    answer:
      'Un récipe vencido ya no puede usarse para compra. Debes solicitar una nueva consulta a tu médico para que emita una prescripción actualizada.',
  },
  {
    question: '¿Cuánto tiempo tengo para pagar un pedido?',
    answer:
      'Al confirmar un pedido se activa una ventana de pago limitada. Si el tiempo expira, deberás volver a iniciar el proceso desde Confirmar pedido.',
  },
  {
    question: '¿Puedo cambiar mi dirección de entrega?',
    answer:
      'Sí. Ve a Perfil, pulsa Editar perfil, actualiza la dirección, estado y municipio, y guarda los cambios antes de confirmar un nuevo pedido.',
  },
  {
    question: '¿Para qué sirve la credencial QR?',
    answer:
      'La credencial QR te identifica como paciente registrado en +Salud. Preséntala en farmacia o consultorio para validar tu vínculo con el médico y agilizar la atención.',
  },
  {
    question: '¿Cómo sé si mi pedido fue despachado?',
    answer:
      'Después del pago puedes revisar el estado en las secciones de comprobante, voucher y seguimiento de entrega. Los cambios se sincronizan en tiempo real.',
  },
];

/** Pasos de uso de la plataforma para médicos. */
export const DOCTOR_HELP_STEPS: PatientHelpStepSeed[] = [
  {
    title: 'Panel de control',
    description:
      'Revisa tu agenda del día, métricas de actividad, pacientes vinculados recientes y el estado general de tus prescripciones emitidas.',
  },
  {
    title: 'Gestión de pacientes',
    description:
      'Consulta el directorio de pacientes vinculados, escanea el QR de credencial para registrar nuevos casos y accede al expediente clínico de cada persona.',
  },
  {
    title: 'Generar récipe',
    description:
      'Selecciona un paciente vinculado, busca medicamentos en el catálogo autorizado, arma la prescripción y emítela con validación digital.',
  },
  {
    title: 'Comisiones',
    description:
      'Consulta el resumen de comisiones generadas por consultas y tratamientos pagados, con detalle por periodo y estado de liquidación.',
  },
  {
    title: 'Perfil profesional',
    description:
      'Mantén actualizados tus datos de consultorio, registro MPPS, datos bancarios para comisiones y firma digital desde la sección Perfil.',
  },
];

/** Preguntas frecuentes del portal médico. */
export const DOCTOR_HELP_FAQS: PatientHelpFaqSeed[] = [
  {
    question: '¿Cómo vinculo un paciente nuevo?',
    answer:
      'Ve a Pacientes y usa el escáner QR para leer la credencial del paciente. Si ya está registrado en +Salud, quedará vinculado a tu consulta automáticamente.',
  },
  {
    question: '¿Puedo prescribir medicamentos que no están en el catálogo?',
    answer:
      'No. Solo puedes emitir récipes con productos del catálogo interno autorizado de farmacia. Esto garantiza trazabilidad y disponibilidad en despacho.',
  },
  {
    question: '¿Cómo edito los datos clínicos de un paciente?',
    answer:
      'En Pacientes, abre el expediente del paciente seleccionado, pulsa editar y guarda los cambios. Algunos campos institucionales permanecen en solo lectura.',
  },
  {
    question: '¿Cuándo se reflejan mis comisiones?',
    answer:
      'Las comisiones aparecen en la pestaña Comisiones cuando el paciente completa el pago del tratamiento. El estado de liquidación depende de la política financiera de la plataforma.',
  },
  {
    question: '¿Dónde actualizo mis datos bancarios?',
    answer:
      'Entra a Perfil, pulsa Editar perfil y completa titular, entidad, tipo de cuenta y número. Confirma los cambios para que queden listos en la sesión actual.',
  },
  {
    question: '¿Qué hago si falla el guardado de un récipe?',
    answer:
      'Verifica que el paciente esté vinculado, que todos los campos obligatorios estén completos y reintenta. Si el error persiste, revisa tu conexión o contacta al administrador.',
  },
];
