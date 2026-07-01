'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  PlusCircle, 
  LogOut, 
  ShieldAlert, 
  Clock,
  Check,
  ChevronRight,
  ArrowLeft,
  QrCode,
  Camera,
  CheckCircle2,
  UserPlus,
  AlertCircle,
  Activity,
  ShieldCheck,
  Search,
  Percent,
  Send,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  Award,
  BarChart3,
  BadgeCheck,
} from 'lucide-react';
import { AppShell, AppSidebar, AppHeader } from './layout';
// QR credential removed for doctor portal
import VenezuelanStateSelect from './VenezuelanStateSelect';
import { formatCurrency } from '../lib/currency';
import { Button, Modal, ModalBody, ListCard } from './ui';
import apiClient from '../lib/api';
import { socket } from '../lib/socket';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * Propiedades de la vista de portal del Médico.
 * @interface DoctorViewProps
 * @property {string} doctorName - Nombre del doctor autenticado.
 * @property {string} doctorEmail - Correo del doctor.
 * @property {() => void} onLogout - Acción para cerrar sesión.
 */
interface DoctorViewProps {
  doctorName: string;
  doctorEmail: string;
  onLogout: () => void;
}

/**
 * Interfaz para representar un paciente vinculado al médico en el panel.
 * @interface LinkedPatient
 */
interface LinkedPatient {
  cedula: string;
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
 * Interfaz para representar un producto médico del catálogo o inventario de farmacia.
 * @interface MedicalProduct
 */
interface MedicalProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  source: 'farmacia' | 'externo';
}

/**
 * Interfaz para representar un medicamento agregado al carrito de prescripción médica (Récipe).
 * @interface CartItem
 */
interface CartItem {
  product: MedicalProduct;
  posology: string;
  discount: number;
}

/**
 * Catálogo base simulado de productos médicos y medicinas.
 * @constant {MedicalProduct[]}
 */
const FARMA_HUMANA_CATALOG: MedicalProduct[] = [
  { id: 'med-1', name: 'Ramipril 5mg', sku: 'RX-RAM-001', category: 'Cardiovascular', price: 12.50, stock: 120, description: 'Indicado para el tratamiento de la hipertensión arterial y reducción de morbilidad cardiovascular.', source: 'farmacia' },
  { id: 'med-2', name: 'Aspirina 100mg', sku: 'RX-ASP-002', category: 'Analgesia / Antiagregante', price: 6.00, stock: 450, description: 'Antiagregante plaquetario para la prevención cardiovascular.', source: 'farmacia' },
  { id: 'med-3', name: 'Amoxicilina 875mg + Ácido Clavulánico 125mg', sku: 'RX-AMO-003', category: 'Antibiótico', price: 18.20, stock: 80, description: 'Tratamiento de infecciones bacterianas del tracto respiratorio u oído.', source: 'farmacia' },
  { id: 'med-4', name: 'Metformina 850mg', sku: 'RX-MET-004', category: 'Antidiabético', price: 9.80, stock: 310, description: 'Tratamiento de la diabetes mellitus tipo 2 en adultos.', source: 'farmacia' },
  { id: 'med-5', name: 'Atorvastatina 20mg', sku: 'RX-ATO-005', category: 'Hipolipemiante', price: 15.40, stock: 150, description: 'Tratamiento para la reducción del colesterol total y LDL elevado.', source: 'farmacia' },
  { id: 'med-6', name: 'Ibuprofeno 600mg', sku: 'RX-IBU-006', category: 'Antiinflamatorio', price: 4.50, stock: 500, description: 'Alivio del dolor moderado y reducción de procesos febriles o inflamatorios.', source: 'farmacia' }
];

/**
 * Productos filtrados que pertenecen exclusivamente al inventario de farmacia.
 * @constant {MedicalProduct[]}
 */
const PHARMACY_PRODUCTS = FARMA_HUMANA_CATALOG.filter((product) => product.source === 'farmacia');

