'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Activity, 
  Download, 
  MapPin, 
  Phone, 
  User,
  Heart,
  Clock,
  CheckCircle2,
  PackageCheck,
  Eye,
  X,
  Printer,
  FileCheck,
  FileSpreadsheet,
  Check,
  ArrowRight,
  ShieldCheck,
  Building,
  Info,
  DollarSign,
  Pill,
  Bell,
  TrendingUp,
  Sun,
  Sunset,
  Moon,
  History,
  Stethoscope,
  RefreshCw
} from 'lucide-react';
import { AppShell, AppSidebar, AppHeader } from './layout';
import {
  useCredentialQr,
  SidebarCredentialButton,
  CredentialQrModal,
} from './CredentialQr';
import VenezuelanStateSelect from './VenezuelanStateSelect';
import { formatCurrency } from '../lib/currency';
import { Button, ListCard, Modal, ModalBody } from './ui';
import apiClient from '../lib/api';
import { socket } from '../lib/socket';

/**
 * Propiedades de la vista de portal del Paciente.
 * @interface PatientViewProps
 * @property {string} patientName - Nombre del paciente.
 * @property {string} patientEmail - Correo del paciente.
 * @property {() => void} onLogout - Función para cerrar sesión.
 */
interface PatientViewProps {
  patientName: string;
  patientEmail: string;
  onLogout: () => void;
}

/**
 * Interfaz para representar un récipe/prescripción médica emitido a favor del paciente.
 * @interface Recipe
 */
interface Recipe {
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

const MOCK_RECIPES: Recipe[] = [
  {
    id: 'REC-2026-904',
    date: '06 Jun, 2026',
    expiryDate: '06 Dic, 2026',
    medication: 'Ramipril 5mg',
    dosage: '28 Comprimidos',
    instructions: 'Tomar 1 comprimido al día por la mañana en ayunas.',
    doctor: 'Dr. Alejandro Ríos',
    specialty: 'Cardiología',
    doctorLicense: 'MPPS 28.490 • CMDC-12.458',
    status: 'Activo'
  },
  {
    id: 'REC-2026-901',
    date: '01 Jun, 2026',
    expiryDate: '01 Dic, 2026',
    medication: 'Aspirina 100mg',
    dosage: '30 Comprimidos Gastrorresistentes',
    instructions: 'Tomar 1 comprimido diario durante el almuerzo.',
    doctor: 'Dr. Alejandro Ríos',
    specialty: 'Cardiología',
    doctorLicense: 'MPPS 28.490 • CMDC-12.458',
    status: 'Activo'
  },
  {
    id: 'REC-2026-712',
    date: '15 Abr, 2026',
    expiryDate: '15 May, 2026',
    medication: 'Amoxicilina 875mg + Ácido Clavulánico 125mg',
    dosage: '14 Comprimidos',
    instructions: 'Tomar 1 comprimido cada 12 horas con las comidas por 7 días.',
    doctor: 'Dr. Alejandro Ríos',
    specialty: 'Medicina General',
    doctorLicense: 'MPPS 28.490 • CMDC-12.458',
    status: 'Expirado'
  }
];

/**
 * Interfaz para representar un ítem de propuesta comercial dentro del módulo de checkout de farmacia.
 * @interface ProposalItem
 */
interface ProposalItem {
  id: string;
  medication: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

/**
 * Interfaz para el seguimiento de adherencia y control de tratamiento médico del paciente.
 * @interface TreatmentMedication
 */
interface TreatmentMedication {
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
 * Interfaz del registro de toma o log individual de dosis (Tracker).
 * @interface DoseLog
 */
interface DoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'Tomada' | 'Omitida' | 'Pendiente';
  date: string;
}

/**
 * Interfaz para las alertas proactivas automatizadas de la salud del paciente.
 * @interface TreatmentAlert
 */
interface TreatmentAlert {
  id: string;
  type: 'recordatorio' | 'control' | 'renovacion';
  title: string;
  message: string;
  date: string;
}

const MOCK_TREATMENTS: TreatmentMedication[] = [
  {
    id: 'trt-1',
    name: 'Ramipril 5mg',
    dosage: '1 comprimido',
    frequency: '1 vez al día (mañana)',
    scheduleTimes: ['08:00'],
    startDate: '06 Jun, 2026',
    endDate: '06 Dic, 2026',
    doctor: 'Dr. Alejandro Ríos',
    specialty: 'Cardiología',
    recipeId: 'REC-2026-904',
    totalDoses: 28,
    takenDoses: 14,
    status: 'En curso',
    instructions: 'Tomar en ayunas con un vaso de agua. Controlar presión arterial semanalmente.',
  },
  {
    id: 'trt-2',
    name: 'Aspirina 100mg',
    dosage: '1 comprimido gastrorresistente',
    frequency: '1 vez al día (almuerzo)',
    scheduleTimes: ['13:00'],
    startDate: '01 Jun, 2026',
    endDate: '01 Dic, 2026',
    doctor: 'Dr. Alejandro Ríos',
    specialty: 'Cardiología',
    recipeId: 'REC-2026-901',
    totalDoses: 30,
    takenDoses: 20,
    status: 'En curso',
    instructions: 'Tomar durante el almuerzo. No masticar el comprimido.',
  },
];

const MOCK_DOSE_LOGS: DoseLog[] = [
  { id: 'dose-1', medicationId: 'trt-1', medicationName: 'Ramipril 5mg', scheduledTime: '08:00', takenAt: '08:05', status: 'Tomada', date: '08 Jun, 2026' },
  { id: 'dose-2', medicationId: 'trt-2', medicationName: 'Aspirina 100mg', scheduledTime: '13:00', status: 'Pendiente', date: '08 Jun, 2026' },
  { id: 'dose-3', medicationId: 'trt-1', medicationName: 'Ramipril 5mg', scheduledTime: '08:00', takenAt: '08:10', status: 'Tomada', date: '07 Jun, 2026' },
  { id: 'dose-4', medicationId: 'trt-2', medicationName: 'Aspirina 100mg', scheduledTime: '13:00', takenAt: '13:15', status: 'Tomada', date: '07 Jun, 2026' },
  { id: 'dose-5', medicationId: 'trt-1', medicationName: 'Ramipril 5mg', scheduledTime: '08:00', status: 'Omitida', date: '06 Jun, 2026' },
  { id: 'dose-6', medicationId: 'trt-2', medicationName: 'Aspirina 100mg', scheduledTime: '13:00', takenAt: '13:05', status: 'Tomada', date: '06 Jun, 2026' },
];

const MOCK_TREATMENT_ALERTS: TreatmentAlert[] = [
  {
    id: 'alert-3',
    type: 'renovacion',
    title: 'Renovación de receta Ramipril',
    message: 'La receta REC-2026-904 vence el 06 Dic, 2026. Solicite renovación con 15 días de anticipación.',
    date: '21 Nov, 2026',
  },
];

const EXAMPLE_EXTERNAL_PAYMENT_GATEWAY = 'https://pagos.humana.example/checkout';

/**
 * Vista principal y portal exclusivo para Pacientes (Portal B2C).
 * Integra un tablero integral con múltiples módulos enfocados en el paciente:
 * - Seguimiento de dosis de tratamientos con marcadores interactivos (tracker de adherencia).
 * - Historial y visor de Récipes Médicos (Emitidos por sus médicos).
 * - Módulo transaccional de Checkout y Pasarela de Pagos (Simulada) para propuestas comerciales aprobadas.
 * - Perfil y credencial dinámica por QR para validación rápida en sucursales o consultorios.
 *
 * @param {PatientViewProps} props - Propiedades de la vista.
 * @returns {JSX.Element}
 */
const PACIENTE_ID = "V-22.341.567";

export default function PatientView({ patientName, patientEmail, onLogout }: PatientViewProps) {
  // Navigation Tabs: 'recipes' | 'treatment' | 'proposals' | 'payment' | 'voucher' | 'profile'
  const [activeSubTab, setActiveSubTab] = useState<'recipes' | 'treatment' | 'proposals' | 'payment' | 'voucher' | 'profile'>('treatment');

  const [recipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Treatment tracking states
  const [treatments, setTreatments] = useState<TreatmentMedication[]>(MOCK_TREATMENTS);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(MOCK_DOSE_LOGS);
  const [treatmentAlerts] = useState<TreatmentAlert[]>(MOCK_TREATMENT_ALERTS);
  const [doseSuccessMsg, setDoseSuccessMsg] = useState('');
  const [treatmentPanel, setTreatmentPanel] = useState<'today' | 'medications' | 'progress'>('today');

  // Estados para el QR y el Tiempo (Módulo 1 / Sprint #2)
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutos en segundos
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Estados para el flujo de Consentimiento Ético
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [termsText, setTermsText] = useState<string>("");

  // Last Order State
  const [lastOrderStatus, setLastOrderStatus] = useState<'Pendiente por retirar' | 'Listo para retirar' | 'Retirado'>('Listo para retirar');

  const {
    qrToken,
    qrSecondsLeft,
    isCredentialModalOpen,
    setIsCredentialModalOpen,
    handleRefreshQR,
  } = useCredentialQr('PX-992', '8812');

  // Proposal states (Pantalla P.2)
  const [proposalItems] = useState<ProposalItem[]>([
    { id: 'prop-1', medication: 'Ramipril 5mg (28 Comprimidos)', quantity: 1, unitPrice: 12.50, discountPercent: 20 },
    { id: 'prop-2', medication: 'Aspirina 100mg (30 Comprimidos)', quantity: 1, unitPrice: 6.00, discountPercent: 10 }
  ]);
  const [selectedBranch, setSelectedBranch] = useState('Clínica Humana');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Payment States (Pantalla P.3)
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900); // 15 minutes in seconds
  const [simulatedPaymentReference, setSimulatedPaymentReference] = useState('');

  // Voucher info
  const [voucherId, setVoucherId] = useState('');

  // Profile Settings State (Pantalla P.5)
  const [profileName, setProfileName] = useState(patientName);

  const getCedulaFromName = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes('ana')) return 'V-22.341.567';
    if (normalized.includes('carlos')) return 'V-15.234.891';
    if (normalized.includes('luis')) return 'V-18.765.432';
    return 'V-28.450.123'; // Sofía Peralta (Default)
  };

