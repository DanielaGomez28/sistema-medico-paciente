'use client';

/**
 * @fileoverview Componente doctor view.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  PlusCircle, 
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  QrCode,
  Camera,
  CheckCircle2,
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
  BadgeCheck,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { AppShell, AppSidebar, AppHeader } from './layout';
import DoctorHelpView from './DoctorHelpView';
// QR credential removed for doctor portal
import VenezuelanStateSelect from './VenezuelanStateSelect';
import { formatCurrency } from '../lib/currency';
import { Button, Modal, ModalBody, ListCard } from './ui';
import apiClient from '../lib/api';
import { socket, SOCKET_RUNTIME_SUPPORTED } from '../lib/socket';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  DOCTOR_PROFILE_DEFAULTS,
  type DoctorLinkedPatientSeed as LinkedPatient,
} from '../data/mockData';


/**
 * Propiedades de la vista de portal del Medico.
 */
interface DoctorViewProps {
  doctorName: string;
  doctorEmail: string;
  doctorId: string;
  doctorProfile?: {
    mpps?: string | null;
    specialty?: string | null;
    medicalCollege?: string | null;
    specialSanitaryRegistration?: string | null;
    digitalSignatureHash?: string | null;
    officeLocation?: string | null;
    status?: string | null;
  } | null;
  onLogout: () => void;
}

interface MedicalProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  source: 'farmacia' | 'externo';
  benefitPct?: number;
  sanitaryCategory?: string;
  pharmacyName?: string;
  isControlled?: boolean;
  controlledSubstanceType?: string | null;
}

interface PrescriptionCatalogApiItem {
  id_producto: string;
  nombre: string;
  principio_activo: string;
  presentacion: string;
  laboratorio: string;
  stock: number;
  precio_base: number;
  beneficio_pct: number;
  precio_con_beneficio: number;
  sanitary_category?: string;
  is_controlled?: boolean;
  controlled_substance_type?: string | null;
  pharmacy_name?: string;
}

interface CartItem {
  product: MedicalProduct;
  posology: string;
  discount: number;
  treatmentDays: number;
  dailyDoses: number;
  quantity?: number;
}

interface DoctorCommissionTransaction {
  orderId: string;
  recipeId: string;
  amount: number;
  commissionAmount: number;
  settledAt: string;
  pharmacy_name?: string;
  medications?: string;
}

interface DoctorCommissionSummary {
  doctorId: string;
  currency: string;
  commissionRatePct: number;
  availableBalance: number;
  currentPeriod?: string;
  transactions: DoctorCommissionTransaction[];
}

interface DoctorRecipeLogItem {
  id_producto: string;
  nombre: string;
  cantidad_prescrita?: number;
  remaining_quantity?: number;
  pharmacy_name?: string;
}

interface DoctorRecipeLogRecord {
  recipeId: string;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  clinicalStatus: string;
  commercialStatus: string;
  fulfillmentStatus: string;
  recipeExpiresAt: string;
  createdAt: string;
  pharmacyDispatch?: {
    branchName?: string;
    dispatchStatus?: string;
  } | null;
  items: DoctorRecipeLogItem[];
}

interface ConsentResultPayload {
  success: boolean;
  message?: string;
  patientName?: string;
  result?: {
    vinculacion?: {
      id_paciente?: string | number | null;
    } | null;
  } | null;
}

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

/**
 * Detecta si el navegador actual pertenece a un dispositivo movil apto para escaneo.
 */
const MOBILE_SCANNER_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * Normaliza un identificador de paciente para comparaciones seguras en UI.
 * @param {string} value - Valor ingresado por el usuario.
 * @returns {string} Identificador normalizado.
 */
const normalizePatientLookup = (value: string) => value.toUpperCase().replace(/[^A-Z0-9-]/g, '').trim();

/**
 * Detecta patrones sospechosos en cadenas antes de enviarlas al backend.
 * @param {string} value - Valor a inspeccionar.
 * @returns {boolean} `true` si el valor parece malicioso.
 */
const containsSuspiciousPattern = (value: string) => /('|--|;|\/\*|\*\/|\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b|<script)/i.test(value);

/**
 * Valida texto libre seguro para entradas operativas del frontend.
 * @param {string} value - Valor a validar.
 * @param {RegExp} pattern - Patron permitido.
 * @returns {boolean} `true` si cumple el formato esperado.
 */
const matchesSafePattern = (value: string, pattern: RegExp) => Boolean(value.trim()) && !containsSuspiciousPattern(value) && pattern.test(value.trim());

/**
 * Normaliza el texto de busqueda de medicamentos antes de consultar el catalogo.
 * @param {string} value - Texto ingresado por el medico.
 * @returns {string} Texto listo para consulta.
 */
const normalizePrescriptionSearch = (value: string) => value.trim();

/**
 * Formatea un numero de telefono agregando guiones (ej. 0414-1234567)
 */
export const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return digits;
};

/**
 * Adapta un item del catalogo backend al modelo visual del portal medico.
 * @param {PrescriptionCatalogApiItem} item - Item devuelto por el backend.
 * @returns {MedicalProduct} Producto adaptado para la UI.
 */
const mapCatalogItemToProduct = (item: PrescriptionCatalogApiItem): MedicalProduct => ({
  id: item.id_producto,
  name: item.nombre,
  category: item.principio_activo || item.laboratorio || 'Medicamento',
  price: Number(item.precio_con_beneficio ?? item.precio_base ?? 0),
  stock: Number(item.stock ?? 0),
  description: [item.presentacion, item.laboratorio].filter(Boolean).join(' | '),
  source: 'farmacia',
  benefitPct: Number(item.beneficio_pct ?? 0),
  sanitaryCategory: item.sanitary_category || 'regular',
  isControlled: Boolean(item.is_controlled),
  controlledSubstanceType: item.controlled_substance_type || null,
  pharmacyName: item.pharmacy_name,
});

/**
 * Función auxiliar para generar la estructura de un paciente nuevo vacío.
 * @returns {LinkedPatient} Objeto de paciente por defecto.
 */
// createEmptyPatient removed — new patient creation disabled in doctor portal

