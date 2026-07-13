'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  PlusCircle, 
  LogOut, 
  ShieldAlert, 
  Check,
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
} from 'lucide-react';
import { AppShell, AppSidebar, AppHeader } from './layout';
// QR credential removed for doctor portal
import VenezuelanStateSelect from './VenezuelanStateSelect';
import { formatCurrency } from '../lib/currency';
import { Button, Modal, ModalBody, ListCard } from './ui';
import apiClient from '../lib/api';
import { socket } from '../lib/socket';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  DOCTOR_LINKED_PATIENT_SEEDS,
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
  onLogout: () => void;
}

interface MedicalProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  source: 'farmacia' | 'externo';
  benefitPct?: number;
}

interface PrescriptionCatalogApiItem {
  id_producto: string;
  nombre: string;
  principio_activo: string;
  presentacion: string;
  laboratorio: string;
  sku: string;
  stock: number;
  precio_base: number;
  beneficio_pct: number;
  precio_con_beneficio: number;
}

interface CartItem {
  product: MedicalProduct;
  posology: string;
  discount: number;
}

interface DoctorCommissionTransaction {
  orderId: string;
  recipeId: string;
  amount: number;
  commissionAmount: number;
  settledAt: string;
}

interface DoctorCommissionSummary {
  doctorId: string;
  currency: string;
  commissionRatePct: number;
  availableBalance: number;
  transactions: DoctorCommissionTransaction[];
}

interface DoctorRecipeLogItem {
  id_producto: string;
  nombre: string;
  cantidad_prescrita?: number;
  remaining_quantity?: number;
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
 * Normaliza el texto de busqueda de medicamentos antes de consultar el catalogo.
 * @param {string} value - Texto ingresado por el medico.
 * @returns {string} Texto listo para consulta.
 */
const normalizePrescriptionSearch = (value: string) => value.trim();

/**
 * Adapta un item del catalogo backend al modelo visual del portal medico.
 * @param {PrescriptionCatalogApiItem} item - Item devuelto por el backend.
 * @returns {MedicalProduct} Producto adaptado para la UI.
 */
const mapCatalogItemToProduct = (item: PrescriptionCatalogApiItem): MedicalProduct => ({
  id: item.id_producto,
  name: item.nombre,
  sku: item.sku,
  category: item.principio_activo || item.laboratorio || 'Medicamento',
  price: Number(item.precio_con_beneficio ?? item.precio_base ?? 0),
  stock: Number(item.stock ?? 0),
  description: [item.presentacion, item.laboratorio].filter(Boolean).join(' | '),
  source: 'farmacia',
  benefitPct: Number(item.beneficio_pct ?? 0),
});

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
export default function DoctorView({ doctorName, doctorEmail, doctorId, onLogout }: DoctorViewProps) {
  // Navigation active tab: 'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile'
  const [activeTab, setActiveTab] = useState<'agenda' | 'reception' | 'prescription' | 'commissions' | 'profile'>('agenda');

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
  const [consultorioAddress, setConsultorioAddress] = useState(DOCTOR_PROFILE_DEFAULTS.consultorioAddress);
  const [consultorioState, setConsultorioState] = useState(DOCTOR_PROFILE_DEFAULTS.consultorioState);
  const [consultorioMunicipio, setConsultorioMunicipio] = useState(DOCTOR_PROFILE_DEFAULTS.consultorioMunicipio);
  const [profileSaveMsg, setProfileSaveMsg] = useState('');

  // QR credential removed for doctor portal per requested change

  // Dynamic commission rate state
  const [commissionRate, setCommissionRate] = useState<number>(8);
  const [commissionSummary, setCommissionSummary] = useState<DoctorCommissionSummary | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commissionError, setCommissionError] = useState('');
  const [doctorRecipeLog, setDoctorRecipeLog] = useState<DoctorRecipeLogRecord[]>([]);
  const [recipeLogLoading, setRecipeLogLoading] = useState(false);
  const [recipeLogError, setRecipeLogError] = useState('');
  
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

  const [patients, setPatients] = useState<LinkedPatient[]>(DOCTOR_LINKED_PATIENT_SEEDS);
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
  const [isWaitingConsent, setIsWaitingConsent] = useState(false);
  const [pendingConsentPatient, setPendingConsentPatient] = useState<LinkedPatient | null>(null);