  const [profileDocumentId] = useState(getCedulaFromName(patientName));

  // WebSockets: Consent Request State
  const [incomingConsent, setIncomingConsent] = useState<{ doctorId: string; doctorName: string; patientCedula: string } | null>(null);

  // =========================================================
  // 1. EFECTO: Sincronización WebSockets (Tiempo Real)
  // =========================================================
  useEffect(() => {
    // 1. Encendemos el socket global
    socket.connect();

    const identify = () => {
      // Mantenemos la cédula de pruebas o la del perfil
      const targetCedula = profileDocumentId || 'V-22.341.567'; 
      
      console.log(`🤖 Registrando paciente en Socket local con Cédula: ${targetCedula}`);
      
      // Enviamos la petición unificada que tu server.js espera
      socket.emit('identifyUser', { 
        userId: targetCedula, 
        role: 'patient', 
        name: profileName || 'Ana Martínez'
      });
    };

    if (socket.connected) identify();
    socket.on('connect', identify);

    // 2. FUSIONAMOS LAS DOS LÓGICAS EN UNA SOLA FUNCIÓN RECEPTORA
    const handleIncomingRequest = async (data: { doctorId: string; doctorName: string; patientCedula: string }) => {
      console.log('🎯 ¡Solicitud de vinculación real recibida por el canal del Servidor!:', data);
      
      // Guardamos la información del médico entrante para el modal
      setIncomingConsent(data); 

      try {
        // Consultamos dinámicamente los términos desde el backend
        const response = await apiClient.get('/consentimiento/terminos');
        setTermsText(response.data.texto);
        setShowConsentModal(true); // 🔥 ¡Desplegamos el Modal de inmediato!
      } catch (error) {
        console.error("Error al traer los términos de privacidad:", error);
        // Si falla el endpoint, abrimos el modal igual para no trabar la prueba local
        setShowConsentModal(true);
      }
    };

    // Escuchar cancelación por parte del médico
    const handleCancelRequest = (data: { doctorId: string }) => {
      console.log('El médico canceló la solicitud:', data);
      setIncomingConsent(null);
      setShowConsentModal(false); // Cerramos el modal si el médico se arrepiente
    };

    // 3. CONECTAMOS LOS ESCUCHADORES EXCLUSIVOS DE TU SERVER.JS
    socket.on('incomingConsentRequest', handleIncomingRequest);
    socket.on('consentRequestCancelled', handleCancelRequest);

    return () => {
      socket.off('connect', identify);
      socket.off('incomingConsentRequest', handleIncomingRequest);
      socket.off('consentRequestCancelled', handleCancelRequest);
      socket.disconnect();
    };
  }, [profileDocumentId, profileName]);

  // =========================================================
  // 2. EFECTO: Cuenta regresiva del QR efímero
  // =========================================================
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setQrImage(null); // Borramos el QR expirado de la pantalla
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  // =========================================================
  // 3. FUNCIONES: Acciones de Negocio
  // =========================================================
  const handleGenerarQR = async () => {
    try {
      // Pedimos el token encriptado en AES-256 transformado a Base64
      const response = await apiClient.get(`/qr/generate/${PACIENTE_ID}`);
      setQrImage(response.data.qrImageBase64); // Suponiendo que el backend devuelve la propiedad así
      setTimeLeft(300); // Reseteamos el reloj a 5 minutos
      setIsTimerActive(true);
    } catch (error) {
      console.error("Error generando el código QR de seguridad:", error);
    }
  };

  const handleResponderConsentimiento = (aceptado: boolean) => {
    // Emitimos la respuesta directo por WebSocket para desbloquear la pantalla del médico
    socket.emit('consentResponse', { 
      idPaciente: PACIENTE_ID, 
      status: aceptado ? 'ACCEPTED' : 'DECLINED' 
    });
    setShowConsentModal(false);
  };

  const handleConsentResponse = (accepted: boolean) => {
    if (incomingConsent) {
      socket.emit('consentResponse', {
        doctorId: incomingConsent.doctorId,
        patientCedula: incomingConsent.patientCedula,
        patientName: profileName,
        accepted,
      });
      setIncomingConsent(null);
    }
  };
  const [profilePhone, setProfilePhone] = useState('0412-6001234');
  const [deliveryAddress, setDeliveryAddress] = useState('Av. Francisco de Miranda, Urb. Campo Alegre, Edif. Parque Cristal, Piso 4B');
  const [deliveryState, setDeliveryState] = useState('Distrito Capital');
  const [deliveryMunicipio, setDeliveryMunicipio] = useState('Chacao');

  // Calculations for Proposal
  const calculateItemSubtotal = (item: ProposalItem) => {
    const originalSub = item.unitPrice * item.quantity;
    const savings = originalSub * (item.discountPercent / 100);
    return originalSub - savings;
  };

  const getProposalTotals = () => {
    let grossTotal = 0;
    let totalSavings = 0;
    proposalItems.forEach(item => {
      grossTotal += item.unitPrice * item.quantity;
      totalSavings += (item.unitPrice * item.quantity) * (item.discountPercent / 100);
    });

    const netSubtotal = grossTotal - totalSavings;
    const vat = netSubtotal * 0.16;
    const netTotal = netSubtotal + vat;

    return {
      grossTotal,
      totalSavings,
      netSubtotal,
      vat,
      netTotal
    };
  };