const VENEZUELAN_BANKS = [
  "0102 - BANCO DE VENEZUELA",
  "0104 - BANCO VENEZOLANO DE CREDITO",
  "0105 - BANCO MERCANTIL",
  "0108 - BBVA PROVINCIAL",
  "0114 - BANCARIBE",
  "0115 - BANCO EXTERIOR",
  "0128 - BANCO CARONI",
  "0134 - BANESCO",
  "0137 - BANCO SOFITASA",
  "0138 - BANCO PLAZA",
  "0146 - BANGENTE",
  "0151 - BANCO FONDO COMUN",
  "0156 - 100% BANCO",
  "0157 - DELSUR BANCO UNIVERSAL",
  "0163 - BANCO DEL TESORO",
  "0168 - BANCRECER",
  "0169 - R4 BANCO MICROFINANCIERO C.A.",
  "0171 - BANCO ACTIVO",
  "0172 - BANCAMIGA BANCO UNIVERSAL, C.A.",
  "0173 - BANCO INTERNACIONAL DE DESARROLLO",
  "0174 - BANPLUS",
  "0175 - BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL",
  "0177 - BANFANB",
  "0178 - N58 BANCO DIGITAL BANCO MICROFINANCIERO S A",
  "0191 - BANCO NACIONAL DE CREDITO"
];

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
export default function DoctorView({ doctorName, doctorEmail, doctorId, doctorProfile, onLogout }: DoctorViewProps) {
  // Navigation active tab: 'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile'
  const [activeTab, setActiveTab] = useState<'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile' | 'help'>('agenda');

  // Estados para manejar el Escáner y el Bloqueo MCA (Módulo 1 / Sprint #2)
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [waitingConsent, setWaitingConsent] = useState<boolean>(false);

  // Simulamos el ID del médico (para el Handshake)
  const DOCTOR_ID = doctorId || doctorEmail;
  const DOCTOR_NAME = doctorName || doctorEmail;

  // M.4 Profile & Banking state
  const [bankHolder, setBankHolder] = useState(doctorName || doctorEmail);
  const [bankHolderId, setBankHolderId] = useState(DOCTOR_PROFILE_DEFAULTS.bankHolderId);
  const [bankEntity, setBankEntity] = useState(DOCTOR_PROFILE_DEFAULTS.bankEntity);
  const [bankAccountType, setBankAccountType] = useState<'Corriente' | 'Ahorro'>(DOCTOR_PROFILE_DEFAULTS.bankAccountType);
  const [bankAccountNumber, setBankAccountNumber] = useState(DOCTOR_PROFILE_DEFAULTS.bankAccountNumber);
  const [bankMobilePhone, setBankMobilePhone] = useState(DOCTOR_PROFILE_DEFAULTS.bankMobilePhone);
  const [profilePhone, setProfilePhone] = useState(DOCTOR_PROFILE_DEFAULTS.profilePhone);
  const [profileRegistryId] = useState(DOCTOR_PROFILE_DEFAULTS.profileRegistryId);
  const [consultorioAddress, setConsultorioAddress] = useState(doctorProfile?.officeLocation || DOCTOR_PROFILE_DEFAULTS.consultorioAddress);
  const [consultorioState, setConsultorioState] = useState(DOCTOR_PROFILE_DEFAULTS.consultorioState);
  const [consultorioMunicipio, setConsultorioMunicipio] = useState(DOCTOR_PROFILE_DEFAULTS.consultorioMunicipio);
  const [profileSaveMsg, setProfileSaveMsg] = useState('');
  const doctorMpps = doctorProfile?.mpps || 'MPPS no disponible';
  const doctorSpecialty = doctorProfile?.specialty || 'Especialidad no disponible';
  const doctorMedicalCollege = doctorProfile?.medicalCollege || 'Colegio no disponible';
  const doctorSpecialSanitaryRegistration = doctorProfile?.specialSanitaryRegistration || null;
  const doctorDigitalSignatureHash = doctorProfile?.digitalSignatureHash || null;

  // QR credential removed for doctor portal per requested change

  // Dynamic commission rate state
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [commissionSummary, setCommissionSummary] = useState<DoctorCommissionSummary | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commissionError, setCommissionError] = useState('');
  const [doctorRecipeLog, setDoctorRecipeLog] = useState<DoctorRecipeLogRecord[]>([]);
  const [recipeLogLoading, setRecipeLogLoading] = useState(false);
  const [recipeLogError, setRecipeLogError] = useState('');
  
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [patientViewMode, setPatientViewMode] = useState<'list' | 'detail'>('list');
  const [patientListSearch, setPatientListSearch] = useState('');
  const [patientForm, setPatientForm] = useState<LinkedPatient>({
    systemId: '',
    patientId: '',
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
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [isEditingDoctorProfile, setIsEditingDoctorProfile] = useState(false);
  const [isEditingPatientRecord, setIsEditingPatientRecord] = useState(false);
  const [patientFormSnapshot, setPatientFormSnapshot] = useState<LinkedPatient | null>(null);
  const [doctorProfileSnapshot, setDoctorProfileSnapshot] = useState<null | {
    bankHolder: string;
    bankHolderId: string;
    bankEntity: string;
    bankAccountType: 'Corriente' | 'Ahorro';
    bankAccountNumber: string;
    bankMobilePhone: string;
    profilePhone: string;
    consultorioAddress: string;
    consultorioState: string;
    consultorioMunicipio: string;
  }>(null);
  const doctorProfileFieldReadonly =
    'bg-surface-950/40 text-surface-250 border-surface-850';
  const doctorProfileFieldEditing =
    'bg-[#179150]/15 text-[#0a1220] dark:!text-white border-[#179150]/35 focus:border-[#179150]';
  const [isWaitingConsent, setIsWaitingConsent] = useState(false);
  const [pendingConsentPatient, setPendingConsentPatient] = useState<LinkedPatient | null>(null);

  // Reception / QR scan states (M.1)
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [manualPatientIdInput, setManualPatientIdInput] = useState('');
  const [linkedPatient, setLinkedPatient] = useState<LinkedPatient | null>(null);
  const [, setPatientsLoading] = useState(false);
  const [, setPatientsError] = useState('');

  const [scannerErrorMsg, setScannerErrorMsg] = useState('');
  const [isMobileScannerCapable] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasCameraApi = Boolean(window.navigator.mediaDevices?.getUserMedia);
    const isMobileDevice = MOBILE_SCANNER_REGEX.test(window.navigator.userAgent || '');
    return hasCameraApi && isMobileDevice;
  });

  useEffect(() => {
    let cancelled = false;

    const loadPatients = async () => {
      if (!DOCTOR_ID) return;

      try {
        setPatientsLoading(true);
        setPatientsError('');
        const response = await apiClient.get(`/pacientes/medico/${encodeURIComponent(DOCTOR_ID)}`);

        if (!cancelled) {
          setPatients(Array.isArray(response.data?.items) ? response.data.items : []);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const apiError = error as ApiErrorPayload;
          setPatientsError(
            apiError.response?.data?.error ||
            apiError.response?.data?.details ||
            'No se pudo cargar la agenda clínica real del médico.'
          );
        }
      } finally {
        if (!cancelled) {
          setPatientsLoading(false);
        }
      }
    };

    void loadPatients();
    const intervalId = setInterval(() => {
      void loadPatients();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [DOCTOR_ID]);

  // WebSockets: Escuchar respuesta del paciente usando `patientId` interno
  useEffect(() => {
    if (!SOCKET_RUNTIME_SUPPORTED) {
      return undefined;
    }

    const identify = () => {
      socket.emit('identifyUser', { userId: DOCTOR_ID, role: 'doctor', name: DOCTOR_NAME });
    };

    socket.connect();

    if (socket.connected) identify();
    socket.on('connect', identify);

    const handleConsentResult = async (data: ConsentResultPayload) => {
      setIsWaitingConsent(false);
      setWaitingConsent(false);

      if (data.success) {
        const linkedPatientId = data.result?.vinculacion?.id_paciente?.toString()?.toLowerCase();

        let targetPatient: LinkedPatient | undefined | null = patients.find((p) => p.systemId === linkedPatientId);

        if (!targetPatient && linkedPatientId) {
          try {
            const response = await apiClient.get(`/pacientes/${encodeURIComponent(linkedPatientId)}`);
            targetPatient = response.data as LinkedPatient;
            setPatients((prev) => {
              const exists = prev.some((patient) => patient.systemId === targetPatient?.systemId);
              return exists || !targetPatient ? prev : [...prev, targetPatient];
            });
          } catch {
            targetPatient = null;
          }
        }

        if (!targetPatient) {
          targetPatient = {
            systemId: linkedPatientId || '',
            patientId: 'N/A',
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
        }

        setIsScannerModalOpen(false);
        openPatientForm(targetPatient as LinkedPatient);
      } else {
        alert(data.message || 'El paciente denegó la solicitud de vinculación.');
      }

      setPendingConsentPatient(null);
    };

    const handleConsentRequestSent = ({ patientName }: { patientName: string }) => {
      setPendingConsentPatient((prev) => prev ? { ...prev, name: patientName } : null);
    };

    const handlePatientProfileUpdated = ({ patient }: { patient?: LinkedPatient }) => {
      if (!patient?.systemId && !patient?.patientId) {
        return;
      }

      setPatients((prev) => prev.map((current) => (
        current.systemId === patient.systemId || current.patientId === patient.patientId
          ? { ...current, ...patient }
          : current
      )));

      setLinkedPatient((current) => {
        if (!current) return current;
        return current.systemId === patient.systemId || current.patientId === patient.patientId
          ? { ...current, ...patient }
          : current;
      });

      setPatientForm((current) => (
        current.systemId === patient.systemId || current.patientId === patient.patientId
          ? { ...current, ...patient }
          : current
      ));
    };

    socket.on('consentResult', handleConsentResult);
    socket.on('consentRequestSent', handleConsentRequestSent);
    socket.on('patientProfileUpdated', handlePatientProfileUpdated);

    return () => {
      socket.off('connect', identify);
      socket.off('consentResult', handleConsentResult);
      socket.off('consentRequestSent', handleConsentRequestSent);
      socket.off('patientProfileUpdated', handlePatientProfileUpdated);
      socket.disconnect();
    };
  }, [DOCTOR_ID, DOCTOR_NAME, patients]);


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
              patientId: response.data.patientId // El backend desencript? el patientId interno desde el QR
            });
          }
        } catch (error: unknown) {
          // Fallo por QR Caducado o Nonce duplicado
          const apiError = error as ApiErrorPayload;
          setScannerErrorMsg(apiError.response?.data?.error || 'Error de seguridad: QR caducado o invalido.');
        }
      }, () => {
        // Errores silenciosos mientras busca el QR frame por frame (se ignoran)
      });

      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }
  }, [DOCTOR_ID, DOCTOR_NAME, isScanning, isMobileScannerCapable]);

  const filteredPatients = useMemo(() => {
    const query = patientListSearch.toLowerCase().trim();
    if (!query) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.patientId.toLowerCase().includes(query)
    );
  }, [patients, patientListSearch]);



  // Prescription states (M.2)
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [inventoryPreview, setInventoryPreview] = useState<MedicalProduct[]>([]);
  const [catalogResults, setCatalogResults] = useState<MedicalProduct[]>([]);
  const [catalogSortOrder, setCatalogSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [catalogPharmacyFilter, setCatalogPharmacyFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    const capitalizeFirst = (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const loadCatalog = async () => {
      try {
        const response = await apiClient.get('/prescripciones/catalogo');
        const items = Array.isArray(response.data?.items)
          ? response.data.items.map(mapCatalogItemToProduct)
          : [];

        if (!cancelled) {
          setInventoryPreview(items);
          setCatalogResults(items);
        }
      } catch {
        if (!cancelled) {
          setCatalogResults([]);
        }
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      const normalizedQuery = normalizePrescriptionSearch(searchQuery);

      if (!normalizedQuery) {
        setCatalogResults(inventoryPreview);
        return;
      }

      try {
        const response = await apiClient.post('/prescripciones/buscar', { searchTerm: normalizedQuery });
        const items = Array.isArray(response.data?.items)
          ? response.data.items.map(mapCatalogItemToProduct)
          : [];

        if (!cancelled) {
          setCatalogResults(items);
        }
      } catch {
        if (!cancelled) {
          setCatalogResults([]);
        }
      } finally {
        if (!cancelled) {
        }
      }
    };

    if (activeTab === 'prescription') {
      runSearch();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, inventoryPreview, searchQuery]);

  useEffect(() => {
    let cancelled = false;

    /**
     * Carga desde backend el resumen real de comisiones del medico autenticado.
     * @returns {Promise<void>}
     */
    const loadCommissionSummary = async () => {
      if (activeTab !== 'commissions' || !DOCTOR_ID) {
        return;
      }

      try {
        setCommissionLoading(true);
        setCommissionError('');
        const response = await apiClient.get(`/pagos/comisiones/medico/${encodeURIComponent(DOCTOR_ID)}`);

        if (!cancelled) {
          const summary = response.data as DoctorCommissionSummary;
          setCommissionSummary(summary);
          if (Number.isFinite(summary?.commissionRatePct)) {
            setCommissionRate(Number(summary.commissionRatePct));
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const apiError = error as ApiErrorPayload;
          setCommissionError(
            apiError.response?.data?.error ||
            apiError.response?.data?.details ||
            'No se pudo cargar el libro de comisiones del backend.'
          );
        }
      } finally {
        if (!cancelled) {
          setCommissionLoading(false);
        }
      }
    };

    loadCommissionSummary();

    return () => {
      cancelled = true;
    };
  }, [DOCTOR_ID, activeTab]);

  useEffect(() => {
    let cancelled = false;

    /**
     * Carga desde backend la bitacora real de recipes emitidos por el medico.
     * @returns {Promise<void>}
     */
    const loadDoctorRecipeLog = async () => {
      if (activeTab !== 'commissions' || !DOCTOR_ID) {
        return;
      }

      try {
        setRecipeLogLoading(true);
        setRecipeLogError('');
        const response = await apiClient.get(`/prescripciones/medico/${encodeURIComponent(DOCTOR_ID)}`);

        if (!cancelled) {
          setDoctorRecipeLog(Array.isArray(response.data?.items) ? response.data.items : []);
        }      } catch (error: unknown) {
        if (!cancelled) {
          const apiError = error as ApiErrorPayload;
          setRecipeLogError(
            apiError.response?.data?.error ||
            apiError.response?.data?.details ||
            'No se pudo cargar la bitácora real de recipes del backend.'
          );
        }
      } finally {
        if (!cancelled) {
          setRecipeLogLoading(false);
        }
      }
    };

    loadDoctorRecipeLog();

    return () => {
      cancelled = true;
    };
  }, [DOCTOR_ID, activeTab]);

  /**
   * Abre el formulario de detalle de un paciente existente.
   * @param {LinkedPatient} patient - El paciente a mostrar.
   */
  function openPatientForm(patient: LinkedPatient) {
    const hydratedPatient = { ...patient, medications: [...patient.medications] };
    setPatientForm(hydratedPatient);
    setPatientFormSnapshot(hydratedPatient);
    setMedicationsInput(patient.medications.join(', '));
    setLinkedPatient(patient);
    setIsEditingPatientRecord(false);
    setPatientViewMode('detail');
    setActiveTab('reception');
  }

  // New-patient creation removed from doctor portal

  /**
   * Regresa a la vista de lista de pacientes.
   */
  const handleBackToPatientList = () => {
    setPatientViewMode('list');
    setPatientSaveMsg('');
    setProfileErrorMsg('');
    setIsEditingPatientRecord(false);
  };
  /**
   * Maneja el guardado o actualización de un paciente en el formulario.
   * @param {React.FormEvent} e - Evento del formulario.
   */
  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingPatientRecord) {
      return;
    }

    if (!matchesSafePattern(patientForm.name, /^[\p{L}\p{N}\s.'-]{3,120}$/u)) {
      alert('El nombre del paciente contiene un formato inválido.');
      return;
    }

    if (patientForm.phone !== 'N/A' && !matchesSafePattern(patientForm.phone, /^[+\d\s()-]{7,20}$/)) {
      alert('El teléfono del paciente no cumple el formato esperado.');
      return;
    }

    if (!patientForm.patientId.trim()) {
      alert('El ID interno del paciente es obligatorio.');
      return;
    }

    if (patientForm.condition && patientForm.condition !== 'N/A' && patientForm.condition.trim() !== '') {
      if (!matchesSafePattern(patientForm.condition, /^[\p{L}\p{N}\s.,()'\/-]{2,160}$/u)) {
        alert('La condición del paciente contiene caracteres inválidos.');
        return;
      }
    }

    if (patientForm.allergies && patientForm.allergies !== 'N/A' && patientForm.allergies.trim() !== '') {
      if (!matchesSafePattern(patientForm.allergies, /^[\p{L}\p{N}\s.,()'\/-]{2,160}$/u)) {
        alert('Las alergias del paciente contienen caracteres inválidos.');
        return;
      }
    }

    const medications = medicationsInput
      .split(',')
      .map((med) => med.trim())
      .filter(Boolean);

    try {
      const response = await apiClient.put(`/pacientes/${encodeURIComponent(patientForm.systemId || patientForm.patientId)}`, {
        ...patientForm,
        medications,
      });
      const updatedPatient = response.data?.patient as LinkedPatient;

      setPatients((prev) =>
        prev.map((patient) =>
          patient.systemId === updatedPatient.systemId || patient.patientId === updatedPatient.patientId
            ? updatedPatient
            : patient
        )
      );
      setLinkedPatient(updatedPatient);
      setPatientForm(updatedPatient);
      setPatientFormSnapshot(updatedPatient);
      setIsEditingPatientRecord(false);
      setMedicationsInput(updatedPatient.medications.join(', '));
      setPatientSaveMsg('Datos del paciente guardados correctamente.');
      setTimeout(() => setPatientSaveMsg(''), 3000);
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload;
      alert(
        apiError.response?.data?.error ||
        apiError.response?.data?.details ||
        'No se pudo actualizar el expediente clínico del paciente.'
      );
    }
  };


  /**
   * Habilita la edicion explicita del expediente del paciente.
   * @returns {void}
   */
  const handleStartPatientEdit = () => {
    setPatientFormSnapshot({ ...patientForm, medications: [...patientForm.medications] });
    setPatientSaveMsg('');
    setProfileErrorMsg('');
    setIsEditingPatientRecord(true);
  };

  /**
   * Cancela la edicion del expediente y restaura el ultimo snapshot valido.
   * @returns {void}
   */
  const handleCancelPatientEdit = () => {
    if (patientFormSnapshot) {
      setPatientForm({ ...patientFormSnapshot, medications: [...patientFormSnapshot.medications] });
      setMedicationsInput(patientFormSnapshot.medications.join(', '));
    }
    setIsEditingPatientRecord(false);
    setPatientSaveMsg('');
  };

  /**
   * Habilita la edicion controlada del perfil profesional visible en UI.
   * @returns {void}
   */
  const handleStartDoctorProfileEdit = () => {
    setDoctorProfileSnapshot({
      bankHolder,
      bankHolderId,
      bankEntity,
      bankAccountType,
      bankAccountNumber,
      bankMobilePhone,
      profilePhone,
      consultorioAddress,
      consultorioState,
      consultorioMunicipio,
    });
    setProfileErrorMsg('');
    setProfileSaveMsg('');
    setIsEditingDoctorProfile(true);
  };

  /**
   * Revierte la edicion local del perfil del medico.
   * @returns {void}
   */
  const handleCancelDoctorProfileEdit = () => {
    if (doctorProfileSnapshot) {
      setBankHolder(doctorProfileSnapshot.bankHolder);
      setBankHolderId(doctorProfileSnapshot.bankHolderId);
      setBankEntity(doctorProfileSnapshot.bankEntity);
      setBankAccountType(doctorProfileSnapshot.bankAccountType);
      setBankAccountNumber(doctorProfileSnapshot.bankAccountNumber);
      setBankMobilePhone(doctorProfileSnapshot.bankMobilePhone);
      setProfilePhone(doctorProfileSnapshot.profilePhone);
      setConsultorioAddress(doctorProfileSnapshot.consultorioAddress);
      setConsultorioState(doctorProfileSnapshot.consultorioState);
      setConsultorioMunicipio(doctorProfileSnapshot.consultorioMunicipio);
    }
    setIsEditingDoctorProfile(false);
    setProfileErrorMsg('');
  };

  /**
   * Confirma la edicion local del perfil profesional tras validar entradas.
   * @returns {void}
   */
  const handleConfirmDoctorProfileEdit = async () => {
    const doctorPhoneIsValid = matchesSafePattern(profilePhone, /^[+\d\s()-]{7,20}$/);
    const bankHolderIsValid = matchesSafePattern(bankHolder, /^[\p{L}\p{N}\s.'-]{3,120}$/u);
    const bankHolderIdIsValid = matchesSafePattern(bankHolderId, /^[VEJGP-\d\s.]{5,20}$/i);
    const bankEntityIsValid = matchesSafePattern(bankEntity, /^[\p{L}\p{N}\s.'-]{3,120}$/u);
    const accountNumberIsValid = matchesSafePattern(bankAccountNumber, /^[\d-]{10,30}$/);
    const bankMobileIsValid = matchesSafePattern(bankMobilePhone, /^[+\d\s()-]{7,20}$/);
    const officeAddressIsValid = matchesSafePattern(consultorioAddress, /^[\p{L}\p{N}\s.,#()"'-]{5,200}$/u);
    const officeMunicipioIsValid = matchesSafePattern(consultorioMunicipio, /^[\p{L}\p{N}\s.'-]{2,120}$/u);

    if (!doctorPhoneIsValid || !bankHolderIsValid || !bankHolderIdIsValid || !bankEntityIsValid || !accountNumberIsValid || !bankMobileIsValid || !officeAddressIsValid || !officeMunicipioIsValid) {
      setProfileErrorMsg('Revisá los datos del perfil profesional. Hay campos vacíos, inseguros o con formato inválido.');
      return;
    }

    try {
      await apiClient.put(`/medicos/${encodeURIComponent(DOCTOR_ID)}/perfil`, {
        bankHolder,
        bankHolderId,
        bankEntity,
        bankAccountType,
        bankAccountNumber,
        bankMobilePhone,
        profilePhone,
        consultorioAddress,
        consultorioState,
        consultorioMunicipio,
      });

      setProfileErrorMsg('');
      setIsEditingDoctorProfile(false);
      setProfileSaveMsg('Perfil, consultorio y datos bancarios listos y confirmados para la sesión actual.');
      setTimeout(() => setProfileSaveMsg(''), 4000);
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload;
      setProfileErrorMsg(
        apiError.response?.data?.error ||
        apiError.response?.data?.details ||
        'Ocurrió un error al guardar el perfil en el servidor.'
      );
    }
  };

  /**
   * Inicia el flujo de vinculacion manual de un paciente por identificador.
   * @param {string} patientQuery - Identificador ingresado desde la UI.
   * @returns {Promise<void>}
   */
  const linkPatientMock = async (patientQuery: string) => {
    if (!SOCKET_RUNTIME_SUPPORTED) {
      setScannerErrorMsg('La vinculación en tiempo real requiere backend local persistente. En Vercel se debe operar con recarga de agenda y flujos HTTP.');
      return;
    }
    const normalized = patientQuery.toLowerCase().replace(/[\s\.-]/g, '');
    let targetPatient = patients.find((patient) =>
      patient.patientId.toLowerCase().replace(/[\s\.-]/g, '').includes(normalized)
    );

    if (!targetPatient) {
      try {
        const response = await apiClient.get(`/pacientes/${encodeURIComponent(patientQuery)}`);
        targetPatient = response.data as LinkedPatient;
        setPatients((prev) => {
          const exists = prev.some((patient) => patient.systemId === targetPatient?.systemId);
          return exists || !targetPatient ? prev : [...prev, targetPatient];
        });
      } catch {
        setScannerErrorMsg('No se encontró el paciente en la base de datos.');
        return;
      }
    }

    setIsWaitingConsent(true);
    setPendingConsentPatient(targetPatient || null);

    socket.emit('requestConsent', {
      doctorId: DOCTOR_ID,
      doctorName: DOCTOR_NAME,
      patientId: targetPatient?.systemId || targetPatient?.patientId || patientQuery,
    });
  };

  /**
   * Cancela la solicitud de consentimiento pendiente.
   * @returns {void}
   */
  const cancelConsentRequest = () => {
    if (!SOCKET_RUNTIME_SUPPORTED) {
      setIsWaitingConsent(false);
      setPendingConsentPatient(null);
      return;
    }
    if (pendingConsentPatient) {
      socket.emit('cancelConsentRequest', {
        doctorId: DOCTOR_ID,
        patientId: pendingConsentPatient.systemId || pendingConsentPatient.patientId,
      });
    }
    setIsWaitingConsent(false);
    setPendingConsentPatient(null);
  };

  /**
   * Simula el inicio del escaneo mediante cámara.
   */
  const triggerCameraScan = () => {
    if (!SOCKET_RUNTIME_SUPPORTED) {
      setScannerErrorMsg('El escáner realtime solo queda habilitado en entorno local con Socket.IO persistente.');
      return;
    }
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
    let resetTimer: NodeJS.Timeout | undefined;

    if (isScanning) {
      timer = setInterval(() => {
        setScanProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 400);
    } else {
      resetTimer = setTimeout(() => setScanProgress(0), 0);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [isScanning]);

  /**
   * Maneja el envío manual del formulario de vinculación de paciente.
   * @param {React.FormEvent} e - Evento de formulario.
   */
  const handleManualLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedPatientId = normalizePatientLookup(manualPatientIdInput);

    if (!sanitizedPatientId) {
      alert('Por favor ingrese el ID interno del paciente.');
      return;
    }

    if (containsSuspiciousPattern(sanitizedPatientId)) {
      alert('El ID interno contiene un patrón inválido.');
      return;
    }

    setScannerErrorMsg('');
    void linkPatientMock(sanitizedPatientId);
    setManualPatientIdInput('');
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
    setCart([...cart, { product, posology: '', discount: 0, treatmentDays: 1, dailyDoses: 1, quantity: 1 }]);
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
  const handleRegisterPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Debe agregar al menos un medicamento a la prescripcion.');
      return;
    }

    if (!linkedPatient?.systemId && !linkedPatient?.patientId) {
      alert('Debe seleccionar primero un paciente vinculado.');
      return;
    }

    const missingPosology = cart.some(item => !item.posology.trim());
    if (missingPosology) {
      alert('Por favor configure las instrucciones de posologia para todos los medicamentos.');
      return;
    }

    try {
        const response = await apiClient.post('/prescripciones/emitir', {
        doctorId: DOCTOR_ID,
        patientId: linkedPatient.systemId || linkedPatient.patientId,
        observaciones: `Receta emitida por ${DOCTOR_NAME}`,
        items: cart.map((item) => ({
          id_producto: item.product.id,
          dosis: item.posology.trim(),
          cantidad: item.quantity || 1,
          aplicar_beneficio: globalDiscount > 0,
        })),
      });

      const totalFinal = Number(response.data?.totals?.total_final || 0);
      setSuccessMsg(`Recipe ${response.data?.recipeId || ''} emitido para ${linkedPatient?.name}, despachado automáticamente a farmacia y vigente hasta ${new Date(response.data?.recipeExpiresAt || Date.now()).toLocaleDateString('es-ES')}. Total estimado: ${formatCurrency(totalFinal)}.`);
      setCart([]);
      setLinkedPatient(null);
      setActiveTab('agenda');

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload;
      const errMsg = apiError.response?.data?.error || 'No se pudo emitir la receta.';
      const details = apiError.response?.data?.details;
      alert(details ? `${errMsg}\nDetalles: ${details}` : errMsg);
    }
  };

  const availablePharmacies = useMemo(() => {
    const pharmacies = new Set<string>();
    inventoryPreview.forEach(prod => {
      pharmacies.add(process.env.NEXT_PUBLIC_FARMACIA_NAME || 'Farmacia');
    });
    return Array.from(pharmacies);
  }, [inventoryPreview]);

  const filteredCatalog = useMemo(() => {
    let result = [...catalogResults];
    
    if (catalogPharmacyFilter !== 'all') {
      result = result.filter(prod => {
        const pName = process.env.NEXT_PUBLIC_FARMACIA_NAME || 'Farmacia';
        return pName === catalogPharmacyFilter;
      });
    }

    if (catalogSortOrder === 'asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (catalogSortOrder === 'desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [catalogResults, catalogSortOrder, catalogPharmacyFilter]);

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
        layout="horizontal"
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
              { id: 'help', name: 'Ayuda', icon: HelpCircle },
              { id: 'profile', name: 'Perfil', icon: Users },
            ]}
            activeId={activeTab}
            onNavigate={(id) => {
              if (id === 'reception') {
                setPatientViewMode('list');
              }
              setActiveTab(id as 'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile' | 'help');
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
            navTextWhite
          />
        }
        header={({ onMenuClick }) => (
          <AppHeader
            onMenuClick={onMenuClick}
            statusLabel=""
            showNotifications={false}
            className="!bg-[#179150] border-[#148047]"
            navTextWhite
            showProfileName={false}
            showProfileAvatar={false}
            brand={{ icon: Activity, title: 'Médico', subtitle: 'Médico' }}
            items={[
              { id: 'agenda', name: 'Panel', icon: Calendar },
              { id: 'reception', name: 'Pacientes', icon: Users },
              { id: 'prescription', name: 'Generar récipe', icon: FileText },
              { id: 'commissions', name: 'Comisiones', icon: TrendingUp },
              { id: 'help', name: 'Ayuda', icon: HelpCircle },
              { id: 'profile', name: 'Perfil', icon: Users },
            ]}
            activeId={activeTab}
            onNavigate={(id) => {
              if (id === 'reception') {
                setPatientViewMode('list');
              }
              setActiveTab(id as 'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile' | 'help');
            }}
            onLogout={onLogout}
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
                        <div key={patient.patientId} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 first:pt-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{patient.name}</p>
                              <span className="text-[9px] font-mono text-surface-500 bg-surface-950 px-1.5 py-0.5 rounded border border-surface-850">
                                ID: {patient.patientId}
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
                      {patients
                        .filter(
                          (patient) =>
                            patient.allergies &&
                            !patient.allergies.toLowerCase().includes('ningun') &&
                            patient.allergies.trim() !== ''
                        )
                        .map((patient) => (
                        <div key={patient.patientId} className="p-3 bg-surface-950/40 border border-surface-850 rounded-xl space-y-1">
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
                      className="doctor-qr-scan-link w-full text-center text-xs font-semibold pt-2 border-t border-surface-850 mt-4 flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <span>Escanear código qr</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="zenith-section-title">Productos en farmacias aliadas</h3>
                    <p className="text-xs text-surface-400">Listado de productos internos de farmacia disponibles para la agenda clínica del día.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inventoryPreview.slice(0, 4).map((prod) => (
                      <div key={prod.id} className="overflow-hidden bg-surface-950/50 border border-surface-850 rounded-2xl p-4 space-y-3">
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="block min-w-0 flex-1 max-w-full text-xs text-surface-200 leading-snug break-words line-clamp-3 font-normal">
                              <span className="font-normal text-surface-200">Principio activo: {prod.category ? prod.category.charAt(0).toUpperCase() + prod.category.slice(1).toLowerCase() : ''}</span><br />
                              <span className="font-normal text-surface-200">{prod.name}</span>
                            </span>
                          </div>
                          <span className="w-fit max-w-full shrink-0 truncate whitespace-nowrap text-[9px] text-surface-400 bg-surface-800 px-2 py-0.5 rounded-full uppercase tracking-[0.16em]">
                            {process.env.NEXT_PUBLIC_FARMACIA_NAME || 'Farmacia'}
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
                            {patients.filter((p) => p.allergies && !p.allergies.toLowerCase().includes('ningun') && p.allergies.trim() !== '').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o ID interno"
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
                                    key={patient.patientId}
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
                                          <span className="text-[10px] text-surface-500 font-mono mt-1 block">ID: {patient.patientId}</span>
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
                                      {patient.allergies && !patient.allergies.toLowerCase().includes('ningun') && patient.allergies.trim() !== '' && (
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
                                key={patient.patientId}
                                title={patient.name}
                                subtitle={`ID: ${patient.patientId}`}
                                onClick={() => openPatientForm(patient)}
                                badge={
                                  patient.allergies && !patient.allergies.toLowerCase().includes('ningun') && patient.allergies.trim() !== '' ? (
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

                    {patientSaveMsg && (
                      <div className="p-4 bg-secondary-500/15 border border-secondary-500/30 rounded-2xl flex items-center gap-3 text-secondary-400 text-xs">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>{patientSaveMsg}</span>
                      </div>
                    )}

                    <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md">
                      <form onSubmit={handleSavePatient} className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="zenith-section-title">{'Datos clínicos'}</h3>
                            <p className="text-xs text-surface-400">El expediente permanece en solo lectura hasta que confirmes la edición.</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {isEditingPatientRecord ? (
                              <>
                                <button type="button" onClick={handleCancelPatientEdit} className="px-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-surface-300 hover:text-white text-xs font-bold transition-all cursor-pointer">Cancelar edición</button>
                                <button type="submit" className="px-4 py-2.5 bg-[var(--portal-doctor-btn-bg)] hover:bg-[var(--portal-doctor-btn-hover)] text-[var(--portal-doctor-btn-fg)] rounded-xl text-xs font-bold transition-all cursor-pointer">Confirmar cambios</button>
                              </>
                            ) : (
                              <button type="button" onClick={handleStartPatientEdit} className="px-4 py-2.5 bg-[var(--portal-doctor-btn-bg)] hover:bg-[var(--portal-doctor-btn-hover)] text-[var(--portal-doctor-btn-fg)] rounded-xl text-xs font-bold transition-all cursor-pointer">Editar expediente</button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5"><label className="zenith-field-label">Nombre completo</label><input type="text" value={patientForm.name} readOnly className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${doctorProfileFieldReadonly}`} /></div>
                          <div className="space-y-1.5"><label className="zenith-field-label">ID interno</label><input type="text" value={patientForm.patientId} readOnly placeholder="Ej: patient_sofia_peralta" className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none uppercase ${doctorProfileFieldReadonly}`} /></div>
                          <div className="space-y-1.5"><label className="zenith-field-label">Edad</label><input type="number" min={0} value={patientForm.age || ''} onChange={(e) => setPatientForm({ ...patientForm, age: Number(e.target.value) })} readOnly={!isEditingPatientRecord} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingPatientRecord ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div>
                          <div className="space-y-1.5"><label className="zenith-field-label">Género</label>{isEditingPatientRecord ? (<select value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer ${doctorProfileFieldEditing}`}><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option></select>) : (<input type="text" value={patientForm.gender} readOnly className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${doctorProfileFieldReadonly}`} />)}</div>
                          <div className="space-y-1.5"><label className="zenith-field-label">Grupo sanguíneo</label>{isEditingPatientRecord ? (<select value={patientForm.bloodType} onChange={(e) => setPatientForm({ ...patientForm, bloodType: e.target.value })} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer ${doctorProfileFieldEditing}`}><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option><option value="Sin especificar">Sin especificar</option></select>) : (<input type="text" value={patientForm.bloodType} readOnly className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${doctorProfileFieldReadonly}`} />)}</div>
                          <div className="space-y-1.5"><label className="zenith-field-label">Teléfono móvil</label><input type="tel" value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: formatPhoneNumber(e.target.value) })} readOnly={!isEditingPatientRecord} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingPatientRecord ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div>
                          <div className="space-y-1.5 md:col-span-2"><label className="zenith-field-label">Condición / diagnóstico de control</label><input type="text" value={patientForm.condition} onChange={(e) => setPatientForm({ ...patientForm, condition: e.target.value })} readOnly={!isEditingPatientRecord} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingPatientRecord ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div>
                          <div className="space-y-1.5 md:col-span-2"><label className="zenith-field-label">Alergias</label><input type="text" value={patientForm.allergies} onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })} readOnly={!isEditingPatientRecord} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingPatientRecord ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div>
                          <div className="space-y-1.5 md:col-span-2"><label className="zenith-field-label">Tratamientos activos (separados por coma)</label><input type="text" value={medicationsInput} onChange={(e) => setMedicationsInput(e.target.value)} readOnly={!isEditingPatientRecord} placeholder="Ej: Ramipril 5mg, Aspirina 100mg" className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingPatientRecord ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4 border-t border-surface-850">
                          <button type="button" onClick={handleBackToPatientList} className="px-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-surface-400 hover:text-white text-xs font-bold transition-all cursor-pointer">Volver</button>
                          <div className="flex flex-col sm:flex-row gap-3">
                            {linkedPatient && (<button type="button" onClick={() => setActiveTab('prescription')} className="doctor-generate-recipe-btn px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border">Generar Récipe</button>)}
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
                
                {linkedPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      setLinkedPatient(null);
                      setCart([]);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Cancelar récipe
                  </button>
                )}

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
                          placeholder="Buscar por nombre o principio activo"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white placeholder-surface-750 focus:outline-none focus:border-secondary-500"
                        />
                      </div>

                      {/* Catalog Filters */}
                      <div className="flex gap-2">
                        <select
                          value={catalogSortOrder}
                          onChange={(e) => setCatalogSortOrder(e.target.value as 'default' | 'asc' | 'desc')}
                          className="flex-1 bg-surface-950 border border-surface-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary-500 cursor-pointer"
                        >
                          <option value="default">Ordenar por...</option>
                          <option value="desc">Mayor a Menor Precio</option>
                          <option value="asc">Menor a Mayor Precio</option>
                        </select>
                        <select
                          value={catalogPharmacyFilter}
                          onChange={(e) => setCatalogPharmacyFilter(e.target.value)}
                          className="flex-1 bg-surface-950 border border-surface-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary-500 cursor-pointer"
                        >
                          <option value="all">Todas las farmacias</option>
                          {availablePharmacies.map(pharmacy => (
                            <option key={pharmacy} value={pharmacy}>{pharmacy}</option>
                          ))}
                        </select>
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
                                  <span className="block min-w-0 flex-1 max-w-full text-xs text-surface-200 leading-snug break-words line-clamp-3 font-normal">
                                    <span className="font-normal text-surface-200">Principio activo: {prod.category ? prod.category.charAt(0).toUpperCase() + prod.category.slice(1).toLowerCase() : ''}</span><br />
                                    <span className="font-normal text-surface-200">{prod.name}</span>
                                    {prod.pharmacyName && (
                                      <span className="block text-[10px] text-surface-400 mt-0.5">Farmacia: {prod.pharmacyName}</span>
                                    )}
                                  </span>
                                </div>
                                <p className="text-[10px] text-surface-500 break-words line-clamp-2">{prod.description}</p>
                              </div>

                              <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                                <div className="text-right">
                                  <span className="block text-xs font-bold text-white">{formatCurrency(prod.price)}</span>
                                  <span className={`block text-[10px] ${prod.stock < 20 ? 'text-primary-500 font-medium' : 'text-surface-400'}`}>Stock: {prod.stock} u.</span>
                                </div>
                                {(() => {
                                  const cartItem = cart.find(i => i.product.id === prod.id);
                                  const isSelected = !!cartItem;
                                  
                                  if (!isSelected) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => addToCart(prod)}
                                        className="p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 bg-secondary-500/10 hover:bg-secondary-500 border-secondary-500/20 hover:border-secondary-550 text-secondary-450 hover:text-white"
                                      >
                                        <Plus className="h-4.5 w-4.5" />
                                      </button>
                                    );
                                  }

                                  return (
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(prod.id)}
                                      className="group h-8 w-8 rounded-full bg-secondary-500 hover:bg-error-500 flex items-center justify-center text-white shadow-lg shrink-0 transition-colors cursor-pointer"
                                      title="Remover medicamento"
                                    >
                                      <Check className="h-4.5 w-4.5 group-hover:hidden" />
                                      <X className="h-4.5 w-4.5 hidden group-hover:block" />
                                    </button>
                                  );
                                })()}
                              </div>
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
                              {cart.map((item) => (
                                <div key={item.product.id} className={`pt-4 first:pt-0 space-y-3`}>
                                  
                                  {/* Item Header */}
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <h4 className="font-bold text-sm text-white">{item.product.name}</h4>
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

                                  </div>
                              ))}
                            </div>

                            {/* Global Discount Selector */}
                            <div className="pt-4 space-y-2">
                              <span className="zenith-field-label flex items-center gap-1">
                                <Percent className="h-3 w-3 text-secondary-455" />
                                <span>Descuento Exclusivo</span>
                              </span>
                              
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {[0, 10, 15, 20, 30].map((disc) => (
                                  <button
                                    key={disc}
                                    type="button"
                                    onClick={() => setGlobalDiscount(disc)}
                                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                      globalDiscount === disc
                                        ? 'bg-secondary-500 border-secondary-550 text-white'
                                        : 'bg-surface-950/60 border-surface-800 text-surface-400 hover:text-white'
                                    }`}
                                  >
                                    {disc}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Cart totals preview */}
                            <div className="border-t border-surface-850 pt-4 space-y-3">
                              <div className="text-2xs text-surface-400 font-bold">
                                <span>Estimación Subtotal Farmacia</span>
                              </div>
                              <div className="space-y-1.5 pb-2 border-b border-surface-850/50">
                                {cart.map((item, idx) => {
                                  const quantity = item.quantity || 1;
                                  return (
                                    <div key={`subtotal-${item.product.id}-${idx}`} className="flex justify-between text-[10px] text-surface-300">
                                      <span className="truncate pr-2">{item.product.name}</span>
                                      <span className="font-mono shrink-0">{formatCurrency(item.product.price * quantity)} Bs</span>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="flex justify-between text-2xs text-secondary-400 font-semibold pt-1">
                                <span>Ahorro para el Paciente</span>
                                <span>
                                  {(() => {
                                    const totalOriginal = cart.reduce((sum, item) => sum + (item.product.price * (item.quantity || 1)), 0);
                                    const totalDesc = cart.reduce((sum, item) => sum + ((item.product.price * (item.quantity || 1)) * (globalDiscount / 100)), 0);
                                    const pct = totalOriginal > 0 ? Math.round((totalDesc / totalOriginal) * 100) : 0;
                                    return `${pct}% (${formatCurrency(totalDesc)} Bs)`;
                                  })()}
                                </span>
                              </div>

                              <div className="flex justify-between text-xs text-white font-bold pt-1">
                                <span>Total a pagar</span>
                                <span className="font-mono text-secondary-400">
                                  {(() => {
                                    const totalPay = cart.reduce((sum, item) => sum + ((item.product.price * (item.quantity || 1)) * (1 - globalDiscount / 100)), 0);
                                    return `${formatCurrency(totalPay)} Bs`;
                                  })()}
                                </span>
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
              const ledgerEntries = commissionSummary?.transactions || [];
              const totalAccredited = Number(commissionSummary?.availableBalance || 0);
              const totalPending = 0;

              return (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Commission Ledger */}
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="zenith-section-title">Libro de Comisiones</h3>
                          <p className="text-xs text-surface-400">Comisiones liquidadas automáticamente por pagos confirmados.</p>
                        </div>
                        <span className="text-[10px] bg-secondary-500/20 text-white border border-secondary-400/40 px-2 py-0.5 rounded font-bold shadow-sm">Tasa de comisión: {commissionSummary?.commissionRatePct ?? commissionRate}%</span>
                      </div>

                      {commissionError ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                          {commissionError}
                        </div>
                      ) : null}

                      {commissionLoading ? (
                        <div className="rounded-xl border border-surface-800 bg-surface-950/60 px-3 py-4 text-xs text-surface-400">
                          Consultando comisiones liquidadas...
                        </div>
                      ) : null}

                      {/* Bar-chart style visualisation per entry */}
                      <div className="space-y-3">
                        {!commissionLoading && ledgerEntries.length === 0 ? (
                          <div className="rounded-xl border border-surface-800 bg-surface-950/60 px-3 py-4 text-xs text-surface-400">
                            Todavía no hay pagos confirmados que hayan generado comisión para este médico.
                          </div>
                        ) : null}
                        {ledgerEntries.map((entry, index) => (
                          <div key={`${entry.recipeId}-${index}`} className="space-y-1.5">
                            <div className="flex justify-between items-start text-xs">
                              <div className="min-w-0">
                                <span className="font-semibold text-surface-200 block truncate">
                                  {entry.medications || `Recipe ${entry.recipeId}`}
                                </span>
                                <span className="text-[10px] text-surface-500 truncate block">
                                  {entry.pharmacy_name || `Orden ${entry.orderId}`} • Liquidada {new Date(entry.settledAt).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                              <div className="text-right shrink-0 pl-3">
                                <span className="font-bold text-sm text-black">
                                  +{formatCurrency(entry.commissionAmount)}
                                </span>
                                <span className="text-[9px] font-bold block text-secondary-500/70">
                                  Acreditado
                                </span>
                              </div>
                            </div>
                            {/* Sale proportion bar */}
                            <div className="h-1 w-full bg-surface-850 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#179150]"
                                style={{ width: `${Math.min((entry.amount / 25) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals row */}
                      <div className="border-t border-surface-850 pt-4 flex justify-between items-center text-xs">
                        <span className="text-surface-500 font-semibold">Total Período Actual ({commissionSummary?.currentPeriod || new Date().toLocaleString('es-ES', { month: 'short', year: 'numeric' }).replace('.', '').replace(/^\w/, c => c.toUpperCase())})</span>
                        <span className="font-bold text-black text-sm">{formatCurrency(totalAccredited + totalPending)}</span>
                      </div>
                    </div>

                    {/* Signed Recipe Log */}
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div>
                        <h3 className="zenith-section-title">Historial de Récipes Firmados</h3>
                        <p className="text-xs text-surface-400">Historial de recetas digitales emitidas y firmadas electrónicamente.</p>
                      </div>

                      {recipeLogError ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                          {recipeLogError}
                        </div>
                      ) : null}

                      {recipeLogLoading ? (
                        <div className="rounded-xl border border-surface-800 bg-surface-950/60 px-3 py-4 text-xs text-surface-400">
                          Consultando recipes emitidos y despachados a farmacia...
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        {!recipeLogLoading && doctorRecipeLog.length === 0 ? (
                          <div className="py-3 text-xs text-surface-500">Todavía no hay recipes emitidos por este médico.</div>
                        ) : null}
                        {doctorRecipeLog.map((rec) => (
                          <div key={rec.recipeId} className="doctor-recipe-log-item flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <p className="doctor-recipe-log-item__name text-sm">{rec.patientName || rec.patientId}</p>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {rec.items.map((item, idx) => (
                                  <span key={idx} className="doctor-recipe-log-item__med text-[9px] px-1.5 py-0.5 rounded">{item.nombre} ({item.remaining_quantity ?? 0}/{item.cantidad_prescrita ?? 0}) • {item.pharmacy_name || process.env.NEXT_PUBLIC_FARMACIA_NAME || 'Farmacia'}</span>
                                ))}
                              </div>
                              <p className="text-[10px] text-black dark:text-surface-300 flex items-center gap-1 flex-wrap">
                                <span>Emitido {new Date(rec.createdAt).toLocaleDateString('es-ES')}</span>
                                <span>•</span>
                                <span>Caduca {new Date(rec.recipeExpiresAt).toLocaleDateString('es-ES')}</span>
                              </p>
                            </div>

                          </div>
                        ))}
                      </div>


                    </div>

                  </div>

                </div>
              );
            })()}

            {/* VIEW TAB 5: PROFILE CONFIGURATION (Pantalla M.4) */}
            {activeTab === 'help' && <DoctorHelpView />}

            {activeTab === 'profile' && (
              <>
              <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
                {profileSaveMsg && (<div className="p-4 bg-secondary-500/10 border border-secondary-500/25 rounded-2xl flex items-center gap-2.5 text-secondary-400 text-xs animate-in fade-in slide-in-from-top-2 duration-300"><CheckCircle2 className="h-4.5 w-4.5 shrink-0" /><span>{profileSaveMsg}</span></div>)}
                {profileErrorMsg && (<div className="p-4 bg-danger-500/10 border border-red-500 rounded-2xl flex items-center gap-2.5 text-danger-500 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300"><AlertCircle className="h-4.5 w-4.5 shrink-0" /><span>{profileErrorMsg}</span></div>)}
                <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
                  <div className="border-b border-surface-850 pb-4">
                    <div>
                      <h3 className="zenith-section-title text-xs">Perfil profesional</h3>
                      <p className="text-xs text-surface-400">Los datos permanecen en solo lectura hasta que confirmes la edición.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-surface-950/60 border border-surface-850 rounded-2xl p-4 space-y-3"><div className="flex items-center gap-2.5"><div className="h-10 w-10 rounded-xl bg-secondary-500/10 flex items-center justify-center shrink-0"><BadgeCheck className="h-5 w-5 text-secondary-400" /></div><div><p className="zenith-field-label">Nombre Legal</p><p className="text-sm font-semibold text-white">{doctorName}</p></div></div><div className="divide-y divide-surface-850 text-xs"><div className="flex justify-between py-2"><span className="text-surface-500">ID de registro</span><span className="text-surface-200 font-mono text-[10px]">{profileRegistryId}</span></div><div className="flex justify-between py-2"><span className="text-surface-500">Correo Institucional</span><span className="text-surface-200 font-mono text-[10px]">{doctorEmail}</span></div><div className="space-y-1.5 py-2"><label className="text-surface-500 block">Teléfono Profesional</label><input type="text" value={profilePhone} onChange={e => setProfilePhone(formatPhoneNumber(e.target.value))} readOnly={!isEditingDoctorProfile} className={`w-full border rounded-xl px-3.5 py-2.5 text-[10px] font-mono focus:outline-none ${isEditingDoctorProfile ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div></div></div><div className="bg-surface-950/60 border border-surface-850 rounded-2xl p-4 space-y-3"><div className="flex items-center gap-2.5"><div className="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0"><Award className="h-5 w-5 text-primary-400" /></div><div><p className="zenith-field-label">Registro Profesional</p><p className="text-sm font-semibold text-white">{doctorMpps}</p></div></div><div className="divide-y divide-surface-850 text-xs"><div className="flex justify-between py-2"><span className="text-surface-500">Especialidad Primaria</span><span className="text-surface-200 font-semibold">{doctorSpecialty}</span></div><div className="flex justify-between py-2"><span className="text-surface-500">Colegio de Médicos</span><span className="text-surface-200 font-semibold">{doctorMedicalCollege}</span></div><div className="flex justify-between py-2"><span className="text-surface-500">Institución Certificadora</span><span className="text-surface-200 font-semibold">MPPS Venezuela</span></div><div className="flex justify-between py-2"><span className="text-surface-500">Estado de Colegiatura</span><span className="inline-flex items-center gap-1 text-secondary-400 font-bold text-[10px]"><ShieldCheck className="h-3 w-3" /> Activo / Vigente</span></div><div className="flex justify-between py-2"><span className="text-surface-500">Registro sanitario especial</span><span className="text-surface-200 font-mono text-[10px]">{doctorSpecialSanitaryRegistration || 'No aplica'}</span></div></div></div></div>
                  </div>
                  <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-5"><h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">Consultorio / Dirección Profesional</h3><div className="grid grid-cols-1 gap-4"><div className="space-y-1.5"><label className="zenith-field-label">Dirección (Av., Urb., Centro Médico, Consultorio)</label><input type="text" value={consultorioAddress} onChange={e => setConsultorioAddress(e.target.value)} readOnly={!isEditingDoctorProfile} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingDoctorProfile ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-1.5"><label className="zenith-field-label">Estado</label>{isEditingDoctorProfile ? (<VenezuelanStateSelect value={consultorioState} onChange={setConsultorioState} accent="secondary" className={doctorProfileFieldEditing} />) : (<input type="text" value={consultorioState} readOnly className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-250 focus:outline-none" />)}</div><div className="space-y-1.5"><label className="zenith-field-label">Municipio</label><input type="text" value={consultorioMunicipio} onChange={e => setConsultorioMunicipio(e.target.value)} readOnly={!isEditingDoctorProfile} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingDoctorProfile ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div></div></div></div>
                  <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-5"><h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">Datos Bancarios para Recepción de Comisiones</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1.5"><label className="zenith-field-label">Titular de la Cuenta</label><input type="text" value={bankHolder} onChange={e => setBankHolder(e.target.value)} readOnly={!isEditingDoctorProfile} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingDoctorProfile ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div><div className="space-y-1.5"><label className="zenith-field-label">ID del titular</label><div className="flex gap-2">{isEditingDoctorProfile ? (<select value={bankHolderId.split('-')[0] || 'V'} onChange={e => { const parts = bankHolderId.split('-'); const num = parts.length > 1 ? parts[1] : bankHolderId; setBankHolderId(`${e.target.value}-${num}`); }} className={`w-20 border rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer ${doctorProfileFieldEditing}`}><option value="V">V</option><option value="E">E</option><option value="J">J</option><option value="P">P</option><option value="G">G</option></select>) : (<input type="text" value={bankHolderId.split('-')[0] || 'V'} readOnly className={`w-20 border rounded-xl px-3 py-2.5 text-xs font-mono text-center focus:outline-none ${doctorProfileFieldReadonly}`} />)}<input type="text" value={bankHolderId.includes('-') ? bankHolderId.substring(bankHolderId.indexOf('-') + 1) : bankHolderId} onChange={e => { const prefix = bankHolderId.includes('-') ? bankHolderId.split('-')[0] : 'V'; setBankHolderId(`${prefix}-${e.target.value}`); }} readOnly={!isEditingDoctorProfile} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none ${isEditingDoctorProfile ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div></div><div className="space-y-1.5"><label className="zenith-field-label">Entidad Bancaria</label>{isEditingDoctorProfile ? (<select value={bankEntity} onChange={e => setBankEntity(e.target.value)} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer ${doctorProfileFieldEditing}`}><option value="">Seleccione un banco...</option>{VENEZUELAN_BANKS.map(banco => (<option key={banco} value={banco}>{banco}</option>))}</select>) : (<input type="text" value={bankEntity} readOnly className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-250 focus:outline-none" />)}</div><div className="space-y-1.5"><label className="zenith-field-label">Tipo de Cuenta</label>{isEditingDoctorProfile ? (<select value={bankAccountType} onChange={e => setBankAccountType(e.target.value as 'Corriente' | 'Ahorro')} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${doctorProfileFieldEditing}`}><option value="Corriente">Corriente</option><option value="Ahorro">Ahorro</option></select>) : (<input type="text" value={bankAccountType} readOnly className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-250 focus:outline-none" />)}</div><div className="space-y-1.5 md:col-span-2"><label className="zenith-field-label">Número de Cuenta Bancaria</label><input type="text" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} readOnly={!isEditingDoctorProfile} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none ${isEditingDoctorProfile ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div><div className="space-y-1.5"><label className="zenith-field-label">Teléfono Pago Móvil</label><input type="text" value={bankMobilePhone} onChange={e => setBankMobilePhone(formatPhoneNumber(e.target.value))} readOnly={!isEditingDoctorProfile} className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none ${isEditingDoctorProfile ? doctorProfileFieldEditing : doctorProfileFieldReadonly}`} /></div><div className="space-y-1.5">
              <label className="zenith-field-label">Frecuencia de Acreditación</label>
              <input type="text" value={"Mensual (último día hábil)"} readOnly className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-250 focus:outline-none" />
            </div>
            </div>
            <div className="p-3 bg-primary-500/5 border border-primary-500/15 rounded-xl flex items-start gap-2 text-[10px] text-primary-400">
              <DollarSign className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Las fechas de pago son las establecidas en la parte de la administración.</span>
            </div>
                </div>
              </div>
                <div className="fixed z-30 flex flex-col items-end gap-2 bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] pointer-events-none">
                  <div className="pointer-events-auto flex flex-col items-end gap-2">
                  {isEditingDoctorProfile ? (
                    <>
                      <button type="button" onClick={handleConfirmDoctorProfileEdit} className="min-w-[220px] px-4 py-2.5 bg-[#179150] hover:bg-[#148047] !text-white rounded-xl text-[15px] font-bold shadow-lg shadow-black/25 transition-all">Confirmar cambios</button>
                      <button type="button" onClick={handleCancelDoctorProfileEdit} className="min-w-[220px] px-4 py-2.5 bg-white dark:bg-surface-900 border border-[#179150]/35 dark:border-surface-700 text-[#179150] dark:!text-white hover:bg-[#179150]/10 dark:hover:bg-surface-800 hover:text-[#148047] dark:hover:!text-white rounded-xl text-[15px] font-bold shadow-lg shadow-black/25 transition-all">Cancelar</button>
                    </>
                  ) : (
                    <button type="button" onClick={handleStartDoctorProfileEdit} className="min-w-[220px] px-4 py-2.5 bg-[#179150] hover:bg-[#148047] !text-white rounded-xl text-[15px] font-bold shadow-lg shadow-black/25 transition-all">Editar perfil</button>
                  )}
                  </div>
                </div>
              </>
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
                  <label className="zenith-field-label">ID interno del paciente</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Ej: patient_sofia_peralta"
                      value={manualPatientIdInput}
                      onChange={(e) => setManualPatientIdInput(e.target.value)}
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

              </form>
            </>
          )}
        </ModalBody>
      </Modal>

      </AppShell>
    </>
  );
}