const MOBILE_SCANNER_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const normalizeCedulaInput = (value: string) => value.toUpperCase().replace(/[^A-Z0-9-]/g, '').trim();
const containsSuspiciousPattern = (value: string) => /('|--|;|\/\*|\*\/|\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b|<script)/i.test(value);

/**
 * Interfaz para representar el registro de una comisión médica.
 * @interface CommissionEntry
 */
interface CommissionEntry {
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
 * Interfaz para representar un registro en la bitácora de récipes firmados.
 * @interface RecipeLogEntry
 */
interface RecipeLogEntry {
  id: string;
  date: string;
  patientName: string;
  patientCedula: string;
  medications: string[];
  branch: string;
  status: 'Enviado' | 'Confirmado' | 'Retirado';
}

/**
 * Datos simulados de comisiones generadas por el médico.
 * @constant {CommissionEntry[]}
 */
const MOCK_COMMISSIONS: CommissionEntry[] = [
  { id: 'COM-2026-041', date: '08 Jun, 2026', patientName: 'Sofía Peralta', medication: 'Ramipril 5mg + Aspirina 100mg', saleAmount: 18.50, commissionRate: 8, commissionAmount: 1.48, status: 'Acreditado' },
  { id: 'COM-2026-038', date: '05 Jun, 2026', patientName: 'Carlos Mendoza', medication: 'Metformina 850mg', saleAmount: 9.80, commissionRate: 8, commissionAmount: 0.78, status: 'Acreditado' },
  { id: 'COM-2026-031', date: '01 Jun, 2026', patientName: 'Ana Gómez Román', medication: 'Atorvastatina 20mg', saleAmount: 15.40, commissionRate: 8, commissionAmount: 1.23, status: 'Acreditado' },
  { id: 'COM-2026-029', date: '28 May, 2026', patientName: 'Luis Rodríguez Silva', medication: 'Ibuprofeno 600mg', saleAmount: 4.50, commissionRate: 8, commissionAmount: 0.36, status: 'Pendiente' },
  { id: 'COM-2026-022', date: '20 May, 2026', patientName: 'Sofía Peralta', medication: 'Aspirina 100mg', saleAmount: 6.00, commissionRate: 8, commissionAmount: 0.48, status: 'Acreditado' },
];

/**
 * Historial simulado de récipes médicos emitidos y firmados digitalmente.
 * @constant {RecipeLogEntry[]}
 */
const MOCK_RECIPE_LOG: RecipeLogEntry[] = [
  { id: 'REC-2026-904', date: '08 Jun, 2026', patientName: 'Sofía Peralta', patientCedula: 'V-28450123', medications: ['Ramipril 5mg', 'Aspirina 100mg'], branch: 'Farmahumana Caracas', status: 'Confirmado' },
  { id: 'REC-2026-901', date: '05 Jun, 2026', patientName: 'Carlos Mendoza', patientCedula: 'V-15234891', medications: ['Metformina 850mg'], branch: 'Clínica Humana Valencia', status: 'Retirado' },
  { id: 'REC-2026-887', date: '01 Jun, 2026', patientName: 'Ana Gómez Román', patientCedula: 'V-22341567', medications: ['Atorvastatina 20mg'], branch: 'Farmahumana Maracaibo', status: 'Retirado' },
  { id: 'REC-2026-881', date: '28 May, 2026', patientName: 'Luis Rodríguez Silva', patientCedula: 'V-18765432', medications: ['Ibuprofeno 600mg'], branch: 'Clínica Humana Caracas', status: 'Enviado' },
];

/**
 * Lista inicial simulada de pacientes vinculados al médico.
 * @constant {LinkedPatient[]}
 */
const INITIAL_PATIENTS: LinkedPatient[] = [
  {
    cedula: 'V-28450123',
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
    cedula: 'V-15234891',
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
    cedula: 'V-22341567',
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
    cedula: 'V-18765432',
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
 * Función auxiliar para generar la estructura de un paciente nuevo vacío.
 * @returns {LinkedPatient} Objeto de paciente por defecto.
 */
// createEmptyPatient removed — new patient creation disabled in doctor portal

/**
 * Vista principal y portal exclusivo para Médicos.
 * Integra múltiples submódulos usando pestañas (Panel, Pacientes, Prescripción, Comisiones, Perfil):
 * - Agenda clínica y gestión de expedientes (CRUD de pacientes).
 * - Generador de prescripciones médicas.
 * - Autenticación y vinculación por código QR dinámico.
 * - Rastreo y cálculo de comisiones generadas por afiliación y ventas indirectas.
 *
 * @param {DoctorViewProps} props - Propiedades de la vista.
 * @returns {JSX.Element}
 */
export default function DoctorView({ doctorName, doctorEmail, onLogout }: DoctorViewProps) {
  // Navigation active tab: 'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile'
  const [activeTab, setActiveTab] = useState<'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile'>('agenda');

  // Estados para manejar el Escáner y el Bloqueo MCA (Módulo 1 / Sprint #2)
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [waitingConsent, setWaitingConsent] = useState<boolean>(false);
  const [patientProfile, setPatientProfile] = useState<any>(null); // Aquí guardarás el JSON Sanitario

  // Simulamos el ID del médico (para el Handshake)
  const DOCTOR_ID = 'MD-99'; 
  const DOCTOR_NAME = 'Dr. Alejandro Ríos';

  // M.4 Profile & Banking state
  const [bankHolder, setBankHolder] = useState('Dr. Alejandro Ríos García');
  const [bankHolderId, setBankHolderId] = useState('V-14.890.344');
  const [bankEntity, setBankEntity] = useState('Banesco Banco Universal');
  const [bankAccountType, setBankAccountType] = useState<'Corriente' | 'Ahorro'>('Corriente');
  const [bankAccountNumber, setBankAccountNumber] = useState('0134-0100-01-0101234567');
  const [bankMobilePhone, setBankMobilePhone] = useState('0414-1234567');
  const [profilePhone, setProfilePhone] = useState('0212-9103348');
  const [profileDocumentId] = useState('V-14.890.344');
  const [consultorioAddress, setConsultorioAddress] = useState('Av. Las Delicias, Centro Médico Docente La Trinidad, Piso 3, Consultorio 12');
  const [consultorioState, setConsultorioState] = useState('Miranda');
  const [consultorioMunicipio, setConsultorioMunicipio] = useState('Baruta');
  const [profileSaveMsg, setProfileSaveMsg] = useState('');

  // QR credential removed for doctor portal per requested change

  // Dynamic commission rate state
  const [commissionRate, setCommissionRate] = useState<number>(8);
  
  useEffect(() => {
    const loadRate = () => {
      const savedRate = localStorage.getItem('zenith_commission_rate');
      if (savedRate) {
        setCommissionRate(parseFloat(savedRate));
      }
    };
    loadRate();
    window.addEventListener('zenith_commission_update', loadRate);
    return () => window.removeEventListener('zenith_commission_update', loadRate);
  }, []);

  const [patients, setPatients] = useState<LinkedPatient[]>(INITIAL_PATIENTS);
  const [patientViewMode, setPatientViewMode] = useState<'list' | 'detail'>('list');
  const [patientListSearch, setPatientListSearch] = useState('');
  const [patientForm, setPatientForm] = useState<LinkedPatient>({
    cedula: '',
    name: '',
    age: 0,
    gender: 'Masculino',
    bloodType: 'O+',
    phone: '',
    condition: '',
    allergies: 'Ninguna conocida',
    lastVisit: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
    medications: [],
  });
  const [medicationsInput, setMedicationsInput] = useState('');
  // New-patient flow removed; editing existing patients remains
  const [patientSaveMsg, setPatientSaveMsg] = useState('');
  const [isWaitingConsent, setIsWaitingConsent] = useState(false);
  const [pendingConsentPatient, setPendingConsentPatient] = useState<LinkedPatient | null>(null);

  // WebSockets: Escuchar respuesta del paciente
  useEffect(() => {
    const identify = () => {
      socket.emit('identifyUser', { userId: 'MD-992', role: 'doctor' });
    };

    if (socket.connected) identify();
    socket.on('connect', identify);

    const handleConsentResult = (data: any) => {
      setIsWaitingConsent(false);
      
      if (data.success) {
        // En el backend lo convertimos a entero para la BD, así que viene como número (ej: 28450123)
        const cedulaNum = data.result?.vinculacion?.id_paciente?.toString();
        
        // Buscamos el paciente ignorando el prefijo "V-"
        let targetPatient = patients.find(p => p.cedula.replace(/\D/g, '') === cedulaNum);
        
        if (!targetPatient) {
          // Crear un paciente temporal basado en los datos devueltos por el paciente
          targetPatient = {
            cedula: `V-${cedulaNum}`,
            name: data.patientName || 'Paciente Nuevo',
            age: 0,
            gender: 'No especificado',
            bloodType: 'N/A',
            phone: 'N/A',
            condition: 'N/A',
            allergies: 'Ninguna',
            lastVisit: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
            medications: [],
          } as LinkedPatient;
          
          setPatients(prev => [...prev, targetPatient as LinkedPatient]);
        }
        
        setIsScannerModalOpen(false);
        openPatientForm(targetPatient as LinkedPatient);
      } else {
        alert(data.message || 'El paciente denegó la solicitud de vinculación.');
      }
      setPendingConsentPatient(null);
    };

    const handleConsentRequestSent = ({ patientName }: { patientName: string }) => {
      setPendingConsentPatient(prev => prev ? { ...prev, name: patientName } : null);
    };

    socket.on('consentResult', handleConsentResult);
    socket.on('consentRequestSent', handleConsentRequestSent);

    return () => {
      socket.off('connect', identify);
      socket.off('consentResult', handleConsentResult);
      socket.off('consentRequestSent', handleConsentRequestSent);
    };
  }, [patients]);

  // =========================================================
  // LOGICA 1: WEBSOCKETS (Módulos 4 y 5)
  // =========================================================
  useEffect(() => {
    // 1. Handshake inicial del Médico
    socket.connect();
    socket.emit('identifyUser', { userId: DOCTOR_ID, role: 'doctor', name: DOCTOR_NAME });

    // 2. Escuchar la respuesta del paciente (Aceptó o Rechazó)
    const handleConsentResponse = (data: { accepted: boolean; patientName: string; profileData?: any }) => {
      setWaitingConsent(false); // Desbloqueamos la pantalla del médico

      if (data.accepted) {
        // Vinculación Exitosa (Módulo 2: Perfil filtrado)
        alert(`¡Paciente ${data.patientName} vinculado exitosamente!`);
        setPatientProfile(data.profileData); // Cargamos el expediente para la consulta
      } else {
        // Excepción MCA_LOCK: El paciente denegó el acceso
        alert("Vinculación denegada: El paciente no aceptó los términos de privacidad.");
      }
    };

    socket.on('consentResponse', handleConsentResponse);

    return () => {
      socket.off('consentResponse', handleConsentResponse);
      socket.disconnect();
    };
  }, []);

  // Reception / QR scan states (M.1)
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [manualCedulaInput, setManualCedulaInput] = useState('');
  const [linkedPatient, setLinkedPatient] = useState<LinkedPatient | null>(null);
  const [isMobileScannerCapable, setIsMobileScannerCapable] = useState(false);
  const [scannerErrorMsg, setScannerErrorMsg] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasCameraApi = Boolean(navigator.mediaDevices?.getUserMedia);
    const isMobileDevice = MOBILE_SCANNER_REGEX.test(window.navigator.userAgent || '');

    setIsMobileScannerCapable(hasCameraApi && isMobileDevice);
  }, []);

  // =========================================================
  // LOGICA 2: ESCÁNER Y VALIDACIÓN PERIMETRAL (Módulo 1)
  // =========================================================
  useEffect(() => {
    if (isScanning && isMobileScannerCapable) {
      // Configuramos la cámara (Librería html5-qrcode)
      const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      
      scanner.render(async (decodedToken) => {
        // ¡QR Detectado! Apagamos la cámara de inmediato
        scanner.clear();
        setIsScanning(false);

        try {
          // 1. Validamos la encriptación AES y la regla de 5 min en el backend
          const response = await apiClient.post('/qr/validate', { token: decodedToken });
          
          if (response.data && response.data.patientId) {
            // 2. Si el backend aprueba, bloqueamos la pantalla del médico (Esperando...)
            setScanProgress(100);
            setWaitingConsent(true);

            // 3. Emitimos la alerta de WebSocket a la pantalla del paciente
            socket.emit('requestConsent', {
              doctorId: DOCTOR_ID,
              doctorName: DOCTOR_NAME,
              patientCedula: response.data.patientId // El backend desencriptó esto del QR
            });
          }
        } catch (error: any) {
          // Fallo por QR Caducado o Nonce duplicado
          setScannerErrorMsg(error.response?.data?.error || 'Error de seguridad: QR caducado o invalido.');
        }
      }, (err) => {
        // Errores silenciosos mientras busca el QR frame por frame (se ignoran)
      });

      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }
  }, [isScanning, isMobileScannerCapable]);

  const filteredPatients = useMemo(() => {
    const query = patientListSearch.toLowerCase().trim();
    if (!query) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.cedula.toLowerCase().includes(query)
    );
  }, [patients, patientListSearch]);



  // Prescription states (M.2)
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * Abre el formulario de detalle de un paciente existente.
   * @param {LinkedPatient} patient - El paciente a mostrar.
   */
  const openPatientForm = (patient: LinkedPatient) => {
    setPatientForm({ ...patient, medications: [...patient.medications] });
    setMedicationsInput(patient.medications.join(', '));
    setLinkedPatient(patient);
    setPatientViewMode('detail');
    setActiveTab('reception');
  };

  // New-patient creation removed from doctor portal

  /**
   * Regresa a la vista de lista de pacientes.
   */
  const handleBackToPatientList = () => {
    setPatientViewMode('list');
    setPatientSaveMsg('');
  };

  /**
   * Elimina el paciente actualmente seleccionado del estado local.
   */
  const handleDeletePatient = () => {
    if (!patientForm.cedula) return;
    if (!confirm(`¿Eliminar el expediente de ${patientForm.name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setPatients((prev) => prev.filter((p) => p.cedula !== patientForm.cedula));
    if (linkedPatient?.cedula === patientForm.cedula) {
      setLinkedPatient(null);
    }
    handleBackToPatientList();
  };

  /**
   * Maneja el guardado o actualización de un paciente en el formulario.
   * @param {React.FormEvent} e - Evento del formulario.
   */
  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.name.trim() || !patientForm.phone.trim() || !patientForm.cedula.trim()) {
      alert('El nombre, la cédula y el teléfono del paciente son obligatorios.');
      return;
    }

    const medications = medicationsInput
      .split(',')
      .map((med) => med.trim())
      .filter(Boolean);

    // Only support updating existing patients from the doctor portal
    const updatedPatient: LinkedPatient = { ...patientForm, medications };
    const exists = patients.some((p) => p.cedula === updatedPatient.cedula);
    if (!exists) {
      alert('No está permitido crear pacientes desde el portal del médico. Busque o vincule un paciente existente.');
      return;
    }
    setPatients((prev) => prev.map((p) => (p.cedula === updatedPatient.cedula ? updatedPatient : p)));
    setLinkedPatient(updatedPatient);
    setPatientForm(updatedPatient);

    setPatientSaveMsg('Datos del paciente guardados correctamente.');
    setTimeout(() => setPatientSaveMsg(''), 3000);
  };

  /**
   * Inicia el flujo de vinculación de un paciente buscando por su cédula e informando al backend.
   * @param {string} cedulaQuery - La cédula a buscar o vincular.
   */
  const linkPatientMock = (cedulaQuery: string) => {
    const normalized = cedulaQuery.toLowerCase().replace(/[\s\.-]/g, '');
    const found = patients.find((p) =>
      p.cedula.toLowerCase().replace(/[\s\.-]/g, '').includes(normalized)
    );

    const targetPatient = found || {
      cedula: cedulaQuery.trim().toUpperCase(),
      name: 'Paciente (Pendiente BD)',
      age: 0,
      gender: 'No especificado',
      bloodType: 'N/A',
      phone: 'N/A',
      condition: 'N/A',
      allergies: 'Ninguna',
      lastVisit: 'N/A',
      medications: [],
    };
    
    setIsWaitingConsent(true);
    setPendingConsentPatient(targetPatient);
    
    // Emitir solicitud de vinculación al servidor WebSocket
    socket.emit('requestConsent', {
      doctorId: 'MD-992',
      doctorName,
      patientCedula: targetPatient.cedula
    });
  };

  /**
   * Cancela la solicitud de vinculación de un paciente en curso.
   */
  const cancelConsentRequest = () => {
    if (pendingConsentPatient) {
      socket.emit('cancelConsentRequest', { 
        doctorId: 'MD-992', 
        patientCedula: pendingConsentPatient.cedula 
      });
    }
    setIsWaitingConsent(false);
    setPendingConsentPatient(null);
  };

  /**
   * Simula el inicio del escaneo mediante cámara.
   */
  const triggerCameraScan = () => {
    if (!isMobileScannerCapable) {
      setScannerErrorMsg('El escaner en tiempo real solo esta habilitado en dispositivos moviles con camara.');
      setIsScanning(false);
      return;
    }

    setScannerErrorMsg('');
    setIsScanning(true);
    setScanProgress(15);
    setLinkedPatient(null);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (isScanning) {
      timer = setInterval(() => {
        setScanProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 400);
    } else {
      setScanProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isScanning]);

  /**
   * Maneja el envío manual del formulario de vinculación de paciente.
   * @param {React.FormEvent} e - Evento de formulario.
   */
  const handleManualLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedCedula = normalizeCedulaInput(manualCedulaInput);

    if (!sanitizedCedula) {
      alert('Por favor ingrese la cedula del paciente.');
      return;
    }

    if (containsSuspiciousPattern(sanitizedCedula)) {
      alert('La cedula contiene un patron invalido.');
      return;
    }

    setScannerErrorMsg('');
    linkPatientMock(sanitizedCedula);
    setManualCedulaInput('');
  };

  /**
   * Añade un medicamento al carrito de prescripción médica.
   * @param {MedicalProduct} product - El medicamento a añadir.
   */
  const addToCart = (product: MedicalProduct) => {
    // Check if already in cart
    if (cart.some(item => item.product.id === product.id)) {
      return;
    }
    setCart([...cart, { product, posology: '', discount: 10 }]);
  };

  /**
   * Remueve un medicamento del carrito de prescripción médica.
   * @param {string} productId - Identificador del producto a remover.
   */
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  /**
   * Actualiza la posología de un medicamento específico en el carrito.
   * @param {string} productId - Identificador del producto.
   * @param {string} val - Nueva posología.
   */
  const updateCartPosology = (productId: string, val: string) => {
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, posology: val } : item
    ));
  };

  /**
   * Actualiza el descuento asociado a un medicamento en el carrito.
   * @param {string} productId - Identificador del producto.
   * @param {number} val - Nuevo porcentaje de descuento.
   */
  const updateCartDiscount = (productId: string, val: number) => {
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, discount: val } : item
    ));
  };


  /**
   * Maneja el registro y envío de la prescripción médica.
   * @param {React.FormEvent} e - Evento de formulario.
   */
  const handleRegisterPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Debe agregar al menos un medicamento a la prescripción.');
      return;
    }
    
    const missingPosology = cart.some(item => !item.posology);
    if (missingPosology) {
      alert('Por favor configure las instrucciones de posología para todos los medicamentos.');
      return;
    }

    setSuccessMsg(`¡El récipe clínico con ${cart.length} medicamentos y propuestas comerciales se ha registrado y enviado correctamente al portal de ${linkedPatient?.name}!`);
    setCart([]);
    setLinkedPatient(null);
    setActiveTab('agenda');

    setTimeout(() => {
      setSuccessMsg('');
    }, 2000);
  };

  // Filter pharmaceutical products from pharmacy inventory only
  const filteredCatalog = PHARMACY_PRODUCTS.filter(prod => 
    prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style jsx global>{`
        @keyframes scan-laser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .laser-line {
          animation: scan-laser 2s infinite ease-in-out;
        }
      `}</style>

      <AppShell
        portal="doctor"
        contentClassName="max-w-7xl"
        sidebar={
          <AppSidebar
            accent="primary"
            brand={{ icon: Activity, title: 'Médico' }}
            items={[
              { id: 'agenda', name: 'Panel', icon: Calendar },
              { id: 'reception', name: 'Pacientes', icon: Users },
              { id: 'prescription', name: 'Generar récipe', icon: FileText },
              { id: 'commissions', name: 'Comisiones', icon: TrendingUp },
              { id: 'profile', name: 'Perfil', icon: Users },
            ]}
            activeId={activeTab}
            onNavigate={(id) => {
              if (id === 'reception') {
                setPatientViewMode('list');
              }
              setActiveTab(id as 'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile');
            }}
            profile={{
              initials: doctorName
                .replace(/^Dr\.\s*/i, '')
                .split(' ')
                .filter(Boolean)
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase(),
              name: doctorName,
              avatarClassName: 'portal-profile-avatar',
            }}
            preProfile={null}
            onLogout={onLogout}
            logoutVariant="icon"
          />
        }
        header={({ onMenuClick }) => (
          <AppHeader
            onMenuClick={onMenuClick}
            statusLabel=""
            showNotifications={false}
            profileInitials={doctorName
              .replace(/^Dr\.\s*/i, '')
              .split(' ')
              .filter(Boolean)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
            profileName={doctorName.replace(/^Dr\.\s*/i, '').split(' ')[0] ?? doctorName}
          />
        )}
      >
            {/* VIEW TAB 1: DAILY AGENDA & METRICS */}
            {activeTab === 'agenda' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  {/* Nuevo paciente eliminado */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="zenith-section-title">Pacientes Registrados</h3>
                      <p className="text-xs text-surface-400">Consulte y modifique los datos clínicos de cada paciente.</p>
                    </div>

                    <div className="divide-y divide-surface-850">
                      {patients.map((patient) => (
                        <div key={patient.cedula} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 first:pt-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{patient.name}</p>
                              <span className="text-[9px] font-mono text-surface-500 bg-surface-950 px-1.5 py-0.5 rounded border border-surface-850">
                                {patient.cedula}
                              </span>
                            </div>
                            <p className="text-xs text-surface-400 mt-1">
                              {patient.age} años • {patient.condition || 'Sin condición registrada'}
                            </p>
                          </div>

                          <button
                            onClick={() => openPatientForm(patient)}
                            className="px-3 py-1.5 text-xs font-semibold bg-[var(--portal-doctor-btn-bg)] hover:bg-[var(--portal-doctor-btn-hover)] text-[var(--portal-doctor-btn-fg)] rounded-lg transition-colors cursor-pointer"
                          >
                            Editar datos
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="zenith-section-title">Alertas Clínicas</h3>
                      <p className="text-xs text-surface-400">Condiciones y alergias registradas en expedientes.</p>
                    </div>

                    <div className="space-y-3 flex-1 pt-2">
                      {patients.map((patient) => (
                        <div key={patient.cedula} className="p-3 bg-surface-950/40 border border-surface-850 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">{patient.name}</span>
                            <span className="text-surface-555 text-[10px] font-medium">Edad: {patient.age} años</span>
                          </div>
                          <p className="text-[10px] text-secondary-455 flex items-center gap-1 font-semibold">
                            <ShieldAlert className="h-3 w-3 text-secondary-400" />
                            <span>{patient.allergies}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => { setScannerErrorMsg(''); setIsScannerModalOpen(true); }}
                      className="w-full text-center text-xs text-secondary-400 font-semibold hover:text-secondary-300 transition-colors pt-2 border-t border-surface-850 mt-4 flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <span>Escanear código qr</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="zenith-section-title">Productos de Farmacia</h3>
                    <p className="text-xs text-surface-400">Listado de productos internos de farmacia disponibles para la agenda clínica del día.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PHARMACY_PRODUCTS.slice(0, 4).map((prod) => (
                      <div key={prod.id} className="overflow-hidden bg-surface-950/50 border border-surface-850 rounded-2xl p-4 space-y-3">
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white leading-snug break-words line-clamp-2">
                              {prod.name}
                            </p>
                            <p className="mt-1 text-[10px] text-surface-500 break-words">
                              {prod.category}
                            </p>
                          </div>
                          <span className="w-fit max-w-full shrink-0 truncate whitespace-nowrap text-[9px] text-surface-400 bg-surface-800 px-2 py-0.5 rounded-full uppercase tracking-[0.16em]">
                            Farmacia
                          </span>
                        </div>
                        <div className="text-[10px] text-surface-400 break-words line-clamp-3">{prod.description}</div>
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-surface-300">
                          <span className="whitespace-nowrap">Stock: {prod.stock} u.</span>
                          <span className="font-semibold text-secondary-400 whitespace-nowrap">{formatCurrency(prod.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW TAB 2: PATIENT MANAGEMENT (CRUD) */}
            {activeTab === 'reception' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {patientViewMode === 'list' ? (
                  <>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="doctor" onClick={() => { setScannerErrorMsg(''); setIsScannerModalOpen(true); }}>
                        <QrCode className="h-4 w-4" />
                          Escanear código qr
                      </Button>
                    </div>

                    {patientSaveMsg && (
                      <div className="p-4 bg-secondary-500/15 border border-secondary-500/30 rounded-2xl flex items-center gap-3 text-secondary-400 text-xs">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>{patientSaveMsg}</span>
                      </div>
                    )}


                    {/* MODAL DE BLOQUEO MCA (Esperando al paciente) */}
                    {waitingConsent && (
                      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <div className="bg-surface-900 p-8 rounded-2xl text-center border border-surface-700 max-w-sm animate-in zoom-in-95 duration-200">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
                          <h3 className="text-white font-bold text-lg">Validando Privacidad</h3>
                          <p className="text-surface-400 mt-2 text-sm">
                            Esperando autorización del paciente en su dispositivo móvil...
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-secondary-500/10 text-secondary-400 flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="zenith-field-label">Pacientes registrados</span>
                          <p className="text-lg font-semibold text-white mt-0.5">{patients.length}</p>
                        </div>
                      </div>
                      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="zenith-field-label">Con alergias registradas</span>
                          <p className="text-lg font-semibold text-white mt-0.5">
                            {patients.filter((p) => p.allergies && p.allergies !== 'Ninguna conocida').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o cédula"
                          value={patientListSearch}
                          onChange={(e) => setPatientListSearch(e.target.value)}
                          className="zenith-input pl-10 pr-4 py-2.5"
                        />
                      </div>

                      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl overflow-hidden backdrop-blur-md">
                      {filteredPatients.length > 0 ? (
                        <>
                          <div className="zenith-table-wrap hidden lg:block">
                            <table className="zenith-table zenith-table--divided text-sm">
                              <thead>
                                <tr className="border-b border-surface-850 bg-surface-950/20 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                                  <th className="px-6 py-4 zenith-table__stack">Paciente</th>
                                  <th className="px-6 py-4 zenith-table__stack">Contacto</th>
                                  <th className="px-6 py-4 zenith-table__wrap">Condición</th>
                                  <th className="px-6 py-4">Última visita</th>
                                  <th className="px-6 py-4 text-right">Acción</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-surface-850">
                                {filteredPatients.map((patient) => (
                                  <tr
                                    key={patient.cedula}
                                    onClick={() => openPatientForm(patient)}
                                    className="hover:bg-surface-850/20 transition-colors cursor-pointer"
                                  >
                                    <td className="px-6 py-4.5 zenith-table__stack">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-secondary-650 flex items-center justify-center font-bold text-white text-xs shrink-0">
                                          {patient.name.charAt(0)}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-surface-200 leading-none">{patient.name}</p>
                                          <span className="text-[10px] text-surface-500 font-mono mt-1 block">{patient.cedula}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4.5 zenith-table__stack">
                                      <p className="text-xs text-surface-350">{patient.phone}</p>
                                      <p className="text-[10px] text-surface-500 mt-0.5">
                                        {patient.age} años • {patient.gender}
                                      </p>
                                    </td>
                                    <td className="px-6 py-4.5 zenith-table__wrap">
                                      <p className="text-xs text-surface-300">{patient.condition || 'Sin condición registrada'}</p>
                                      {patient.allergies && patient.allergies !== 'Ninguna conocida' && (
                                        <p className="text-[10px] text-secondary-455 mt-1 flex items-center gap-1">
                                          <ShieldAlert className="h-3 w-3 shrink-0" />
                                          {patient.allergies}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-6 py-4.5 text-xs text-surface-400 whitespace-nowrap">
                                      {patient.lastVisit}
                                    </td>
                                    <td className="px-6 py-4.5 text-right">
                                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-400">
                                        Ver expediente
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="lg:hidden space-y-3 p-4">
                            {filteredPatients.map((patient) => (
                              <ListCard
                                key={patient.cedula}
                                title={patient.name}
                                subtitle={patient.cedula}
                                onClick={() => openPatientForm(patient)}
                                badge={
                                  patient.allergies && patient.allergies !== 'Ninguna conocida' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary-500/10 text-secondary-400 border border-secondary-500/25">
                                      <ShieldAlert className="h-3 w-3" />
                                      Alergia
                                    </span>
                                  ) : undefined
                                }
                                fields={[
                                  { label: 'Teléfono', value: patient.phone },
                                  { label: 'Edad', value: `${patient.age} años` },
                                  { label: 'Condición', value: patient.condition || '—' },
                                  { label: 'Última visita', value: patient.lastVisit },
                                ]}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-24 text-surface-500 flex flex-col items-center justify-center p-6">
                          <div className="h-12 w-12 rounded-full bg-surface-950 border border-surface-800 flex items-center justify-center mb-3">
                            <Users className="h-5 w-5 text-surface-600" />
                          </div>
                          <p className="font-semibold text-surface-400">
                            {patients.length === 0 ? 'No hay pacientes registrados' : 'No se encontraron pacientes'}
                          </p>
                          <p className="text-xs text-surface-500 mt-1">
                            {patients.length === 0
                              ? 'Registre el primer paciente o búsquelo por credencial.'
                              : 'Modifique los términos de búsqueda.'}
                          </p>
                          {patients.length === 0 && (
                            <></>
                          )}
                        </div>
                      )}
                    </div>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleBackToPatientList}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Volver al listado
                    </button>

                    {patientForm.cedula ? (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          onClick={handleDeletePatient}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    ) : null}

                    {patientSaveMsg && (
                      <div className="p-4 bg-secondary-500/15 border border-secondary-500/30 rounded-2xl flex items-center gap-3 text-secondary-400 text-xs">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>{patientSaveMsg}</span>
                      </div>
                    )}

                    <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md">
                      <form onSubmit={handleSavePatient} className="space-y-6">
                        <div>
                          <h3 className="zenith-section-title">
                            {'Datos clínicos'}
                          </h3>
                          <p className="text-xs text-surface-400">
                            Complete o actualice la información del expediente clínico.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Nombre completo</label>
                            <input
                              type="text"
                              value={patientForm.name}
                              onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Cédula</label>
                            <input
                              type="text"
                              value={patientForm.cedula}
                              onChange={(e) => setPatientForm({ ...patientForm, cedula: e.target.value })}
                              disabled={true}
                                placeholder="Ej: V-28450123"
                                className={`w-full border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-secondary-500 uppercase bg-surface-950/40 text-surface-550 disabled:cursor-not-allowed`}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Edad</label>
                            <input
                              type="number"
                              min={0}
                              value={patientForm.age || ''}
                              onChange={(e) => setPatientForm({ ...patientForm, age: Number(e.target.value) })}
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Género</label>
                            <select
                              value={patientForm.gender}
                              onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500 cursor-pointer"
                            >
                              <option value="Masculino">Masculino</option>
                              <option value="Femenino">Femenino</option>
                              <option value="Otro">Otro</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Grupo sanguíneo</label>
                            <input
                              type="text"
                              value={patientForm.bloodType}
                              onChange={(e) => setPatientForm({ ...patientForm, bloodType: e.target.value })}
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Teléfono móvil</label>
                            <input
                              type="tel"
                              value={patientForm.phone}
                              onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="zenith-field-label">Condición / diagnóstico de control</label>
                            <input
                              type="text"
                              value={patientForm.condition}
                              onChange={(e) => setPatientForm({ ...patientForm, condition: e.target.value })}
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="zenith-field-label">Alergias</label>
                            <input
                              type="text"
                              value={patientForm.allergies}
                              onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="zenith-field-label">Tratamientos activos (separados por coma)</label>
                            <input
                              type="text"
                              value={medicationsInput}
                              onChange={(e) => setMedicationsInput(e.target.value)}
                              placeholder="Ej: Ramipril 5mg, Aspirina 100mg"
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4 border-t border-surface-850">
                          <button
                            type="button"
                            onClick={handleBackToPatientList}
                            className="px-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-surface-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <div className="flex flex-col sm:flex-row gap-3">
                            {linkedPatient && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('prescription')}
                                className="px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-surface-700"
                              >
                                Generar Récipe
                              </button>
                            )}
                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-[var(--portal-doctor-btn-bg)] hover:bg-[var(--portal-doctor-btn-hover)] text-[var(--portal-doctor-btn-fg)] rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              {'Guardar cambios'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* VIEW TAB 3: CLINICAL PRESCRIPTION (Pantalla M.2) */}
            {activeTab === 'prescription' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                <button
                  type="button"
                  onClick={() => setActiveTab('agenda')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver al panel
                </button>

                {/* Linked Patient Header Bar */}
                <div className="bg-surface-900/65 border border-surface-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary-650 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                      {linkedPatient ? linkedPatient.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-450 uppercase font-bold tracking-wider">Paciente seleccionado</span>
                        {linkedPatient && (
                          <span className="text-[9px] bg-secondary-500/10 text-secondary-400 border border-secondary-500/25 px-1.5 py-0.2 rounded font-mono font-bold">
                            VINCULADO
                          </span>
                        )}
                      </div>
                      <h3 className="zenith-section-title mt-0.5">
                        {linkedPatient ? `${linkedPatient.name} (${linkedPatient.age} años)` : 'Ninguno seleccionado'}
                      </h3>
                    </div>
                  </div>

                  {!linkedPatient && (
                    <button
                      onClick={() => {
                        setPatientViewMode('list');
                        setActiveTab('reception');
                      }}
                      className="px-4 py-2 bg-[var(--portal-doctor-btn-bg)] hover:bg-[var(--portal-doctor-btn-hover)] text-[var(--portal-doctor-btn-fg)] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Seleccionar paciente
                    </button>
                  )}
                </div>

                {successMsg && (
                  <div className="p-4 bg-secondary-500/15 border border-secondary-500/30 rounded-2xl flex items-center gap-3 text-secondary-400 text-xs animate-in fade-in slide-in-from-top-2 duration-300 leading-relaxed">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {linkedPatient ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Grid: Catalog & Search (5 cols) */}
                    <div className="lg:col-span-5 bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-4 flex flex-col max-h-none lg:max-h-[600px]">
                      <div>
                        <h3 className="zenith-section-title">Buscador de Medicamentos</h3>
                        <p className="text-xs text-surface-400">Catálogo interno de farmacia — solo productos de farmacia autorizados, no externos.</p>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o categoría..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white placeholder-surface-750 focus:outline-none focus:border-secondary-500"
                        />
                      </div>

                      {/* Catalog Items list */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {filteredCatalog.map((prod) => {
                          const isAlreadySelected = cart.some(item => item.product.id === prod.id);
                          return (
                            <div 
                              key={prod.id} 
                              className={`overflow-hidden p-3 border rounded-xl flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2.5 transition-all ${
                                isAlreadySelected
                                  ? 'bg-surface-950/60 border-surface-800 opacity-60'
                                  : 'bg-surface-950/40 border-surface-850 hover:border-surface-800'
                              }`}
                            >
                              <div className="space-y-1 text-left min-w-0 flex-1">
                                <div className="flex w-full min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
                                  <span className="block min-w-0 flex-1 max-w-full font-bold text-xs text-white leading-snug break-words line-clamp-2">
                                    {prod.name}
                                  </span>
                                  <span className="max-w-full shrink-0 truncate overflow-hidden whitespace-nowrap text-[8px] bg-surface-850 text-surface-400 px-1.5 py-0.2 rounded font-medium">
                                    {prod.category}
                                  </span>
                                </div>
                                <p className="text-[10px] text-surface-500 break-words line-clamp-2">{prod.description}</p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-surface-400 pt-0.5">
                                  <span>Precio: {formatCurrency(prod.price)}</span>
                                  <span>•</span>
                                  <span className={prod.stock < 20 ? 'text-primary-500 font-medium' : ''}>
                                    Stock: {prod.stock} u.
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isAlreadySelected}
                                onClick={() => addToCart(prod)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                                  isAlreadySelected
                                    ? 'bg-surface-900 border-surface-850 text-surface-600'
                                    : 'bg-secondary-500/10 hover:bg-secondary-500 border-secondary-500/20 hover:border-secondary-550 text-secondary-450 hover:text-white'
                                }`}
                              >
                                <Plus className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          );
                        })}

                        {filteredCatalog.length === 0 && (
                          <div className="py-8 text-center text-xs text-surface-500">
                            Ningún medicamento coincide con su búsqueda.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Grid: Active Prescription Cart & IA Assistant (7 cols) */}
                    <div className="lg:col-span-7 bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between max-h-none overflow-y-auto lg:max-h-[600px]">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-surface-850 pb-3">
                          <div>
                            <h3 className="zenith-section-title">Prescripción en Preparación</h3>
                            <p className="text-xs text-surface-400">Configure la posología de cada medicamento.</p>
                          </div>
                          <span className="text-xs bg-secondary-500/10 text-secondary-455 px-2 py-0.5 rounded font-bold">
                            {cart.length} medicamentos
                          </span>
                        </div>

                        {cart.length > 0 ? (
                          <form onSubmit={handleRegisterPrescription} className="space-y-5">
                            <div className="space-y-4 divide-y divide-surface-850">
                              {cart.map((item, index) => (
                                <div key={item.product.id} className={`pt-4 first:pt-0 space-y-3`}>
                                  
                                  {/* Item Header */}
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <h4 className="font-bold text-sm text-white">{item.product.name}</h4>
                                      <span className="text-[9px] text-surface-500 font-mono block">SKU: {item.product.sku}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(item.product.id)}
                                      className="p-1 text-surface-500 hover:text-secondary-400 hover:bg-secondary-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="Quitar de la prescripción"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>

                                  {/* Posology input */}
                                  <div className="space-y-1.5">
                                    <span className="zenith-field-label">Instrucciones de Posología</span>

                                    <textarea
                                      rows={2}
                                      value={item.posology}
                                      onChange={(e) => updateCartPosology(item.product.id, e.target.value)}
                                      placeholder="Ej: Tomar 1 comprimido al día por la mañana en ayunas..."
                                      className="w-full bg-surface-950 border border-surface-800 rounded-xl p-2.5 text-xs text-white placeholder-surface-750 focus:outline-none focus:border-secondary-500 transition-all"
                                    />
                                  </div>

                                  {/* Incentives / Discounts Selector */}
                                  <div className="space-y-1.5">
                                    <span className="zenith-field-label flex items-center gap-1">
                                      <Percent className="h-3 w-3 text-secondary-455" />
                                      <span>Asignación de Incentivo / Descuento Exclusivo</span>
                                    </span>
                                    
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                                      {[0, 10, 15, 20, 30].map((disc) => (
                                        <button
                                          key={disc}
                                          type="button"
                                          onClick={() => updateCartDiscount(item.product.id, disc)}
                                          className={`py-1 rounded-lg text-2xs font-bold border transition-colors cursor-pointer ${
                                            item.discount === disc
                                              ? 'bg-secondary-500 border-secondary-550 text-white'
                                              : 'bg-surface-950/60 border-surface-800 text-surface-400 hover:text-white'
                                          }`}
                                        >
                                          {disc}%
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                </div>
                              ))}
                            </div>

                            {/* Cart totals preview */}
                            <div className="border-t border-surface-850 pt-4 space-y-2">
                              <div className="flex justify-between text-2xs text-surface-400">
                                <span>Estimación Subtotal Farmacia</span>
                                <span className="font-mono text-surface-200">
                                  {formatCurrency(cart.reduce((sum, item) => sum + item.product.price, 0))}
                                </span>
                              </div>
                              <div className="flex justify-between text-2xs text-secondary-400 font-semibold">
                                <span>Descuentos Médicos Promedio</span>
                                <span>Ahorro para el Paciente</span>
                              </div>
                            </div>

                            {/* Main action submit */}
                            <button
                              type="submit"
                              className="w-full mt-2 py-3 bg-gradient-to-r from-secondary to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white rounded-xl text-xs font-black shadow-lg shadow-secondary-550/10 hover:shadow-secondary-550/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Send className="h-4 w-4" />
                              <span>Registrar e Iniciar Envío de Récipe</span>
                            </button>

                          </form>
                        ) : (
                          <div className="py-16 text-center space-y-2">
                            <PlusCircle className="h-10 w-10 text-surface-750 mx-auto" />
                            <h4 className="font-bold text-white text-xs">Prescripción Vacía</h4>
                            <p className="text-[10px] text-surface-450 max-w-xs mx-auto">
                              Seleccione medicamentos en el catálogo de la izquierda para agregarlos a la prescripción del paciente.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="h-64 bg-surface-900/60 border border-surface-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                    <AlertCircle className="h-10 w-10 text-surface-650" />
                    <h4 className="zenith-section-title">Sin Paciente Seleccionado</h4>
                    <p className="text-xs text-surface-450 max-w-sm leading-relaxed">
                      Registre o seleccione un paciente en Gestión de Pacientes para generar un récipe clínico.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* VIEW TAB 4: COMMISSIONS & CLINICAL HISTORY (Pantalla M.3) */}
            {activeTab === 'commissions' && (() => {
              const dynamicCommissions = MOCK_COMMISSIONS.map(c => {
                const computedAmt = c.saleAmount * (commissionRate / 100);
                return {
                  ...c,
                  commissionRate,
                  commissionAmount: computedAmt
                };
              });

              const totalAccredited = dynamicCommissions
                .filter((c) => c.status === 'Acreditado')
                .reduce((sum, c) => sum + c.commissionAmount, 0);
              const totalPending = dynamicCommissions
                .filter((c) => c.status === 'Pendiente')
                .reduce((sum, c) => sum + c.commissionAmount, 0);

              return (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Commission Ledger */}
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="zenith-section-title">Libro de Comisiones</h3>
                          <p className="text-xs text-surface-400">Incentivos asignados por venta efectiva en la red de farmacias.</p>
                        </div>
                        <span className="text-[10px] bg-secondary-500/20 text-white border border-secondary-400/40 px-2 py-0.5 rounded font-bold shadow-sm">Tasa: {commissionRate}%</span>
                      </div>

                      {/* Bar-chart style visualisation per entry */}
                      <div className="space-y-3">
                        {dynamicCommissions.map((entry) => (
                          <div key={entry.id} className="space-y-1.5">
                            <div className="flex justify-between items-start text-xs">
                              <div className="min-w-0">
                                <span className="font-semibold text-surface-200 block truncate">{entry.patientName}</span>
                                <span className="text-[10px] text-surface-500 truncate block">{entry.medication} • {entry.date}</span>
                              </div>
                              <div className="text-right shrink-0 pl-3">
                                <span className="font-bold text-sm text-black">
                                  +{formatCurrency(entry.commissionAmount)}
                                </span>
                                <span className={`text-[9px] font-bold block ${ entry.status === 'Acreditado' ? 'text-secondary-500/70' : 'text-primary-500/70' }`}>
                                  {entry.status}
                                </span>
                              </div>
                            </div>
                            {/* Sale proportion bar */}
                            <div className="h-1 w-full bg-surface-850 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#179150]"
                                style={{ width: `${Math.min((entry.saleAmount / 25) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals row */}
                      <div className="border-t border-surface-850 pt-4 flex justify-between items-center text-xs">
                        <span className="text-surface-500 font-semibold">Total Período Actual (Jun 2026)</span>
                        <span className="font-bold text-black text-sm">{formatCurrency(totalAccredited + totalPending)}</span>
                      </div>
                    </div>

                    {/* Signed Recipe Log */}
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div>
                        <h3 className="zenith-section-title">Bitácora de Récipes Firmados</h3>
                        <p className="text-xs text-surface-400">Historial de recetas digitales emitidas y firmadas electrónicamente.</p>
                      </div>

                      <div className="divide-y divide-surface-850">
                        {MOCK_RECIPE_LOG.map((rec) => (
                          <div key={rec.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-white">{rec.patientName}</span>
                                <span className="text-[9px] font-mono text-surface-500 bg-surface-950 border border-surface-850 px-1.5 py-0.2 rounded">{rec.id}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {rec.medications.map((med, idx) => (
                                  <span key={idx} className="text-[9px] bg-surface-800 text-surface-350 px-1.5 py-0.5 rounded font-medium">{med}</span>
                                ))}
                              </div>
                              <p className="text-[10px] text-surface-500 flex items-center gap-1">
                                <span>{rec.branch}</span>
                                <span>•</span>
                                <span>{rec.date}</span>
                              </p>
                            </div>
                            <div className="shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                rec.status === 'Retirado'
                                  ? 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20'
                                  : rec.status === 'Confirmado'
                                  ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                                  : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                              }`}>
                                {rec.status === 'Retirado' && <Check className="h-3 w-3" />}
                                {rec.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Doctor signature block */}
                      <div className="border-t border-surface-850 pt-4 flex items-center justify-between">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-white">{doctorName}</p>
                          <p className="text-[10px] text-surface-500">MPPS 28.490 • CMDC-12.458 • Cardiología</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-secondary-450 font-bold">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Firma Digital Activa</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })()}

            {/* VIEW TAB 5: PROFILE CONFIGURATION (Pantalla M.4) */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
                {profileSaveMsg && (
                  <div className="p-4 bg-secondary-500/10 border border-secondary-500/25 rounded-2xl flex items-center gap-2.5 text-secondary-400 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                    <span>{profileSaveMsg}</span>
                  </div>
                )}

                {/* Validated Credentials Card */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
                  <h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">
                    Credenciales Médicas Validadas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Identity */}
                    <div className="bg-surface-950/60 border border-surface-850 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-secondary-500/10 flex items-center justify-center shrink-0">
                          <BadgeCheck className="h-5 w-5 text-secondary-400" />
                        </div>
                        <div>
                          <p className="zenith-field-label">Nombre Legal</p>
                          <p className="text-sm font-semibold text-white">{doctorName}</p>
                        </div>
                      </div>
                      <div className="divide-y divide-surface-850 text-xs">
                        <div className="flex justify-between py-2">
                          <span className="text-surface-500">Cédula de Identidad</span>
                          <span className="text-surface-200 font-mono text-[10px]">{profileDocumentId}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-surface-500">Correo Institucional</span>
                          <span className="text-surface-200 font-mono text-[10px]">{doctorEmail}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-surface-500">Teléfono Profesional</span>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={e => setProfilePhone(e.target.value)}
                            placeholder="0212-9103348"
                            className="bg-transparent text-surface-200 text-[10px] font-mono text-right w-36 focus:outline-none focus:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical Registry */}
                    <div className="bg-surface-950/60 border border-surface-850 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                          <Award className="h-5 w-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="zenith-field-label">Registro Profesional</p>
                          <p className="text-sm font-semibold text-white">MPPS 28.490</p>
                        </div>
                      </div>
                      <div className="divide-y divide-surface-850 text-xs">
                        <div className="flex justify-between py-2">
                          <span className="text-surface-500">Especialidad Primaria</span>
                          <span className="text-surface-200 font-semibold">Cardiología</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-surface-500">Colegio de Médicos</span>
                          <span className="text-surface-200 font-semibold">CMDC-12.458</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-surface-500">Institución Certificadora</span>
                          <span className="text-surface-200 font-semibold">MPPS Venezuela</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-surface-500">Estado de Colegiatura</span>
                          <span className="inline-flex items-center gap-1 text-secondary-400 font-bold text-[10px]">
                            <ShieldCheck className="h-3 w-3" /> Activo / Vigente
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-surface-500">Renovación</span>
                          <span className="text-surface-200 font-mono text-[10px]">31 Dic, 2027</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Credential validity stamp */}
                  <div className="flex items-center gap-3 p-3 bg-secondary-500/5 border border-secondary-500/15 rounded-xl">
                    <ShieldCheck className="h-5 w-5 text-secondary-450 shrink-0" />
                    <p className="text-[10px] text-secondary-400 leading-snug">
                      <span className="font-bold">Verificación completada por Médico-Paciente:</span> Las credenciales han sido validadas contra el registro MPPS y el Colegio de Médicos de Venezuela, y se encuentran vigentes a la fecha.
                    </p>
                  </div>
                </div>

                {/* Consultorio Address Card */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
                  <h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">
                    Consultorio / Dirección Profesional
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Dirección (Av., Urb., Centro Médico, Consultorio)</label>
                      <input
                        type="text"
                        value={consultorioAddress}
                        onChange={e => setConsultorioAddress(e.target.value)}
                        placeholder="Ej: Av. Las Delicias, Centro Médico La Trinidad, Piso 3, Consultorio 12"
                        className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="zenith-field-label">Estado</label>
                        <VenezuelanStateSelect
                          value={consultorioState}
                          onChange={setConsultorioState}
                          accent="secondary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="zenith-field-label">Municipio</label>
                        <input
                          type="text"
                          value={consultorioMunicipio}
                          onChange={e => setConsultorioMunicipio(e.target.value)}
                          placeholder="Ej: Baruta"
                          className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banking Details Card */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
                  <h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">
                    Datos Bancarios para Recepción de Comisiones
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Titular de la Cuenta</label>
                      <input
                        type="text"
                        value={bankHolder}
                        onChange={e => setBankHolder(e.target.value)}
                        className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Cédula del Titular</label>
                      <input
                        type="text"
                        value={bankHolderId}
                        onChange={e => setBankHolderId(e.target.value)}
                        placeholder="V-12.345.678"
                        className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-secondary-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Entidad Bancaria</label>
                      <input
                        type="text"
                        value={bankEntity}
                        onChange={e => setBankEntity(e.target.value)}
                        placeholder="Ej: Banesco, Mercantil, BDV"
                        className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Tipo de Cuenta</label>
                      <select
                        value={bankAccountType}
                        onChange={e => setBankAccountType(e.target.value as 'Corriente' | 'Ahorro')}
                        className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-secondary-500"
                      >
                        <option value="Corriente">Corriente</option>
                        <option value="Ahorro">Ahorro</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="zenith-field-label">Número de Cuenta Bancaria</label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={e => setBankAccountNumber(e.target.value)}
                        placeholder="0134-0100-01-0101234567"
                        className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-secondary-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Teléfono Pago Móvil</label>
                      <input
                        type="text"
                        value={bankMobilePhone}
                        onChange={e => setBankMobilePhone(e.target.value)}
                        placeholder="0414-1234567"
                        className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-secondary-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Frecuencia de Acreditación</label>
                      <select
                        disabled
                        className="w-full bg-surface-950/50 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-500 cursor-not-allowed"
                      >
                        <option>Mensual (último día hábil)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-primary-500/5 border border-primary-500/15 rounded-xl flex items-start gap-2 text-[10px] text-primary-400">
                    <DollarSign className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Las comisiones se liquidan el último día hábil de cada mes mediante transferencia o Pago Móvil en bolívares. Verifique cuenta y teléfono afiliado antes del día 25 de cada período.</span>
                  </div>

                  {/* Save / Logout actions */}
                  <div className="pt-2 border-t border-surface-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="zenith-logout-btn order-last sm:order-first"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileSaveMsg('Perfil, consultorio y datos bancarios actualizados. Los cambios bancarios surten efecto en el próximo período de liquidación.');
                        setTimeout(() => setProfileSaveMsg(''), 4000);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-secondary to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-secondary-650/10 transition-all cursor-pointer"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>

              </div>
            )}

      {/* Credencial QR del médico eliminada */}

      <Modal
        open={isScannerModalOpen}
        onClose={() => {
          setIsScannerModalOpen(false);
          setIsScanning(false);
          setScanProgress(0);
        }}
        title="Escanear código qr"
        size="md"
      >
        <ModalBody className="space-y-5">
          {isWaitingConsent ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-16 h-16 border-4 border-secondary-500/30 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
                <Users className="absolute w-6 h-6 text-secondary-400" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-sm font-bold text-white">Esperando confirmación...</h4>
                <p className="text-xs text-surface-400 max-w-[260px] mx-auto">
                  El paciente {pendingConsentPatient?.name} debe aceptar la solicitud de vinculación en su dispositivo móvil.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelConsentRequest}
                className="mt-6 px-4 py-2 border border-surface-700 hover:bg-surface-800 text-surface-300 rounded-lg text-xs font-bold transition-colors w-full max-w-[200px]"
              >
                Cancelar Solicitud
              </button>
            </div>
          
          ) : (
            <>
              <p className="text-xs text-surface-400">
                Active la camara desde un movil o use la vinculacion manual para cargar el expediente del paciente.
              </p>

              <div className="mx-auto w-full max-w-[280px] aspect-square rounded-2xl bg-surface-950 border border-surface-800 relative flex flex-col items-center justify-center overflow-hidden p-4">
                {isScanning ? (
                  <>
                    <div id="qr-reader" className="absolute inset-0 z-0 overflow-hidden" />
                    <div className="absolute left-0 w-full h-0.5 bg-secondary-500 shadow-[0_0_8px_rgba(23,145,80,0.8)] laser-line" />
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-secondary-500" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-secondary-500" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-secondary-500" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-secondary-500" />
                    <div className="space-y-2 text-center z-10">
                      <Camera className="h-10 w-10 text-secondary-500 animate-pulse mx-auto" />
                      <p className="text-xs text-secondary-400 font-mono font-bold tracking-wider">
                        BUSCANDO QR ({scanProgress}%)
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 text-center z-10">
                    <QrCode className="h-14 w-14 text-surface-600 mx-auto" />
                    <p className="text-sm text-surface-400 font-medium">{isMobileScannerCapable ? 'Camara de escaner inactiva' : 'Escaner no disponible en PC'}</p>
                    <button
                      type="button"
                      onClick={triggerCameraScan}
                      disabled={!isMobileScannerCapable}
                      className="px-4 py-2 bg-[var(--portal-doctor-btn-bg)] hover:bg-[var(--portal-doctor-btn-hover)] text-[var(--portal-doctor-btn-fg)] rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isMobileScannerCapable ? 'Activar escaner' : 'Solo disponible en movil'}
                    </button>
                  </div>
                )}
              </div>

              {scannerErrorMsg ? (

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                  {scannerErrorMsg}
                </div>
              ) : null}

              <div className="flex items-center gap-3 text-2xs font-bold text-surface-600 uppercase tracking-widest">
                <span className="h-px bg-surface-800 flex-1" />
                <span>o</span>
                <span className="h-px bg-surface-800 flex-1" />
              </div>

              <form onSubmit={handleManualLinkSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="zenith-field-label">Cédula del paciente</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Ej: V-28450123"
                      value={manualCedulaInput}
                      onChange={(e) => setManualCedulaInput(e.target.value)}
                      className="flex-1 bg-surface-950 border border-surface-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-surface-750 focus:outline-none focus:border-secondary-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-surface-700 sm:shrink-0"
                    >
                      Vincular
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-surface-555 italic leading-snug">
                  Tip de prueba: digite <code className="text-secondary-400 font-mono">V-28450123</code> para vincular a Sofía Peralta.
                </p>
              </form>
            </>
          )}
        </ModalBody>
      </Modal>

      </AppShell>
    </>
  );
}