  const totals = getProposalTotals();

  const getExamplePaymentRedirectUrl = () => {
    const params = new URLSearchParams({
      pedido: 'PR-2026',
      total: totals.netTotal.toFixed(2),
      sucursal: selectedBranch,
      metodos: 'pago-movil,transferencia',
      paciente: patientEmail,
    });
    return `${EXAMPLE_EXTERNAL_PAYMENT_GATEWAY}?${params.toString()}`;
  };

  const activeTreatments = treatments.filter((t) => t.status === 'En curso');
  const todayLabel = '08 Jun, 2026';
  const todayDoses = doseLogs.filter((d) => d.date === todayLabel);
  const pendingTodayDoses = todayDoses.filter((d) => d.status === 'Pendiente');
  const nextPendingDose = pendingTodayDoses[0];

  const getTreatmentProgress = (treatment: TreatmentMedication) =>
    Math.round((treatment.takenDoses / treatment.totalDoses) * 100);

  const sortedTodayDoses = [...todayDoses].sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime)
  );
  const todayCompletedCount = todayDoses.filter((d) => d.status === 'Tomada').length;
  const todayTotalCount = todayDoses.length;
  const todayProgressPercent = todayTotalCount
    ? Math.round((todayCompletedCount / todayTotalCount) * 100)
    : 0;

  const getTimeOfDay = (time: string) => {
    const hour = parseInt(time.split(':')[0], 10);
    if (hour < 12) return { label: 'Mañana', Icon: Sun };
    if (hour < 18) return { label: 'Mediodía', Icon: Sunset };
    return { label: 'Noche', Icon: Moon };
  };

  const getDoseHint = (medicationId: string) => {
    const treatment = treatments.find((t) => t.id === medicationId);
    if (!treatment) return '';
    return treatment.instructions;
  };

  const handleMarkDoseTaken = (doseId: string) => {
    const dose = doseLogs.find((d) => d.id === doseId);
    if (!dose || dose.status !== 'Pendiente') return;

    const now = new Date();
    const takenAt = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setDoseLogs((prev) =>
      prev.map((d) =>
        d.id === doseId ? { ...d, status: 'Tomada' as const, takenAt } : d
      )
    );
    setTreatments((prev) =>
      prev.map((t) =>
        t.id === dose.medicationId ? { ...t, takenDoses: t.takenDoses + 1 } : t
      )
    );
    setDoseSuccessMsg(`Toma de ${dose.medicationName} registrada correctamente.`);
    setTimeout(() => setDoseSuccessMsg(''), 3000);
  };

  const getAlertMeta = (type: TreatmentAlert['type']) => {
    if (type === 'control') {
      return {
        Icon: Stethoscope,
        label: 'Control médico',
        cardClass: 'border-primary-500/25 bg-primary-500/5',
        iconClass: 'text-primary-400',
        badgeClass: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
      };
    }
    if (type === 'renovacion') {
      return {
        Icon: RefreshCw,
        label: 'Renovación',
        cardClass: 'patient-alert-card--renovacion border-[#3dd4e3]/50',
        iconClass: 'text-[#0a6b75]',
        badgeClass: 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20',
      };
    }
    return {
      Icon: Bell,
      label: 'Recordatorio',
      cardClass: 'border-amber-500/25 bg-amber-500/5',
      iconClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
  };

  // Load profile settings from localStorage if available
  useEffect(() => {
    const savedName = localStorage.getItem('zenith_patient_name');
    const savedPhone = localStorage.getItem('zenith_patient_phone');
    const savedAddr = localStorage.getItem('zenith_patient_address');
    const savedState = localStorage.getItem('zenith_patient_state') ?? localStorage.getItem('zenith_patient_pc');
    const savedMunicipio = localStorage.getItem('zenith_patient_municipio') ?? localStorage.getItem('zenith_patient_city');

    if (savedName) setProfileName(savedName);
    if (savedPhone) setProfilePhone(savedPhone);
    if (savedAddr) setDeliveryAddress(savedAddr);
    if (savedState) setDeliveryState(savedState);
    if (savedMunicipio) setDeliveryMunicipio(savedMunicipio);
  }, []);

  // Countdown Timer for Payment Gateway (P.3)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSubTab === 'payment' && paymentTimeLeft > 0) {
      timer = setInterval(() => {
        setPaymentTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (activeSubTab === 'payment' && paymentTimeLeft === 0) {
      alert('El tiempo límite de 15 minutos para confirmar el pago ha expirado. El inventario apartado ha sido liberado.');
      setActiveSubTab('proposals');
      setPaymentTimeLeft(900);
    }
    return () => clearInterval(timer);
  }, [activeSubTab, paymentTimeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDoseStatusBadgeClass = (status: DoseLog['status']) => {
    if (status === 'Tomada') {
      return 'bg-[#179150]/15 text-[#179150] border-[#179150]/35';
    }
    if (status === 'Omitida') {
      return 'bg-red-500/20 text-red-600 border-red-500/35';
    }
    return 'bg-amber-500/20 text-amber-600 border-amber-500/35';
  };

  const cycleOrderStatus = () => {
    if (lastOrderStatus === 'Pendiente por retirar') setLastOrderStatus('Listo para retirar');
    else if (lastOrderStatus === 'Listo para retirar') setLastOrderStatus('Retirado');
    else setLastOrderStatus('Pendiente por retirar');
  };

  const orderDeliverySteps = [
    {
      id: 'Pendiente por retirar',
      label: 'Pendiente',
      circleActive: 'bg-red-500 text-white',
      circleComplete: 'bg-red-500 text-white',
    },
    {
      id: 'Listo para retirar',
      label: 'Listo para retirar',
      circleActive: 'bg-amber-500 text-surface-950',
      circleComplete: 'bg-amber-500 text-surface-950',
    },
    {
      id: 'Retirado',
      label: 'Retirado',
      circleActive: 'bg-secondary-500 text-white',
      circleComplete: 'bg-secondary-500 text-white',
    },
  ] as const;

  const activeOrderStepIndex = orderDeliverySteps.findIndex((step) => step.id === lastOrderStatus);

  const handleConfirmOrder = () => {
    if (!termsAccepted) {
      alert('Debe aceptar los Términos y Condiciones del servicio.');
      return;
    }
    setPaymentTimeLeft(900);
    setSimulatedPaymentReference('');
    setActiveSubTab('payment');
  };

  const activeNavId =
    activeSubTab === 'recipes' || activeSubTab === 'voucher'
      ? 'recipes'
      : activeSubTab === 'treatment'
        ? 'treatment'
        : activeSubTab === 'proposals' || activeSubTab === 'payment'
          ? 'proposals'
          : 'profile';

  const handleNav = (id: string) => {
    if (id === 'recipes') setActiveSubTab('recipes');
    else if (id === 'treatment') setActiveSubTab('treatment');
    else if (id === 'proposals') setActiveSubTab('proposals');
    else setActiveSubTab('profile');
  };

  return (
    <AppShell
      portal="patient"
      contentClassName="max-w-6xl"
      sidebar={
        <AppSidebar
          accent="primary"
          brand={{ icon: Activity, title: 'Paciente' }}
          items={[
            { id: 'treatment', name: 'Seguimiento', icon: Pill },
            { id: 'recipes', name: 'Récipes médicos', icon: FileText },
            { id: 'proposals', name: 'Confirmar pedido', icon: FileSpreadsheet },
            { id: 'profile', name: 'Perfil', icon: User },
          ]}
          activeId={activeNavId}
          onNavigate={handleNav}
          profile={{
            initials: profileName
              .split(' ')
              .filter(Boolean)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase(),
            name: profileName,
            avatarClassName: 'portal-profile-avatar',
          }}
          preProfile={
            <SidebarCredentialButton onOpen={() => setIsCredentialModalOpen(true)} />
          }
          onLogout={onLogout}
          logoutVariant="icon"
        />
      }
      header={({ onMenuClick }) => (
        <AppHeader
          onMenuClick={onMenuClick}
          statusLabel=""
          showNotifications={false}
          profileInitials={profileName
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
          profileName={
            profileName.split(' ')[1]
              ? `${profileName.split(' ')[0]} ${profileName.split(' ')[1][0]}.`
              : profileName.split(' ')[0]
          }
        />
      )}
    >
      {/* Consentimiento en Tiempo Real Modal */}
      <Modal
        open={incomingConsent !== null}
        onClose={() => handleConsentResponse(false)}
        title="Solicitud de Vinculación Clínica"
        size="md"
      >
        <ModalBody className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
            <div className="w-16 h-16 bg-secondary-500/10 text-secondary-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">El {incomingConsent?.doctorName} solicita acceso</h3>
              <p className="text-sm text-surface-400 mt-2">
                Para poder recetarle medicamentos, el médico necesita vincularse a su perfil clínico.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleConsentResponse(false)}
              className="flex-1 px-4 py-3 border border-surface-700 hover:bg-surface-800 text-surface-300 rounded-xl font-bold transition-colors"
            >
              Denegar
            </button>
            <button
              onClick={() => handleConsentResponse(true)}
              className="flex-1 px-4 py-3 bg-secondary-600 hover:bg-secondary-500 text-white rounded-xl font-bold transition-colors"
            >
              Aceptar Vinculación
            </button>
          </div>
        </ModalBody>
      </Modal>
            {activeSubTab === 'recipes' && (
              <div className="space-y-6">
                {/* Progress Stepper for last order */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl backdrop-blur-md relative overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-surface-800 text-surface-300 border border-surface-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                            Última Orden de Farmacia
                          </span>
                          <span className="text-xs font-mono font-semibold text-surface-500">ID: #ORD-9923</span>
                        </div>
                        <h3 className="text-sm !font-bold text-foreground">Retiro de medicamentos en farmacia</h3>
                      </div>

                      <span
                        className={`inline-flex self-start shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          lastOrderStatus === 'Retirado'
                            ? 'bg-secondary-500/10 text-secondary-500 border-secondary-500/25'
                            : lastOrderStatus === 'Listo para retirar'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                              : 'bg-red-500/10 text-red-500 border-red-500/25'
                        }`}
                      >
                        {lastOrderStatus}
                      </span>
                    </div>

                    <div className="border-t border-surface-800/80 pt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] text-surface-500 font-bold uppercase tracking-wider">
                          Progreso de Entrega
                        </span>
                        <button
                          type="button"
                          onClick={cycleOrderStatus}
                          className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white rounded-lg border border-surface-700 transition-colors cursor-pointer shrink-0"
                          title="Simular actualización del estado de entrega"
                        >
                          <PackageCheck className="h-4 w-4" />
                        </button>
                      </div>

                      <ol className="grid grid-cols-3 gap-2 sm:gap-4">
                        {orderDeliverySteps.map((step, index) => {
                          const isComplete = index < activeOrderStepIndex;
                          const isActive = index === activeOrderStepIndex;

                          return (
                            <li key={step.id} className="flex min-w-0 flex-col items-center gap-2 text-center">
                              <div className="flex w-full items-center">
                                {index > 0 ? (
                                  <span
                                    className={`h-0.5 flex-1 ${
                                      index <= activeOrderStepIndex ? 'bg-secondary-500/40' : 'bg-surface-800'
                                    }`}
                                  />
                                ) : (
                                  <span className="flex-1" aria-hidden />
                                )}

                                <span
                                  className={`mx-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                    isComplete
                                      ? step.circleComplete
                                      : isActive
                                        ? step.circleActive
                                        : 'bg-surface-800 text-surface-500'
                                  }`}
                                >
                                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                                </span>

                                {index < orderDeliverySteps.length - 1 ? (
                                  <span
                                    className={`h-0.5 flex-1 ${
                                      index < activeOrderStepIndex ? 'bg-secondary-500/40' : 'bg-surface-800'
                                    }`}
                                  />
                                ) : (
                                  <span className="flex-1" aria-hidden />
                                )}
                              </div>

                              <span className="text-[10px] font-semibold leading-tight text-foreground">
                                {step.label}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Recipes Table Card */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <div>
                    <h3 className="zenith-section-title">Récipes Emitidos por Especialistas</h3>
                  </div>

                  <div className="zenith-table-wrap hidden lg:block">
                    <table className="zenith-table zenith-table--divided text-sm">
                      <colgroup>
                        <col className="w-[13%]" />
                        <col className="w-[14%]" />
                        <col className="w-[32%]" />
                        <col className="w-[24%]" />
                        <col className="w-[17%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-surface-850 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                          <th className="pb-3">Código</th>
                          <th className="pb-3">Emisión</th>
                          <th className="pb-3 zenith-table__wrap">Medicamento</th>
                          <th className="pb-3 zenith-table__wrap">Especialista</th>
                          <th className="pb-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipes.map((rec) => (
                          <tr key={rec.id} className="hover:bg-surface-850/25 transition-colors group">
                            <td className="py-4 font-mono font-bold text-xs text-white">{rec.id}</td>
                            <td className="py-4 text-xs text-surface-400">{rec.date}</td>
                            <td className="py-4 zenith-table__wrap">
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-semibold text-surface-200 break-words">{rec.medication}</span>
                                <span className="text-[10px] text-surface-500">{rec.dosage}</span>
                              </div>
                            </td>
                            <td className="py-4 zenith-table__wrap">
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-xs text-surface-200 font-semibold break-words">{rec.doctor}</span>
                                <span className="text-[10px] text-surface-500">{rec.specialty}</span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <div className="inline-flex gap-2">
                                <button
                                  onClick={() => setSelectedRecipe(rec)}
                                  className="patient-recipe-view-btn px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Visualizar / PDF</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="lg:hidden space-y-3">
                    {recipes.map((rec) => (
                      <ListCard
                        key={rec.id}
                        title={rec.medication}
                        subtitle={rec.id}
                        fields={[
                          { label: 'Emisión', value: rec.date },
                          { label: 'Dosis', value: rec.dosage },
                          { label: 'Especialista', value: rec.doctor },
                          { label: 'Especialidad', value: rec.specialty },
                        ]}
                        actions={
                          <button
                            onClick={() => setSelectedRecipe(rec)}
                            className="patient-recipe-view-btn px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Visualizar
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* P.T: TREATMENT TRACKING */}
            {activeSubTab === 'treatment' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {doseSuccessMsg && (
                  <div className="p-4 bg-secondary-500/10 border border-secondary-500/30 rounded-2xl flex items-center gap-2.5 text-secondary-450 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                    <span>{doseSuccessMsg}</span>
                  </div>
                )}

                {/* Resumen del día */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 text-surface-400">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-semibold">{todayLabel}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {todayTotalCount === 0
                          ? 'Sin tomas programadas hoy'
                          : todayCompletedCount === todayTotalCount
                            ? '¡Todas las tomas de hoy completadas!'
                            : `${todayCompletedCount} de ${todayTotalCount} tomas completadas hoy`}
                      </h3>
                      {nextPendingDose && (
                        <p className="text-xs text-surface-400">
                          Próxima: <span className="text-surface-200 font-medium">{nextPendingDose.medicationName}</span> a las{' '}
                          <span className="font-mono text-primary-400">{nextPendingDose.scheduledTime}</span>
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full sm:w-auto sm:min-w-[16rem] shrink-0">
                      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 bg-surface-950/50 border border-surface-850 rounded-xl min-w-0">
                        <Pill className="h-4 w-4 text-[#179150] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-surface-500 truncate">Medicamentos activos</p>
                          <p className="text-sm font-semibold text-white tabular-nums">{activeTreatments.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-xl min-w-0">
                        <Bell className="h-4 w-4 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-surface-500 truncate">Alertas</p>
                          <p className="text-sm font-semibold text-white tabular-nums">{treatmentAlerts.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {todayTotalCount > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-surface-500">
                        <span>Progreso de hoy</span>
                        <span className="tabular-nums font-semibold text-surface-300">{todayProgressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className="patient-progress-bar__fill h-full transition-all duration-500 rounded-full"
                          style={{ width: `${todayProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* QR Digital Presencial (Módulo 1 / Sprint #2) */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        QR Digital Presencial
                      </h3>
                    </div>
                    <p className="text-xs text-surface-400 max-w-md">
                      Genere un código QR de seguridad de un solo uso para autorizar accesos o validar su identidad en consultorios médicos.
                    </p>
                    <p className="text-xs text-surface-500">
                      Cédula del paciente: <span className="font-mono text-surface-300 font-semibold">{PACIENTE_ID}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <button
                      onClick={handleGenerarQR}
                      className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-primary-950/20 active:scale-95 animate-pulse"
                    >
                      Generar QR Digital Presencial
                    </button>

                    {/* Renderizado de la imagen Base64 del Módulo 1 */}
                    {qrImage && (
                      <div className="mt-2 bg-white p-3.5 rounded-2xl border border-surface-200 flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
                        <img src={qrImage} alt="QR Efímero Paciente" className="w-[180px] h-[180px]" />
                        <p className={`text-xs font-bold ${timeLeft < 60 ? 'text-[#e11d48]' : 'text-[#179150]'}`}>
                          Expira en: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navegación interna */}
                <div className="flex flex-nowrap gap-2 p-1 bg-surface-950/50 border border-surface-850 rounded-xl overflow-x-auto">
                  {([
                    { id: 'today' as const, label: 'Hoy', icon: Clock, count: pendingTodayDoses.length },
                    { id: 'medications' as const, label: 'Medicamentos', icon: Pill, count: activeTreatments.length },
                    { id: 'progress' as const, label: 'Progreso', icon: TrendingUp },
                  ]).map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = treatmentPanel === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTreatmentPanel(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                          isActive
                            ? 'patient-treatment-tab--active shadow-sm'
                            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-850'
                        }`}
                      >
                        <TabIcon className="h-3.5 w-3.5 shrink-0" />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tabular-nums ${
                            isActive ? 'bg-white/20 text-white' : 'bg-primary-500/15 text-primary-400'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Panel: Hoy */}
                {treatmentPanel === 'today' && (
                  <div className="space-y-4">
                    {sortedTodayDoses.length === 0 ? (
                      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-8 text-center backdrop-blur-md">
                        <Pill className="h-8 w-8 text-surface-600 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-surface-300">No hay tomas programadas para hoy</p>
                        <p className="text-xs text-surface-500 mt-1">Vuelva mañana para registrar su próxima dosis.</p>
                      </div>
                    ) : (
                      sortedTodayDoses.map((dose) => {
                        const { label: timeLabel, Icon: TimeIcon } = getTimeOfDay(dose.scheduledTime);
                        const isPending = dose.status === 'Pendiente';
                        const isTaken = dose.status === 'Tomada';
                        return (
                          <div
                            key={dose.id}
                            className={`p-5 sm:p-6 rounded-2xl border backdrop-blur-md transition-colors bg-surface-900/60 ${
                              isPending
                                ? 'border-primary-500/30'
                                : isTaken
                                  ? 'border-secondary-500/25'
                                  : 'border-surface-800'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className={`p-3 rounded-xl shrink-0 ${
                                  isPending ? 'bg-primary-500/15' : isTaken ? 'bg-secondary-500/15' : 'bg-surface-850'
                                }`}>
                                  <TimeIcon className={`h-5 w-5 ${
                                    isPending ? 'text-primary-400' : isTaken ? 'text-secondary-400' : 'text-surface-500'
                                  }`} />
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-surface-400">{timeLabel}</span>
                                    <span className="text-xs font-mono text-surface-500">{dose.scheduledTime}</span>
                                    {isTaken && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-secondary-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Tomada{dose.takenAt ? ` a las ${dose.takenAt}` : ''}
                                      </span>
                                    )}
                                    {dose.status === 'Omitida' && (
                                      <span className="text-[10px] font-semibold text-surface-500">Omitida</span>
                                    )}
                                  </div>
                                  <h4 className="text-base font-bold text-white">{dose.medicationName}</h4>
                                  <p className="text-xs text-surface-400 leading-relaxed line-clamp-2">
                                    {getDoseHint(dose.medicationId)}
                                  </p>
                                </div>
                              </div>
                              {isPending && (
                                <Button
                                  variant="patient"
                                  size="lg"
                                  onClick={() => handleMarkDoseTaken(dose.id)}
                                  className="w-full sm:w-auto shrink-0 gap-2"
                                >
                                  <Check className="h-4 w-4" />
                                  Confirmar toma
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Panel: Medicamentos */}
                {treatmentPanel === 'medications' && (
                  <div className="space-y-4">
                    {activeTreatments.map((treatment) => {
                      const progress = getTreatmentProgress(treatment);
                      return (
                        <div
                          key={treatment.id}
                          className="bg-surface-900/60 border border-surface-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <h4 className="patient-medication-name text-base">{treatment.name}</h4>
                              <p className="text-xs text-surface-400">
                                {treatment.dosage} · {treatment.frequency}
                              </p>
                              <p className="text-[10px] text-surface-500">
                                {treatment.doctor} · {treatment.specialty}
                              </p>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <p className="text-2xl font-bold text-white tabular-nums">{progress}%</p>
                              <p className="text-[10px] text-surface-500">
                                {treatment.takenDoses} de {treatment.totalDoses} tomas
                              </p>
                            </div>
                          </div>

                          <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden">
                            <div
                              className="patient-progress-bar__fill h-full transition-all duration-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-2 text-surface-400">
                              <Clock className="h-3.5 w-3.5 text-surface-500 shrink-0" />
                              <span>{treatment.scheduleTimes.join(' · ')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-surface-400">
                              <Calendar className="h-3.5 w-3.5 text-surface-500 shrink-0" />
                              <span>{treatment.startDate} — {treatment.endDate}</span>
                            </div>
                          </div>

                          <p className="text-xs text-surface-400 border-t border-surface-850 pt-3 leading-relaxed">
                            {treatment.instructions}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Panel: Progreso */}
                {treatmentPanel === 'progress' && (
                  <div className="space-y-6">
                    {treatmentAlerts.length > 0 && (
                      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                        <div>
                          <h3 className="zenith-section-title">Alertas y recordatorios</h3>
                        </div>

                        <div className="space-y-3">
                          {treatmentAlerts.map((alert) => {
                            const { Icon: AlertIcon, cardClass, iconClass } = getAlertMeta(alert.type);
                            return (
                              <div
                                key={alert.id}
                                className={`p-4 border rounded-xl space-y-2 ${cardClass}`}
                              >
                                <div className="flex items-start gap-3">
                                  <AlertIcon className={`h-4 w-4 shrink-0 mt-0.5 ${iconClass}`} />
                                  <div className="min-w-0 flex-1">
                                    <p className="patient-alert-title text-sm">{alert.title}</p>
                                    <p className="text-[10px] text-surface-500 mt-0.5 patient-alert-date">{alert.date}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-surface-400 leading-relaxed pl-7 patient-alert-message">{alert.message}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-surface-500" />
                        <div>
                          <h3 className="zenith-section-title">Historial de tomas</h3>
                        </div>
                      </div>

                      <div className="zenith-table-wrap hidden lg:block">
                        <table className="zenith-table zenith-table--divided text-sm">
                          <colgroup>
                            <col className="w-[18%]" />
                            <col className="w-[32%]" />
                            <col className="w-[16%]" />
                            <col className="w-[16%]" />
                            <col className="w-[18%]" />
                          </colgroup>
                          <thead>
                            <tr className="border-b border-surface-850 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                              <th className="pb-3">Fecha</th>
                              <th className="pb-3 zenith-table__wrap">Medicamento</th>
                              <th className="pb-3">Programada</th>
                              <th className="pb-3">Tomada</th>
                              <th className="pb-3">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {doseLogs.map((dose) => (
                              <tr key={dose.id} className="hover:bg-surface-850/25 transition-colors">
                                <td className="py-3 text-xs text-surface-400">{dose.date}</td>
                                <td className="py-3 zenith-table__wrap text-xs font-semibold text-surface-200 break-words">
                                  {dose.medicationName}
                                </td>
                                <td className="py-3 text-xs text-surface-400 font-mono">{dose.scheduledTime}</td>
                                <td className="py-3 text-xs text-surface-400 font-mono">{dose.takenAt ?? '—'}</td>
                                <td className="py-3">
                                  <span className={`inline-flex px-2 py-0.5 text-2xs font-semibold border rounded-full ${getDoseStatusBadgeClass(dose.status)}`}>
                                    {dose.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="lg:hidden space-y-3">
                        {doseLogs.map((dose) => (
                          <ListCard
                            key={dose.id}
                            title={dose.medicationName}
                            subtitle={dose.date}
                            badge={
                              <span className={`inline-flex px-2 py-0.5 text-2xs font-semibold border rounded-full ${getDoseStatusBadgeClass(dose.status)}`}>
                                {dose.status}
                              </span>
                            }
                            fields={[
                              { label: 'Programada', value: dose.scheduledTime },
                              { label: 'Tomada', value: dose.takenAt ?? '—' },
                            ]}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* P.2: COMMERCIAL PROPOSAL & BILLING */}
            {activeSubTab === 'proposals' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Proposal Breakdown Table */}
                  <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <div>
                      <h3 className="zenith-section-title">Medicamentos recetados</h3>
                    </div>

                    <div className="divide-y divide-surface-850">
                      {proposalItems.map((item) => {
                        const originalSub = item.unitPrice * item.quantity;
                        const finalSub = calculateItemSubtotal(item);
                        const discountAmt = originalSub - finalSub;
                        return (
                          <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-surface-200">{item.medication}</h4>
                              <p className="text-xs text-surface-550 flex items-center gap-2">
                                <span>Cant: {item.quantity}</span>
                                <span>•</span>
                                <span>Precio Unitario: {formatCurrency(item.unitPrice)}</span>
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-4 text-right">
                              {item.discountPercent > 0 && (
                                <div className="space-y-0.5">
                                  <span className="text-[9px] bg-secondary-500/10 text-secondary-400 border border-secondary-500/20 px-1.5 py-0.5 rounded font-bold">
                                    -{item.discountPercent}% Médico
                                  </span>
                                  <p className="text-[10px] text-secondary-400/80 font-medium">Ahorras: -{formatCurrency(discountAmt)}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-white">{formatCurrency(finalSub)}</p>
                                {item.discountPercent > 0 && (
                                  <span className="text-2xs text-surface-500 line-through">{formatCurrency(originalSub)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-surface-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {termsAccepted ? (
                          <div className="h-5 w-5 rounded-full bg-secondary-500/10 text-secondary-400 flex items-center justify-center border border-secondary-500/25">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-secondary-500/10 text-secondary-455 flex items-center justify-center border border-secondary-500/25">
                            <Info className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <span className="text-xs text-surface-350">
                          {termsAccepted 
                            ? 'Términos y condiciones aceptados.' 
                            : 'Requiere la aceptación de los Términos y Condiciones del servicio.'
                          }
                        </span>
                      </div>

                      <Button
                        variant="patient"
                        size="sm"
                        onClick={() => setIsTermsModalOpen(true)}
                        className="font-bold !h-auto px-3.5 py-2"
                      >
                        {termsAccepted ? 'Ver Términos' : 'Aceptar Términos'}
                      </Button>
                    </div>
                  </div>

                  {/* Facturación Invoice Box */}
                  <div className="space-y-6">
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <h3 className="zenith-section-title">Resumen de Facturación</h3>

                      <div className="space-y-2.5 text-xs text-surface-400">
                        <div className="flex justify-between">
                          <span>Subtotal Bruto</span>
                          <span className="font-medium text-surface-300">{formatCurrency(totals.grossTotal)}</span>
                        </div>
                        <div className="flex justify-between text-secondary-400">
                          <span>Ahorro Exclusivo</span>
                          <span className="font-bold">-{formatCurrency(totals.totalSavings)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal Neto</span>
                          <span className="font-medium text-surface-300">{formatCurrency(totals.netSubtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IVA (16%)</span>
                          <span className="font-medium text-surface-300">{formatCurrency(totals.vat)}</span>
                        </div>
                        
                        <div className="border-t border-surface-800 pt-3 flex justify-between items-baseline">
                          <span className="font-medium text-white text-sm">Total Neto</span>
                          <span className="text-lg font-semibold text-white">{formatCurrency(totals.netTotal)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <h3 className="zenith-section-title flex items-center gap-2">
                        <Building className="h-4 w-4 text-surface-400" />
                        <span>Sucursal de Envío</span>
                      </h3>
                      
                      <div className="space-y-2">
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="w-full bg-surface-950/60 border border-surface-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                        >
                          <option value="Clínica Humana">Clínica Humana</option>
                          <option value="Farmahumana">Farmahumana</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      variant="patient"
                      onClick={handleConfirmOrder}
                      disabled={!termsAccepted}
                      className="w-full"
                      size="lg"
                    >
                      <span>Confirmar y Enviar Carrito</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Button>

                  </div>

                </div>

              </div>
            )}

            {/* P.3: PAYMENT GATEWAY */}
            {activeSubTab === 'payment' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-end">
                  <div className="bg-secondary-500/10 border border-secondary-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0">
                    <Clock className="h-5 w-5 text-secondary-400 animate-pulse" />
                    <div>
                      <span className="text-[9px] font-bold text-secondary-450 uppercase leading-none block">Reserva de Inventario</span>
                      <span className="text-base font-mono font-semibold text-white">{formatTime(paymentTimeLeft)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Documentación de redirección a pasarela externa */}
                  <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
                    <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-start gap-3 text-xs text-surface-300">
                      <Info className="h-5 w-5 text-primary-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        El procesamiento de pagos (Pago Móvil y Transferencia) se realiza en la pasarela externa del cliente.
                        Esta aplicación no implementa la pasarela: solo documenta y simula el flujo de redirección de integración.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="zenith-section-title">Ejemplo de redirección</h3>
                      <div className="p-3 bg-surface-950/60 border border-surface-850 rounded-xl">
                        <p className="text-[10px] font-bold text-surface-500 uppercase mb-1.5">URL de ejemplo</p>
                        <p className="text-[11px] font-mono text-primary-300 break-all leading-relaxed">
                          {getExamplePaymentRedirectUrl()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-surface-950/50 border border-surface-850 rounded-xl space-y-1">
                        <p className="font-semibold text-surface-500">Métodos en pasarela del cliente</p>
                        <p className="text-surface-300">Pago Móvil, Transferencia</p>
                      </div>
                      <div className="p-3 bg-surface-950/50 border border-surface-850 rounded-xl space-y-1">
                        <p className="font-semibold text-surface-500">Retorno esperado</p>
                        <p className="text-surface-300">Callback con referencia de pago confirmada</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('proposals')}
                        className="px-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-surface-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Volver a Propuesta
                      </button>
                    </div>
                  </div>

                  {/* Summary of checkout */}
                  <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <h3 className="zenith-section-title">Resumen de Compra</h3>
                    
                    <div className="space-y-3">
                      {proposalItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-surface-200">{item.medication}</p>
                            <p className="text-[10px] text-surface-500">Cant: {item.quantity}</p>
                          </div>
                          <span className="font-bold text-white">{formatCurrency(calculateItemSubtotal(item))}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-surface-800 pt-4 space-y-2.5 text-xs text-surface-400">
                      <div className="flex justify-between">
                        <span>Ahorros aplicados</span>
                        <span className="text-secondary-400">-{formatCurrency(totals.totalSavings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IVA (16%)</span>
                        <span>{formatCurrency(totals.vat)}</span>
                      </div>
                      <div className="flex justify-between items-baseline font-bold text-white pt-2 border-t border-surface-850">
                        <span>Total Neto</span>
                        <span className="text-base text-primary-400">{formatCurrency(totals.netTotal)}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* P.4: SALES RECEIPT / VOUCHER STATUS */}
            {activeSubTab === 'voucher' && (
              <div className="max-w-2xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white text-surface-900 rounded-3xl shadow-2xl overflow-hidden border border-surface-200">
                  
                  <div className="bg-surface-950 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary-500 text-surface-950 flex items-center justify-center">
                        <Check className="h-6 w-6 stroke-[3]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-secondary-450 uppercase tracking-widest leading-none block">Transacción Aprobada</span>
                        <h3 className="zenith-section-title mt-0.5">Comprobante de Venta</h3>
                      </div>
                    </div>

                    <button 
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-surface-850 hover:bg-surface-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-surface-700"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Imprimir</span>
                    </button>
                  </div>

                  <div className="p-8 space-y-6 text-xs leading-relaxed">
                    
                    <div className="flex justify-between items-start border-b border-surface-200 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-surface-950">Farmahumana C.A.</h4>
                        <p className="text-2xs text-surface-500">RIF: J-30123456-7 • Av. Francisco de Miranda, Caracas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-surface-850">CÓDIGO: {voucherId}</p>
                        <p className="text-2xs text-surface-400 mt-0.5">Fecha: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200 text-2xs">
                      <div>
                        <span className="font-bold text-surface-450 uppercase block">Paciente</span>
                        <span className="font-bold text-surface-800 text-xs mt-0.5 block">{profileName}</span>
                        <span className="text-surface-500 mt-0.5 block">{patientEmail}</span>
                      </div>
                      <div>
                        <span className="font-bold text-surface-455 uppercase block">Retiro Autorizado en</span>
                        <span className="font-bold text-surface-800 text-xs mt-0.5 block">{selectedBranch}</span>
                        <span className="text-surface-500 mt-0.5 block">Presentar credencial QR física</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-bold text-primary-950 uppercase tracking-widest block text-[9px]">Productos Adquiridos</span>
                      <div className="divide-y divide-surface-150 border-t border-b border-surface-200">
                        {proposalItems.map((item) => (
                          <div key={item.id} className="py-2.5 flex justify-between">
                            <div>
                              <span className="font-bold text-surface-800">{item.medication}</span>
                              <span className="text-surface-500 block text-2xs">Cant: {item.quantity} • Descuento aplicado</span>
                            </div>
                            <span className="font-bold text-surface-900">{formatCurrency(calculateItemSubtotal(item))}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <div className="w-56 space-y-2 text-2xs text-surface-500">
                        <div className="flex justify-between">
                          <span>Subtotal Neto</span>
                          <span className="font-semibold text-surface-800">{formatCurrency(totals.netSubtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IVA (16%)</span>
                          <span className="font-semibold text-surface-800">{formatCurrency(totals.vat)}</span>
                        </div>
                        <div className="flex justify-between items-baseline font-bold text-surface-950 border-t border-surface-200 pt-2 text-xs">
                          <span>Total Pagado</span>
                          <span className="text-sm text-primary-700">{formatCurrency(totals.netTotal)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-surface-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-surface-455 text-[10px]">
                      <div>
                        <p className="font-semibold text-surface-600">Pasarela externa del cliente:</p>
                        <p className="font-mono text-surface-800 font-bold mt-0.5">{EXAMPLE_EXTERNAL_PAYMENT_GATEWAY}</p>
                        <p className="font-semibold text-surface-600 mt-2">Referencia de pago (simulación):</p>
                        <p className="font-mono text-surface-800 font-bold mt-0.5">{simulatedPaymentReference}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-secondary-605 font-bold">
                        <ShieldCheck className="h-4.5 w-4.5" />
                        <span>Reserva Confirmada en Almacén</span>
                      </div>
                    </div>

                  </div>

                  <div className="bg-surface-50 px-8 py-4 border-t border-surface-200 flex justify-between items-center">
                    <p className="text-[10px] text-surface-550">Guarde este recibo en su dispositivo móvil para retirar.</p>
                    <button
                      onClick={() => setActiveSubTab('recipes')}
                      className="px-4.5 py-2 bg-surface-900 hover:bg-surface-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Regresar a Récipes
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* P.5: PROFILE CONFIGURATION VIEW */}
            {activeSubTab === 'profile' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-8 backdrop-blur-md space-y-6">
                  <div className="space-y-6">
                    
                    {/* Sección 1: Datos Personales */}
                    <div className="space-y-4">
                      <h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">
                        Información Personal
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="zenith-field-label">Nombre Completo</label>
                          <input
                            type="text"
                            value={profileName}
                            readOnly
                            disabled
                            className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 focus:outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="zenith-field-label">Correo Electrónico</label>
                          <input
                            type="email"
                            value={patientEmail}
                            disabled
                            className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 focus:outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="zenith-field-label">Teléfono Móvil</label>
                          <input
                            type="text"
                            value={profilePhone}
                            readOnly
                            disabled
                            className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 font-mono focus:outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="zenith-field-label">Cédula de Identidad</label>
                          <input
                            type="text"
                            disabled
                            value={profileDocumentId}
                            className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 font-mono focus:outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 2: Dirección de Delivery */}
                    <div className="space-y-4">
                      <h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">
                        Dirección Predeterminada de Delivery
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="zenith-field-label">Dirección (Av., Urb., Edif., Piso)</label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            readOnly
                            disabled
                            className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 focus:outline-none cursor-not-allowed"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Estado</label>
                            <VenezuelanStateSelect
                              value={deliveryState}
                              onChange={setDeliveryState}
                              disabled
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Municipio</label>
                            <input
                              type="text"
                              value={deliveryMunicipio}
                              readOnly
                              disabled
                              className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 focus:outline-none cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

      {/* Printable Clinical Prescription Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-surface-950/75 backdrop-blur-sm" onClick={() => setSelectedRecipe(null)}></div>
          
          <div className="relative bg-white text-surface-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] print:max-h-full print:shadow-none print:w-full print:rounded-none">
            
            <div className="flex items-center justify-between px-6 py-3.5 bg-surface-900 text-white border-b border-surface-800 print:hidden">
              <span className="text-xs font-bold font-mono text-primary-400 flex items-center gap-1.5">
                <FileCheck className="h-4.5 w-4.5" />
                VISTA PREVIA DEL RECETARIO CLÍNICO
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs bg-surface-850 hover:bg-surface-800 text-white font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-surface-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8 flex-1 overflow-y-auto print:overflow-visible bg-white print:p-0">
              
              <div className="flex justify-between items-start border-b-2 border-surface-900 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary-900">
                    <Activity className="h-7 w-7 text-primary-700" />
                    <h1 className="zenith-page-title uppercase">Clínica Zenith</h1>
                  </div>
                  <p className="text-2xs text-surface-500 font-medium">
                    Servicios de Cardiología y Diagnóstico Especializado<br />
                    Av. Francisco de Miranda, Caracas • Tel: +58 212 345 6789
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold bg-surface-100 border border-surface-300 px-3 py-1 rounded-full text-surface-700 font-mono">
                    {selectedRecipe.id}
                  </span>
                  <p className="text-2xs text-surface-400 mt-2">Documento Digital Firmado</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200 text-xs">
                <div>
                  <p className="text-surface-500 font-bold uppercase text-[9px]">Paciente</p>
                  <p className="font-bold text-surface-850 text-sm mt-0.5">{profileName}</p>
                  <p className="text-surface-500 mt-1">ID: #8849-SP • Correo: {patientEmail}</p>
                </div>
                <div>
                  <p className="text-surface-500 font-bold uppercase text-[9px]">Fecha Prescripción</p>
                  <p className="font-bold text-surface-800 mt-0.5">{selectedRecipe.date}</p>
                  <p className="text-surface-555 mt-1">Validez: Hasta el {selectedRecipe.expiryDate}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary-900 uppercase tracking-widest border-b border-surface-200 pb-1.5">
                  Rx Prescripción Médica
                </h3>
                
                <div className="p-4 bg-surface-50/20 border border-dashed border-surface-300 rounded-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-extrabold text-surface-900">{selectedRecipe.medication}</h4>
                      <p className="text-xs font-semibold text-surface-600 mt-1">{selectedRecipe.dosage}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] font-bold text-primary-950 uppercase">Instrucciones de Dosificación:</p>
                    <p className="text-sm font-medium text-surface-700 leading-relaxed italic">
                      &ldquo;{selectedRecipe.instructions}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-surface-200 flex justify-between items-end gap-6">
                <div className="text-xs space-y-1">
                  <p className="font-bold text-surface-850">{selectedRecipe.doctor}</p>
                  <p className="text-[10px] text-surface-550">{selectedRecipe.specialty}</p>
                  <p className="text-[10px] text-surface-400 font-mono">{selectedRecipe.doctorLicense}</p>
                </div>
                
                <div className="flex flex-col items-center relative pr-4">
                  <div className="h-14 w-32 border-2 border-primary-700/60 rounded-lg flex flex-col items-center justify-center p-1 text-primary-750 rotate-3 font-serif select-none pointer-events-none bg-white/50 backdrop-blur-2xs">
                    <span className="text-[7px] font-bold uppercase tracking-wider">Médico Autorizado</span>
                    <span className="text-2xs font-extrabold uppercase my-0.5 tracking-tight font-sans">D.A. Ríos</span>
                    <span className="text-[7px] font-mono leading-none">REGISTRADO EN SISTEMA</span>
                  </div>
                  <span className="text-[9px] text-surface-400 font-mono mt-1">Firma Digital Verificada</span>
                </div>
              </div>

              <div className="border-t border-surface-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-surface-550 text-[10px]">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[9px] font-bold uppercase text-surface-400">Código de Verificación Único</span>
                  <span className="text-2xs font-mono font-medium text-surface-600">
                    SEC-TOKEN: {selectedRecipe.id}-A9812-7
                  </span>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 100 20" className="w-36 h-6 text-surface-900">
                    <rect x="0" y="0" width="2" height="20" fill="currentColor" />
                    <rect x="3" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="5" y="0" width="3" height="20" fill="currentColor" />
                    <rect x="10" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="13" y="0" width="2" height="20" fill="currentColor" />
                    <rect x="17" y="0" width="4" height="20" fill="currentColor" />
                    <rect x="23" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="25" y="0" width="2" height="20" fill="currentColor" />
                    <rect x="29" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="32" y="0" width="3" height="20" fill="currentColor" />
                    <rect x="37" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="40" y="0" width="2" height="20" fill="currentColor" />
                    <rect x="44" y="0" width="4" height="20" fill="currentColor" />
                    <rect x="50" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="53" y="0" width="3" height="20" fill="currentColor" />
                    <rect x="58" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="61" y="0" width="2" height="20" fill="currentColor" />
                    <rect x="65" y="0" width="4" height="20" fill="currentColor" />
                    <rect x="71" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="74" y="0" width="2" height="20" fill="currentColor" />
                    <rect x="78" y="0" width="3" height="20" fill="currentColor" />
                    <rect x="83" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="86" y="0" width="2" height="20" fill="currentColor" />
                    <rect x="90" y="0" width="4" height="20" fill="currentColor" />
                    <rect x="96" y="0" width="1" height="20" fill="currentColor" />
                    <rect x="98" y="0" width="2" height="20" fill="currentColor" />
                  </svg>
                  <span className="text-[7px] font-mono text-surface-400">Verificar autenticidad en portal.zenithclinica.com</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      <CredentialQrModal
        open={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        description=""
        displayName=""
        credentialLine={undefined}
        modalTitle={null}
        qrToken={qrToken}
        qrSecondsLeft={qrSecondsLeft}
        onRefresh={handleRefreshQR}
        onReturn={() => {
          setActiveSubTab('treatment');
        }}
      />

      {/* Mandatory Terms & Conditions Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-surface-950/75 backdrop-blur-sm" onClick={() => setIsTermsModalOpen(false)}></div>
          
          <div className="relative bg-surface-900 border border-surface-800 text-surface-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 bg-surface-950/40">
              <h3 className="zenith-section-title flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-400" />
                <span>Términos y Condiciones del Servicio</span>
              </h3>
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-surface-400 leading-relaxed">
              <p className="font-bold text-white">1. Tratamiento de Datos Personales y de Salud</p>
              <p>
                Al aceptar estos términos, autoriza expresamente al operador del servicio el tratamiento de sus datos sensibles de salud, incluyendo prescripciones médicas, medicamentos recetados y diagnóstico clínico relacionado, de acuerdo con la Ley Orgánica de Protección de Datos de Carácter Personal (LOPD). Sus datos serán confidenciales y procesados únicamente para fines de expendio farmacéutico.
              </p>
              
              <p className="font-bold text-white">2. Despacho y Recogida en Sucursales</p>
              <p>
                Los medicamentos serán reservados en la sucursal seleccionada durante un plazo máximo de 7 días hábiles a partir de la confirmación digital. Transcurrido este periodo, la orden será automáticamente cancelada y los productos serán reincorporados al stock disponible.
              </p>

              <p className="font-bold text-white">3. Validación Física de la Receta</p>
              <p>
                Para el retiro efectivo de medicamentos controlados o sujetos a prescripción obligatoria, el paciente deberá presentar la Credencial QR Dinámica vigente generada en esta aplicación, junto con su documento nacional de identidad original en el mostrador de atención.
              </p>
            </div>

            <div className="p-4 bg-surface-950/60 border-t border-surface-850 flex flex-col gap-3">
              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-surface-900/60 border border-surface-850 text-[11px] text-surface-350 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-primary-500 bg-surface-950 border-surface-800 focus:ring-0 cursor-pointer"
                />
                <span>He leído y acepto expresamente los términos de tratamiento de datos y políticas de retiro físico del servicio.</span>
              </label>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setTermsAccepted(false);
                    setIsTermsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#e11d48] hover:bg-[#c91840] !text-[#ffffff] rounded-lg text-xs font-semibold border border-[#c91840] transition-all cursor-pointer"
                >
                  Rechazar
                </button>
                <Button variant="patient" onClick={() => setIsTermsModalOpen(false)}>
                  Aceptar y Continuar
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL GLOBAL DE CONSENTIMIENTO ÉTICO (Tiempo Real) */}
      {showConsentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', maxWidth: '500px', textAlign: 'left', color: '#1e293b' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>⚠️ Autorización de Consulta Médica</h3>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', marginBottom: '15px', color: '#475569' }}>
              {termsText}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => handleResponderConsentimiento(true)} style={{ backgroundColor: 'green', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                Autorizar Ingreso
              </button>
              <button onClick={() => handleResponderConsentimiento(false)} style={{ backgroundColor: 'red', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