  // WebSockets: Escuchar respuesta del paciente usando `patientId` interno
  useEffect(() => {
    const identify = () => {
      socket.emit('identifyUser', { userId: DOCTOR_ID, role: 'doctor', name: DOCTOR_NAME });
    };

    socket.connect();

    if (socket.connected) identify();
    socket.on('connect', identify);

    const handleConsentResult = (data: any) => {
      setIsWaitingConsent(false);
      setWaitingConsent(false);

      if (data.success) {
        const linkedPatientId = data.result?.vinculacion?.id_paciente?.toString()?.toLowerCase();

        let targetPatient = patients.find((p) => p.systemId === linkedPatientId);

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

          setPatients((prev) => [...prev, targetPatient as LinkedPatient]);
        }

        setIsScannerModalOpen(false);
        openPatientForm(targetPatient as LinkedPatient);
      } else {
        alert(data.message || 'El paciente deneg? la solicitud de vinculaci?n.');
      }

      setPendingConsentPatient(null);
    };

    const handleConsentRequestSent = ({ patientName }: { patientName: string }) => {
      setPendingConsentPatient((prev) => prev ? { ...prev, name: patientName } : null);
    };

    socket.on('consentResult', handleConsentResult);
    socket.on('consentRequestSent', handleConsentRequestSent);

    return () => {
      socket.off('connect', identify);
      socket.off('consentResult', handleConsentResult);
      socket.off('consentRequestSent', handleConsentRequestSent);
      socket.disconnect();
    };
  }, [DOCTOR_ID, DOCTOR_NAME, patients]);

  // Reception / QR scan states (M.1)
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [manualPatientIdInput, setManualPatientIdInput] = useState('');
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
              patientId: response.data.patientId // El backend desencript? el patientId interno desde el QR
            });
          }
        } catch (error: any) {
          // Fallo por QR Caducado o Nonce duplicado
          setScannerErrorMsg(error.response?.data?.error || 'Error de seguridad: QR caducado o invalido.');
        }
      }, () => {
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
        p.patientId.toLowerCase().includes(query)
    );
  }, [patients, patientListSearch]);



  // Prescription states (M.2)
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [inventoryPreview, setInventoryPreview] = useState<MedicalProduct[]>([]);
  const [catalogResults, setCatalogResults] = useState<MedicalProduct[]>([]);

  useEffect(() => {
    let cancelled = false;

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
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
        if (!cancelled) {
          setCommissionError(
            error?.response?.data?.error ||
            error?.response?.data?.details ||
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
        }
      } catch (error: any) {
        if (!cancelled) {
          setRecipeLogError(
            error?.response?.data?.error ||
            error?.response?.data?.details ||
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
    if (!patientForm.patientId) return;
    if (!confirm(`¿Eliminar el expediente de ${patientForm.name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setPatients((prev) => prev.filter((p) => p.patientId !== patientForm.patientId));
    if (linkedPatient?.patientId === patientForm.patientId) {
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
    if (!patientForm.name.trim() || !patientForm.phone.trim() || !patientForm.patientId.trim()) {
      alert('El nombre, el ID interno y el tel?fono del paciente son obligatorios.');
      return;
    }

    const medications = medicationsInput
      .split(',')
      .map((med) => med.trim())
      .filter(Boolean);

    // Only support updating existing patients from the doctor portal
    const updatedPatient: LinkedPatient = { ...patientForm, medications };
    const exists = patients.some((p) => p.patientId === updatedPatient.patientId);
    if (!exists) {
      alert('No está permitido crear pacientes desde el portal del médico. Busque o vincule un paciente existente.');
      return;
    }
    setPatients((prev) => prev.map((p) => (p.patientId === updatedPatient.patientId ? updatedPatient : p)));
    setLinkedPatient(updatedPatient);
    setPatientForm(updatedPatient);

    setPatientSaveMsg('Datos del paciente guardados correctamente.');
    setTimeout(() => setPatientSaveMsg(''), 3000);
  };

  /**
   * Inicia el flujo de vinculaci?n de un paciente buscando por su ID interno e informando al backend.
   * @param {string} patientQuery - El ID interno a buscar o vincular.
   */
  const linkPatientMock = (patientQuery: string) => {
    const normalized = patientQuery.toLowerCase().replace(/[\s\.-]/g, '');
    const found = patients.find((p) =>
      p.patientId.toLowerCase().replace(/[\s\.-]/g, '').includes(normalized)
    );

    const targetPatient = found || {
      systemId: `patient_${normalized || 'pendiente_bd'}`.replace(/[^a-z0-9_]/g, ''),
      patientId: patientQuery.trim().toUpperCase(),
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
      doctorId: DOCTOR_ID,
      doctorName: DOCTOR_NAME,
      patientId: targetPatient.systemId || targetPatient.patientId
    });
  };

  /**
   * Cancela la solicitud de vinculación de un paciente en curso.
   */
  const cancelConsentRequest = () => {
    if (pendingConsentPatient) {
      socket.emit('cancelConsentRequest', { 
        doctorId: DOCTOR_ID, 
        patientId: pendingConsentPatient.systemId || pendingConsentPatient.patientId 
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

    const sanitizedPatientId = normalizePatientLookup(manualPatientIdInput);

    if (!sanitizedPatientId) {
      alert('Por favor ingrese el ID interno del paciente.');
      return;
    }

    if (containsSuspiciousPattern(sanitizedPatientId)) {
      alert('El ID interno contiene un patr?n inv?lido.');
      return;
    }

    setScannerErrorMsg('');
    linkPatientMock(sanitizedPatientId);
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
    setCart([...cart, { product, posology: '', discount: product.benefitPct ?? 0 }]);
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
          cantidad: 1,
          aplicar_beneficio: Number(item.discount || 0) > 0,
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
    } catch (error: any) {
      alert(error?.response?.data?.error || error?.response?.data?.details || 'No se pudo emitir la receta.');
    } finally {
    }
  };

  const filteredCatalog = catalogResults;

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
                        <div key={patient.patientId} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 first:pt-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{patient.name}</p>
                              <span className="text-[9px] font-mono text-surface-500 bg-surface-950 px-1.5 py-0.5 rounded border border-surface-850">
                                {patient.patientId}
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
                    {inventoryPreview.slice(0, 4).map((prod) => (
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
                                          <span className="text-[10px] text-surface-500 font-mono mt-1 block">{patient.patientId}</span>
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
                                key={patient.patientId}
                                title={patient.name}
                                subtitle={patient.patientId}
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

                    {patientForm.patientId ? (
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
                            <label className="zenith-field-label">ID interno</label>
                            <input
                              type="text"
                              value={patientForm.patientId}
                              onChange={(e) => setPatientForm({ ...patientForm, patientId: e.target.value })}
                              disabled={true}
                                placeholder="Ej: patient_sofia_peralta"
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
                              {cart.map((item) => (
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
                        <span className="text-[10px] bg-secondary-500/20 text-white border border-secondary-400/40 px-2 py-0.5 rounded font-bold shadow-sm">Tasa backend: {commissionSummary?.commissionRatePct ?? commissionRate}%</span>
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
                                <span className="font-semibold text-surface-200 block truncate">Recipe {entry.recipeId}</span>
                                <span className="text-[10px] text-surface-500 truncate block">Orden {entry.orderId} • Liquidada {new Date(entry.settledAt).toLocaleDateString('es-ES')}</span>
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

                      <div className="divide-y divide-surface-850">
                        {!recipeLogLoading && doctorRecipeLog.length === 0 ? (
                          <div className="py-3 text-xs text-surface-500">Todavía no hay recipes emitidos por este médico.</div>
                        ) : null}
                        {doctorRecipeLog.map((rec) => (
                          <div key={rec.recipeId} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-white">{rec.patientName || rec.patientId}</span>
                                <span className="text-[9px] font-mono text-surface-500 bg-surface-950 border border-surface-850 px-1.5 py-0.2 rounded">{rec.recipeId}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {rec.items.map((item, idx) => (
                                  <span key={idx} className="text-[9px] bg-surface-800 text-surface-350 px-1.5 py-0.5 rounded font-medium">{item.nombre} ({item.remaining_quantity ?? 0}/{item.cantidad_prescrita ?? 0})</span>
                                ))}
                              </div>
                              <p className="text-[10px] text-surface-500 flex items-center gap-1 flex-wrap">
                                <span>{rec.pharmacyDispatch?.branchName || 'Farmacia Central'}</span>
                                <span>•</span>
                                <span>Emitido {new Date(rec.createdAt).toLocaleDateString('es-ES')}</span>
                                <span>•</span>
                                <span>Caduca {new Date(rec.recipeExpiresAt).toLocaleDateString('es-ES')}</span>
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-primary-500/10 text-primary-300 border-primary-500/20">
                                Clínico: {rec.clinicalStatus}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-secondary-500/10 text-secondary-300 border-secondary-500/20">
                                Comercial: {rec.commercialStatus}
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
                          <span className="text-surface-500">ID de registro</span>
                          <span className="text-surface-200 font-mono text-[10px]">{profileRegistryId}</span>
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
                      <label className="zenith-field-label">ID del titular</label>
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
