'use client';

/**
 * @fileoverview Componente patient view.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Activity,
  User,
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
  Pill,
  Bell,
  TrendingUp,
  Sun,
  Sunset,
  Moon,
  History,
  Stethoscope,
  RefreshCw,
  Download,
  CreditCard
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
import { socket, SOCKET_RUNTIME_SUPPORTED } from '../lib/socket';
import {
  PATIENT_PORTAL_COPY,
  PATIENT_PROFILE_DEFAULTS,
} from '../data/mockData';

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
  patientId?: string | null;
  socketIdentity?: string | null;
  onLogout: () => void;
}


interface BackendPatientProfile {
  systemId: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  phone: string;
  condition: string;
  allergies: string;
  lastVisit: string;
  deliveryAddress: string;
  deliveryState: string;
  deliveryMunicipio: string;
  medications: string[];
}

interface PatientProfileDraft {
  name: string;
  phone: string;
  deliveryAddress: string;
  deliveryState: string;
  deliveryMunicipio: string;
}

/**
 * Detecta patrones sospechosos en texto libre antes de enviarlo al backend.
 * @param {string} value - Valor a inspeccionar.
 * @returns {boolean} `true` si el valor parece malicioso.
 */
const containsSuspiciousPattern = (value: string) => /('|--|;|\/\*|\*\/|union|select|insert|delete|drop|update|<script)/i.test(value);

/**
 * Crea un borrador vacio del perfil editable del paciente.
 * @returns {PatientProfileDraft} Borrador inicial seguro.
 */
function createEmptyPatientProfileDraft(): PatientProfileDraft {
  return {
    name: '',
    phone: PATIENT_PROFILE_DEFAULTS.profilePhone,
    deliveryAddress: PATIENT_PROFILE_DEFAULTS.deliveryAddress,
    deliveryState: PATIENT_PROFILE_DEFAULTS.deliveryState,
    deliveryMunicipio: PATIENT_PROFILE_DEFAULTS.deliveryMunicipio,
  };
}

/**
 * Extrae el subconjunto editable del perfil real del paciente.
 * @param {BackendPatientProfile | null} profile - Perfil backend consolidado.
 * @param {string} fallbackName - Nombre de respaldo de la sesion.
 * @returns {PatientProfileDraft} Datos listos para el formulario.
 */
function buildPatientProfileDraft(profile: BackendPatientProfile | null, fallbackName: string): PatientProfileDraft {
  return {
    name: profile?.name || fallbackName || '',
    phone: profile?.phone || PATIENT_PROFILE_DEFAULTS.profilePhone,
    deliveryAddress: profile?.deliveryAddress || PATIENT_PROFILE_DEFAULTS.deliveryAddress,
    deliveryState: profile?.deliveryState || PATIENT_PROFILE_DEFAULTS.deliveryState,
    deliveryMunicipio: profile?.deliveryMunicipio || PATIENT_PROFILE_DEFAULTS.deliveryMunicipio,
  };
}

/**
 * Valida el borrador editable del perfil antes de persistirlo.
 * @param {PatientProfileDraft} draft - Datos capturados en UI.
 * @returns {string | null} Mensaje de error o `null` si es valido.
 */
interface ValidationError {
  field: string;
  message: string;
}

function validatePatientProfileDraft(draft: PatientProfileDraft): ValidationError | null {
  const normalized = {
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    deliveryAddress: draft.deliveryAddress.trim(),
    deliveryState: draft.deliveryState.trim(),
    deliveryMunicipio: draft.deliveryMunicipio.trim(),
  };

  if (Object.values(normalized).some(containsSuspiciousPattern)) {
    return { field: 'general', message: 'Se detectaron caracteres inseguros en el formulario.' };
  }

  if (!/^[\p{L}\p{N}\s.'-]{3,120}$/u.test(normalized.name)) {
    return { field: 'name', message: 'No se pudo modificar los datos del usuario. Nombre inválido. Formato esperado: Solo letras, números y espacios, entre 3 y 120 caracteres.' };
  }

  if (!/^[+\d\s()-]{7,20}$/.test(normalized.phone)) {
    return { field: 'phone', message: 'No se pudo modificar los datos del usuario. Teléfono inválido. Formato esperado: Ej. +58 412 1234567 (entre 7 y 20 caracteres).' };
  }

  if (!/^[\p{L}\p{N}\s.,#()"'-]{5,200}$/u.test(normalized.deliveryAddress)) {
    return { field: 'deliveryAddress', message: 'No se pudo modificar los datos del usuario. Dirección inválida. Formato esperado: Al menos 5 caracteres válidos.' };
  }

  if (!/^[\p{L}\s.'-]{3,80}$/u.test(normalized.deliveryState)) {
    return { field: 'deliveryState', message: 'No se pudo modificar los datos del usuario. Estado inválido. Formato esperado: Solo letras, mínimo 3 caracteres.' };
  }

  if (!/^[\p{L}\p{N}\s.'-]{3,120}$/u.test(normalized.deliveryMunicipio)) {
    return { field: 'deliveryMunicipio', message: 'No se pudo modificar los datos del usuario. Municipio inválido. Formato esperado: Al menos 3 caracteres.' };
  }

  return null;
}

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

interface BackendPrescriptionItem {
  id_producto: string;
  nombre: string;
  dosis: string;
  cantidad: number;
  daily_doses?: number;
  treatment_days?: number;
  precio_unitario_base: number;
  precio_unitario_final: number;
  subtotal_base?: number;
  subtotal_final?: number;
  beneficio_pct: number;
}

interface BackendPrescription {
  recipeId: string;
  createdAt: string;
  recipeExpiresAt?: string;
  doctorName?: string | null;
  doctorSpecialty?: string | null;
  doctorLicense?: string | null;
  clinicalStatus?: string;
  commercialStatus?: string;
  fulfillmentStatus?: string;
  status?: string;
  totals?: {
    subtotal_base?: number;
    subtotal_descuento?: number;
    total_final?: number;
  };
  items: BackendPrescriptionItem[];
}

interface PaymentOrderState {
  orderId: string;
  recipeId: string;
  status: string;
  amount: number;
  currency?: string;
  redirectReady?: boolean;
  redirectUrl?: string | null;
  nextAction?: string | null;
  holdExpiresAt?: string | null;
  paymentReference?: string | null;
  gatewayTransactionId?: string | null;
  paidAt?: string | null;
}

interface InventoryHoldState {
  recipeId: string;
  status: string;
  expiresAt?: string | null;
  releaseReason?: string | null;
}

interface CheckoutSessionState {
  order: PaymentOrderState;
  hold: InventoryHoldState | null;
}

interface BackendTrackingItem {
  id_producto: string;
  nombre: string;
  totalPrescribedDoses: number;
  totalDispensedDoses: number;
  availableDoses: number;
  consumedDoses: number;
  averageDailyConsumption: number;
  estimatedDaysRemaining: number | null;
  refillAlertActive: boolean;
  lastAlertAt: string | null;
  intakeLogs: Array<{ logId: string; dosesTaken: number; takenAt: string }>;
}

interface BackendTrackingProfile {
  recipeId: string;
  patientId: string;
  status: string;
  updatedAt: string;
  items: BackendTrackingItem[];
}

interface TreatmentMedication {
  id: string;
  productId: string;
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

interface DoseLog {
  id: string;
  recipeId: string;
  productId: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'Tomada' | 'Omitida' | 'Pendiente';
  date: string;
}

interface TreatmentAlert {
  id: string;
  type: 'recordatorio' | 'control' | 'renovacion';
  title: string;
  message: string;
  date: string;
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
 * Suma una cantidad de meses a una fecha ISO.
 * @param {string} dateIso - Fecha base en formato ISO.
 * @param {number} months - Cantidad de meses a sumar.
 * @returns {Date} Fecha resultante.
 */
const addMonths = (dateIso: string, months: number) => {
  const date = new Date(dateIso);
  date.setMonth(date.getMonth() + months);
  return date;
};

/**
 * Formatea una fecha ISO al formato de visualizacion del portal paciente.
 * @param {string} dateIso - Fecha en formato ISO.
 * @returns {string} Fecha formateada para la UI.
 */
const formatRecipeDate = (dateIso: string) =>
  new Date(dateIso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Construye la firma corta visible del médico emisor para el comprobante imprimible.
 * @param {string} doctorName - Nombre visible del médico.
 * @returns {string} Iniciales compactas del profesional.
 */
const buildDoctorSignatureLabel = (doctorName: string) => {
  const source = (doctorName || PATIENT_PORTAL_COPY.fallbackDoctorName).replace(/^Dr\.?\s+/i, '').trim();
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('.');

  return initials ? `${initials}.` : 'MD';
};

/**
 * Convierte una receta backend en filas visuales para la tabla de recipes del paciente.
 * @param {BackendPrescription} prescription - Receta devuelta por el backend.
 * @returns {Recipe[]} Recipes adaptados al portal paciente.
 */
const mapBackendPrescriptionToRecipes = (prescription: BackendPrescription): Recipe[] => {
  const createdAt = prescription.createdAt || new Date().toISOString();
  const expirySource = prescription.recipeExpiresAt || addMonths(createdAt, 6).toISOString();
  const expiryDate = formatRecipeDate(expirySource);
  const status = prescription.clinicalStatus === 'expired' ? 'Expirado' : 'Activo';

  return (Array.isArray(prescription.items) ? prescription.items : []).map((item, index) => ({
    id: `${prescription.recipeId}${index > 0 ? `-${index + 1}` : ''}`,
    date: formatRecipeDate(createdAt),
    expiryDate,
    medication: item.nombre,
    dosage: `${item.cantidad} unidad(es)`,
    instructions: item.dosis || 'Seguir indicaciones médicas.',
    doctor: prescription.doctorName || PATIENT_PORTAL_COPY.fallbackDoctorName,
    specialty: prescription.doctorSpecialty || PATIENT_PORTAL_COPY.fallbackSpecialty,
    doctorLicense: prescription.doctorLicense || PATIENT_PORTAL_COPY.doctorLicenseLabel,
    status,
  }));
};

const buildTreatmentId = (recipeId: string, productId: string) => `${recipeId}::${productId}`;

const formatDoseDateLabel = (dateIso: string) =>
  new Date(dateIso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

const buildScheduleTimes = (dailyDoses: number) => {
  const normalized = Math.max(1, Math.min(4, Number(dailyDoses || 1)));
  if (normalized === 1) return ['08:00'];
  if (normalized === 2) return ['08:00', '20:00'];
  if (normalized === 3) return ['08:00', '14:00', '20:00'];
  return ['06:00', '12:00', '18:00', '22:00'];
};

const buildTreatmentsFromTracking = (
  profiles: BackendTrackingProfile[],
  prescriptions: BackendPrescription[]
): TreatmentMedication[] =>
  profiles.flatMap((profile) => {
    const recipe = prescriptions.find((entry) => entry.recipeId === profile.recipeId);
    return (profile.items || []).map((item) => {
      const prescriptionItem = recipe?.items?.find((candidate) => candidate.id_producto === item.id_producto);
      const totalDoses = Number(item.totalDispensedDoses || item.totalPrescribedDoses || 0);
      const takenDoses = Number(item.consumedDoses || 0);
      return {
        id: buildTreatmentId(profile.recipeId, item.id_producto),
        productId: item.id_producto,
        name: item.nombre,
        dosage: prescriptionItem?.dosis || 'Seguir indicaciones médicas',
        frequency: item.averageDailyConsumption > 0 ? `${item.averageDailyConsumption.toFixed(2)} dosis/día` : 'Seguimiento activo',
        scheduleTimes: buildScheduleTimes(Number(prescriptionItem?.daily_doses || 1)),
        startDate: formatRecipeDate(recipe?.createdAt || new Date().toISOString()),
        endDate: formatRecipeDate(recipe?.recipeExpiresAt || new Date().toISOString()),
        doctor: recipe?.doctorName || PATIENT_PORTAL_COPY.fallbackDoctorName,
        specialty: recipe?.doctorSpecialty || PATIENT_PORTAL_COPY.fallbackSpecialty,
        recipeId: profile.recipeId,
        totalDoses,
        takenDoses,
        status: item.availableDoses <= 0 ? 'Completado' : 'En curso',
        instructions: prescriptionItem?.dosis || 'Seguir indicaciones médicas.',
      };
    });
  });

const buildDoseLogsFromTracking = (profiles: BackendTrackingProfile[]): DoseLog[] =>
  profiles.flatMap((profile) =>
    (profile.items || []).flatMap((item) =>
      (item.intakeLogs || []).map((log) => ({
        id: log.logId,
        recipeId: profile.recipeId,
        productId: item.id_producto,
        medicationId: buildTreatmentId(profile.recipeId, item.id_producto),
        medicationName: item.nombre,
        scheduledTime: new Date(log.takenAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
        takenAt: new Date(log.takenAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: 'Tomada' as const,
        date: formatDoseDateLabel(log.takenAt),
      }))
    )
  ).sort((left, right) => new Date(`${left.date} ${left.scheduledTime}`).getTime() - new Date(`${right.date} ${right.scheduledTime}`).getTime());

const buildTreatmentAlertsFromTracking = (profiles: BackendTrackingProfile[], prescriptions: BackendPrescription[]): TreatmentAlert[] => {
  const refillAlerts = profiles.flatMap((profile) =>
    (profile.items || [])
      .filter((item) => item.refillAlertActive)
      .map((item) => ({
        id: `refill-${profile.recipeId}-${item.id_producto}`,
        type: 'recordatorio' as const,
        title: `Reposición sugerida para ${item.nombre}`,
        message: item.estimatedDaysRemaining !== null
          ? `Quedan aproximadamente ${item.estimatedDaysRemaining} días de tratamiento disponibles.`
          : 'El tratamiento est? activo y requiere seguimiento de reposición.',
        date: formatDoseDateLabel(item.lastAlertAt || new Date().toISOString()),
      }))
  );

  const renewalAlerts = prescriptions
    .filter((prescription) => Boolean(prescription.recipeExpiresAt))
    .filter((prescription) => {
      const expiry = new Date(prescription.recipeExpiresAt || '').getTime();
      const diffDays = Math.ceil((expiry - Date.now()) / 86400000);
      return Number.isFinite(diffDays) && diffDays >= 0 && diffDays <= 15;
    })
    .map((prescription) => ({
      id: `renewal-${prescription.recipeId}`,
      type: 'renovacion' as const,
      title: `Renovación de receta ${prescription.recipeId}`,
      message: `La receta vence el ${formatRecipeDate(prescription.recipeExpiresAt || new Date().toISOString())}. Solicite renovación con anticipación.`,
      date: formatRecipeDate(prescription.recipeExpiresAt || new Date().toISOString()),
    }));

  return [...refillAlerts, ...renewalAlerts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
};

const deriveOrderDeliveryStatus = (
  checkoutSession: CheckoutSessionState | null,
  activePrescription: BackendPrescription | null
): 'Pendiente por retirar' | 'Listo para retirar' | 'Retirado' => {
  if (activePrescription?.fulfillmentStatus === 'fully_fulfilled') {
    return 'Retirado';
  }

  if (checkoutSession?.order?.status === 'payment_confirmed' || activePrescription?.commercialStatus === 'paid') {
    return 'Listo para retirar';
  }

  return 'Pendiente por retirar';
};

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
export default function PatientView({ patientName, patientEmail, patientId, socketIdentity, onLogout }: PatientViewProps) {
  // Navigation Tabs: 'recipes' | 'treatment' | 'proposals' | 'payment' | 'voucher' | 'delivery' | 'profile'
  const [activeSubTab, setActiveSubTab] = useState<'recipes' | 'treatment' | 'proposals' | 'payment' | 'voucher' | 'delivery' | 'profile'>('treatment');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [backendPrescriptions, setBackendPrescriptions] = useState<BackendPrescription[]>([]);
  const [activeCheckoutRecipeId, setActiveCheckoutRecipeId] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState('');

  // Treatment tracking states
  const [trackingProfiles, setTrackingProfiles] = useState<BackendTrackingProfile[]>([]);
  const [doseSuccessMsg, setDoseSuccessMsg] = useState('');
  const [treatmentPanel, setTreatmentPanel] = useState<'today' | 'medications' | 'progress'>('today');

  // Estados para el QR y el Tiempo (Módulo 1 / Sprint #2)
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutos en segundos
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Estados para el flujo de Consentimiento Ético
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [termsText, setTermsText] = useState<string>("");


  const socketPatientIdentity = socketIdentity || patientId || patientEmail;
  const qrIdentitySeed = String(socketPatientIdentity || patientEmail || 'PX-000');
  const qrSeedLeft = qrIdentitySeed.slice(0, 6).toUpperCase();
  const qrSeedRight = qrIdentitySeed.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase() || '0000';

  const {
    qrToken,
    qrSecondsLeft,
    isCredentialModalOpen,
    setIsCredentialModalOpen,
    handleRefreshQR,
  } = useCredentialQr(qrSeedLeft, qrSeedRight);

  const activeCheckoutPrescription = useMemo(() => {
    if (!backendPrescriptions.length) return null;
    return (
      backendPrescriptions.find((prescription) => prescription.recipeId === activeCheckoutRecipeId) ||
      backendPrescriptions[backendPrescriptions.length - 1] ||
      null
    );
  }, [activeCheckoutRecipeId, backendPrescriptions]);

  const proposalItems = useMemo<ProposalItem[]>(() => {
    if (!activeCheckoutPrescription) return [];

    return (Array.isArray(activeCheckoutPrescription.items) ? activeCheckoutPrescription.items : []).map((item, index) => ({
      id: `${activeCheckoutPrescription.recipeId}-${index + 1}`,
      medication: item.nombre,
      quantity: Number(item.cantidad || 0),
      unitPrice: Number(item.precio_unitario_base || item.precio_unitario_final || 0),
      discountPercent: Number(item.beneficio_pct || 0),
    }));
  }, [activeCheckoutPrescription]);
  const [selectedBranch, setSelectedBranch] = useState(PATIENT_PORTAL_COPY.selectedBranchOptions[0]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Payment States (Pantalla P.3)
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(PATIENT_PORTAL_COPY.paymentHoldSeconds); // 15 minutes in seconds
  const [simulatedPaymentReference, setSimulatedPaymentReference] = useState('');
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionState | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');

  const treatments = useMemo(() => buildTreatmentsFromTracking(trackingProfiles, backendPrescriptions), [trackingProfiles, backendPrescriptions]);
  const trackedDoseLogs = useMemo(() => buildDoseLogsFromTracking(trackingProfiles), [trackingProfiles]);
  const doseLogs = useMemo<DoseLog[]>(() => {
    const todayLabel = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const pendingLogs = treatments.flatMap((treatment) =>
      treatment.status !== 'En curso'
        ? []
        : treatment.scheduleTimes
          .filter((time) =>
            !trackedDoseLogs.some((log) =>
              log.recipeId === treatment.recipeId &&
              log.productId === treatment.productId &&
              log.date === todayLabel &&
              log.scheduledTime === time
            )
          )
          .map((time, index) => ({
            id: `pending-${treatment.id}-${time}-${index + 1}`,
            recipeId: treatment.recipeId,
            productId: treatment.productId,
            medicationId: treatment.id,
            medicationName: treatment.name,
            scheduledTime: time,
            takenAt: undefined,
            status: 'Pendiente' as const,
            date: todayLabel,
          }))
    );

    return [...trackedDoseLogs, ...pendingLogs].sort((left, right) => {
      const leftKey = `${left.date}-${left.scheduledTime}`;
      const rightKey = `${right.date}-${right.scheduledTime}`;
      return leftKey.localeCompare(rightKey);
    });
  }, [trackedDoseLogs, treatments]);
  const treatmentAlerts = useMemo(() => buildTreatmentAlertsFromTracking(trackingProfiles, backendPrescriptions), [trackingProfiles, backendPrescriptions]);
  const lastOrderStatus = useMemo(
    () => deriveOrderDeliveryStatus(checkoutSession, activeCheckoutPrescription),
    [activeCheckoutPrescription, checkoutSession]
  );
  const hasActiveCartReserve = Boolean(
    checkoutSession?.order?.status === 'checkout_pending' && paymentTimeLeft > 0
  );
  const proposalStatusMessage =
    !checkoutError && activeSubTab === 'proposals' && activeCheckoutPrescription && !hasActiveCartReserve
      ? 'Expiró la reserva del carrito.'
      : '';

  // Voucher info
  const voucherId =
    simulatedPaymentReference ||
    checkoutSession?.order?.paymentReference ||
    checkoutSession?.order?.gatewayTransactionId ||
    checkoutSession?.order?.recipeId ||
    'PENDIENTE';

  // Profile Settings State (Pantalla P.5)
  const [patientProfile, setPatientProfile] = useState<BackendPatientProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<PatientProfileDraft>(() => createEmptyPatientProfileDraft());
  const [unselectedItemIds, setUnselectedItemIds] = useState<Set<string>>(new Set());

  const toggleItemSelection = (id: string) => {
    setUnselectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<ValidationError | null>(null);
  const [profileSaveMsg, setProfileSaveMsg] = useState('');
  const profileName = patientProfile?.name || patientName;
  const profilePhone = patientProfile?.phone || PATIENT_PROFILE_DEFAULTS.profilePhone;
  const deliveryAddress = patientProfile?.deliveryAddress || PATIENT_PROFILE_DEFAULTS.deliveryAddress;
  const deliveryState = patientProfile?.deliveryState || PATIENT_PROFILE_DEFAULTS.deliveryState;
  const deliveryMunicipio = patientProfile?.deliveryMunicipio || PATIENT_PROFILE_DEFAULTS.deliveryMunicipio;
  const profileSystemId = patientProfile?.systemId || patientId || null;
  const qrPatientIdentity = profileSystemId || socketPatientIdentity;

  useEffect(() => {
    let cancelled = false;

    const loadRecipes = async () => {
      try {
        setRecipesLoading(true);
        setRecipesError('');
        const response = await apiClient.get(`/prescripciones/paciente/${encodeURIComponent(socketPatientIdentity)}`);
        const backendItems = Array.isArray(response.data?.items) ? response.data.items : [];
        const mappedRecipes = backendItems.flatMap(mapBackendPrescriptionToRecipes);
        const latestRecipeId = backendItems.length ? backendItems[backendItems.length - 1]?.recipeId || '' : '';

        if (!cancelled) {
          setBackendPrescriptions(backendItems);
          setRecipes(mappedRecipes);
          setActiveCheckoutRecipeId((current) =>
            current && backendItems.some((prescription: BackendPrescription) => prescription.recipeId === current)
              ? current
              : latestRecipeId
          );
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const apiError = error as ApiErrorPayload;
          setBackendPrescriptions([]);
          setRecipes([]);
          setActiveCheckoutRecipeId('');
          setRecipesError(apiError.response?.data?.error || 'No se pudieron cargar los recipes del paciente.');
        }
      } finally {
        if (!cancelled) {
          setRecipesLoading(false);
        }
      }
    };

    if (socketPatientIdentity) {
      loadRecipes();
    }

    return () => {
      cancelled = true;
    };
  }, [socketPatientIdentity]);

  useEffect(() => {
    let cancelled = false;

    const loadPatientProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        const response = await apiClient.get('/pacientes/perfil/actual');
        const nextProfile = response.data as BackendPatientProfile;

        if (!cancelled) {
          setPatientProfile(nextProfile);
          setProfileDraft(buildPatientProfileDraft(nextProfile, patientName));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const apiError = error as ApiErrorPayload;
          setProfileError({
            field: 'general',
            message: apiError.response?.data?.error ||
            apiError.response?.data?.details ||
            'No se pudo cargar el perfil real del paciente.'
          });
          setPatientProfile(null);
          setProfileDraft(buildPatientProfileDraft(null, patientName));
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    void loadPatientProfile();

    return () => {
      cancelled = true;
    };
  }, [patientName]);

  useEffect(() => {
    let cancelled = false;

    const loadTrackingProfiles = async () => {
      if (!backendPrescriptions.length) {
        if (!cancelled) {
          setTrackingProfiles([]);
        }
        return;
      }

      const results = await Promise.allSettled(
        backendPrescriptions.map((prescription) =>
          apiClient.get(`/seguimiento/recetas/${encodeURIComponent(prescription.recipeId)}`)
        )
      );

      if (!cancelled) {
        setTrackingProfiles(
          results.flatMap((result) =>
            result.status === 'fulfilled' ? [result.value.data as BackendTrackingProfile] : []
          )
        );
      }
    };

    void loadTrackingProfiles();

    return () => {
      cancelled = true;
    };
  }, [backendPrescriptions]);

  // WebSockets: estado de solicitud entrante usando `patientId` interno
  const [incomingConsent, setIncomingConsent] = useState<{ doctorId: string; doctorName: string; patientId: string } | null>(null);

  // =========================================================
  // 1. EFECTO: Sincronización WebSockets (Tiempo Real)
  // =========================================================
  useEffect(() => {
    if (!SOCKET_RUNTIME_SUPPORTED) {
      return undefined;
    }

    // 1. Encendemos el socket global
    socket.connect();

    const identify = () => {
      // Registramos al paciente con su ID interno mock para el flujo WebSocket
      const targetPatientId = socketPatientIdentity;

      console.log(`?? Registrando paciente en Socket local con ID interno: ${targetPatientId}`);

      // Enviamos la petición unificada que tu server.js espera
      socket.emit('identifyUser', {
        userId: targetPatientId,
        role: 'patient',
        name: profileName || PATIENT_PORTAL_COPY.fallbackPatientName
      });
    };

    if (socket.connected) identify();
    socket.on('connect', identify);

    // 2. FUSIONAMOS LAS DOS LÓGICAS EN UNA SOLA FUNCIÓN RECEPTORA
    const handleIncomingRequest = async (data: { doctorId: string; doctorName: string; patientId: string }) => {
      console.log('🎯 ¡Solicitud de vinculación real recibida por el canal del Servidor!:', data);

      // Guardamos la información del médico entrante para el modal
      setIncomingConsent(data);

      try {
        // Consultamos dinámicamente los términos desde el backend
        const response = await apiClient.get('/consentimiento/terminos');
        setTermsText(response.data?.texto || response.data?.data?.terminos || '');
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
  }, [profileName, socketPatientIdentity]);

  // =========================================================
  // 2. EFECTO: Cuenta regresiva del QR efímero
  // =========================================================
  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0) {
      return undefined;
    }

    const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  useEffect(() => {
    if (!isTimerActive || timeLeft !== 0) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setQrImage(null);
      setIsTimerActive(false);
    }, 0);

    return () => clearTimeout(timeout);
  }, [isTimerActive, timeLeft]);

  // =========================================================
  // 3. FUNCIONES: Acciones de Negocio
  // =========================================================
  const handleGenerarQR = async () => {
    try {
      // Pedimos el token encriptado en AES-256 transformado a Base64
      const response = await apiClient.get(`/qr/generate/${encodeURIComponent(qrPatientIdentity)}`);
      setQrImage(response.data?.qr_image || response.data?.qrImageBase64 || null);
      setTimeLeft(300); // Reseteamos el reloj a 5 minutos
      setIsTimerActive(true);
    } catch (error) {
      console.error("Error generando el código QR de seguridad:", error);
    }
  };

  const handleResponderConsentimiento = (aceptado: boolean) => {
    handleConsentResponse(aceptado);
  };

  const handleConsentResponse = (accepted: boolean) => {
    if (incomingConsent) {
      socket.emit('consentResponse', {
        doctorId: incomingConsent.doctorId,
        patientId: incomingConsent.patientId,
        patientName: profileName,
        accepted,
      });
      setIncomingConsent(null);
    }
    setShowConsentModal(false);
  };

  /**
   * Habilita la edicion explicita del perfil del paciente.
   * @returns {void}
   */
  const handleStartProfileEdit = () => {
    setProfileDraft(buildPatientProfileDraft(patientProfile, patientName));
    setProfileError(null);
    setProfileSaveMsg('');
    setIsEditingProfile(true);
  };

  /**
   * Cancela la edicion y restaura la vista segura de solo lectura.
   * @returns {void}
   */
  const handleCancelProfileEdit = () => {
    setProfileDraft(buildPatientProfileDraft(patientProfile, patientName));
    setProfileError(null);
    setIsEditingProfile(false);
  };

  /**
   * Persiste el perfil del paciente autenticado usando el endpoint real.
   * @returns {Promise<void>}
   */
  const handleConfirmProfileEdit = async () => {
    const validationError = validatePatientProfileDraft(profileDraft);
    if (validationError) {
      setProfileError(validationError);
      setProfileSaveMsg('');
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError(null);
      const payload = {
        name: profileDraft.name.trim(),
        phone: profileDraft.phone.trim(),
        deliveryAddress: profileDraft.deliveryAddress.trim(),
        deliveryState: profileDraft.deliveryState.trim(),
        deliveryMunicipio: profileDraft.deliveryMunicipio.trim(),
      };
      const response = await apiClient.put('/pacientes/perfil/actual', payload);
      const nextProfile = response.data?.patient as BackendPatientProfile;
      setPatientProfile(nextProfile);
      setProfileDraft(buildPatientProfileDraft(nextProfile, patientName));
      setIsEditingProfile(false);
      setProfileSaveMsg('Perfil actualizado correctamente.');
      setTimeout(() => setProfileSaveMsg(''), 3000);
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload;
      setProfileError({
        field: 'general',
        message: apiError.response?.data?.error ||
          apiError.response?.data?.details ||
          'No se pudo actualizar el perfil del paciente.'
      });
    } finally {
      setProfileLoading(false);
    }
  };

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
      if (!unselectedItemIds.has(item.id)) {
        grossTotal += item.unitPrice * item.quantity;
        totalSavings += (item.unitPrice * item.quantity) * (item.discountPercent / 100);
      }
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

  /**
   * Sincroniza el estado del checkout recibido desde backend con la UI local.
   * @param {CheckoutSessionState | null} nextSession - Sesion de checkout consolidada.
   * @param {boolean} [moveToVoucher=false] - Indica si debe navegar automaticamente al comprobante.
   */
  const applyCheckoutSession = (nextSession: CheckoutSessionState | null, moveToVoucher = false) => {
    setCheckoutSession(nextSession);

    const expirationCandidate = nextSession?.hold?.expiresAt || nextSession?.order?.holdExpiresAt || null;
    if (expirationCandidate) {
      const secondsLeft = Math.max(0, Math.floor((new Date(expirationCandidate).getTime() - Date.now()) / 1000));
      setPaymentTimeLeft(secondsLeft);
    }

    if (nextSession?.order?.paymentReference || nextSession?.order?.gatewayTransactionId) {
      setSimulatedPaymentReference(
        nextSession.order.paymentReference || nextSession.order.gatewayTransactionId || ''
      );
    }

    if (nextSession?.order?.status === 'payment_confirmed') {
      if (moveToVoucher) {
        setActiveSubTab('delivery');
      }
    }
  };

  /**
   * Consulta en backend la orden y la reserva asociadas a una receta.
   * @param {string} recipeId - Identificador canonico de la receta/orden.
   * @returns {Promise<CheckoutSessionState>} Estado consolidado del checkout.
   */
  const fetchCheckoutSession = async (recipeId: string): Promise<CheckoutSessionState> => {
    const [orderResult, holdResult] = await Promise.allSettled([
      apiClient.get(`/pagos/recetas/${encodeURIComponent(recipeId)}`),
      apiClient.get(`/pagos/reservas/${encodeURIComponent(recipeId)}`),
    ]);

    if (orderResult.status !== 'fulfilled') {
      throw orderResult.reason;
    }

    return {
      order: orderResult.value.data as PaymentOrderState,
      hold: holdResult.status === 'fulfilled' ? (holdResult.value.data as InventoryHoldState) : null,
    };
  };

  const activeTreatments = treatments.filter((t) => t.status === 'En curso');
  const todayLabel = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const todayDoses = doseLogs.filter((d) => d.date === todayLabel);
  const pendingTodayDoses = todayDoses.filter((d) => d.status === 'Pendiente');
  const nextPendingDose = pendingTodayDoses[0];

  const getTreatmentProgress = (treatment: TreatmentMedication) =>
    Math.round((treatment.takenDoses / treatment.totalDoses) * 100);

  const totalPlannedDoses = activeTreatments.reduce((sum, treatment) => sum + treatment.totalDoses, 0);
  const totalTakenDoses = activeTreatments.reduce((sum, treatment) => sum + treatment.takenDoses, 0);
  const globalAdherencePercent = totalPlannedDoses
    ? Math.round((totalTakenDoses / totalPlannedDoses) * 100)
    : 0;
  const completedTreatments = treatments.filter((treatment) => treatment.status === 'Completado').length;

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

  const handleMarkDoseTaken = async (doseId: string) => {
    const dose = doseLogs.find((entry) => entry.id === doseId);
    if (!dose || dose.status !== 'Pendiente') return;

    try {
      await apiClient.post('/seguimiento/ingestas', {
        recipeId: dose.recipeId,
        productId: dose.productId,
        dosesTaken: 1,
        takenAt: new Date().toISOString(),
      });

      const refreshedProfile = await apiClient.get(`/seguimiento/recetas/${encodeURIComponent(dose.recipeId)}`);
      setTrackingProfiles((prev) => {
        const next = prev.filter((profile) => profile.recipeId !== dose.recipeId);
        return [...next, refreshedProfile.data as BackendTrackingProfile];
      });
      setDoseSuccessMsg(`Toma de ${dose.medicationName} registrada correctamente.`);
      setTimeout(() => setDoseSuccessMsg(''), 3000);
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload;
      setRecipesError(
        apiError.response?.data?.error ||
        apiError.response?.data?.details ||
        'No se pudo registrar la toma del medicamento.'
      );
    }
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


  // Countdown Timer for Payment Gateway (P.3)
  useEffect(() => {
    if (activeSubTab !== 'payment' || paymentTimeLeft <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setPaymentTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSubTab, paymentTimeLeft]);

  useEffect(() => {
    if (
      activeSubTab !== 'payment' ||
      paymentTimeLeft !== 0 ||
      checkoutSession?.order?.status === 'payment_confirmed'
    ) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setCheckoutError('La reserva de inventario expiró y pronto volverá a stock.');
      setPaymentStatusMessage('La reserva venció antes de recibir confirmación de pago.');
      setActiveSubTab('proposals');
      setCheckoutSession((current) =>
        current
          ? {
            ...current,
            order: {
              ...current.order,
              status: 'expired',
              nextAction: 'recreate_checkout',
            },
          }
          : current
      );
    }, 0);

    return () => clearTimeout(timeout);
  }, [activeSubTab, checkoutSession?.order?.status, paymentTimeLeft]);

  useEffect(() => {
    if (activeSubTab !== 'payment' || !checkoutSession?.order?.recipeId) {
      return;
    }

    if (['payment_confirmed', 'expired'].includes(checkoutSession.order.status)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const session = await fetchCheckoutSession(checkoutSession.order.recipeId);
        applyCheckoutSession(session, session.order.status === 'payment_confirmed');
        if (session.order.status === 'payment_confirmed') {
          setPaymentStatusMessage('Pago confirmado por la pasarela. Ya puede retirar el pedido.');
        }
      } catch {
        // Polling silencioso para no bloquear la UI del paciente.
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [activeSubTab, checkoutSession?.order?.recipeId, checkoutSession?.order?.status]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('paymentResult');
    const returnedRecipeId = params.get('recipeId');

    if (!paymentResult || !returnedRecipeId) {
      return;
    }

    const validateReturnedPayment = async () => {
      try {
        setCheckoutLoading(true);
        setCheckoutError('');
        const session = await fetchCheckoutSession(returnedRecipeId);
        applyCheckoutSession(session, session.order.status === 'payment_confirmed');
        setActiveCheckoutRecipeId(returnedRecipeId);

        if (paymentResult === 'paid' && session.order.status === 'payment_confirmed') {
          setPaymentStatusMessage('Compra validada correctamente. El pedido qued\u00F3 listo para continuar con el proceso de delivery.');
          setActiveSubTab('delivery');
        } else if (paymentResult === 'cancelled') {
          setPaymentStatusMessage('Pago cancelado. La reserva fue liberada y podés recrear el carrito si aún hay disponibilidad.');
          setActiveSubTab('proposals');
        } else {
          setCheckoutError('No se pudo validar la compra finalizada. Actualizá el estado para reintentar.');
          setActiveSubTab('payment');
        }
      } catch (error: unknown) {
        const apiError = error as ApiErrorPayload;
        setCheckoutError(
          apiError.response?.data?.error ||
          apiError.response?.data?.details ||
          'No se pudo validar el resultado de la pasarela.'
        );
        setActiveSubTab('payment');
      } finally {
        setCheckoutLoading(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    void validateReturnedPayment();
  }, []);

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

  /**
   * Crea el checkout real en backend para la receta actualmente seleccionada.
   * @returns {Promise<void>}
   */
  const handleConfirmOrder = async () => {
    if (!termsAccepted) {
      alert('Debe aceptar los Términos y Condiciones del servicio.');
      return;
    }

    if (!activeCheckoutPrescription?.recipeId) {
      setCheckoutError('No hay una receta disponible para iniciar el checkout.');
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError('');
      setPaymentStatusMessage('');
      setSimulatedPaymentReference('');

      const selectedItemsToBuy = proposalItems
        .filter(i => !unselectedItemIds.has(i.id))
        .map(i => ({ productId: i.id, quantity: i.quantity }));

      const response = await apiClient.post('/pagos/redireccion', {
        recipeId: activeCheckoutPrescription.recipeId,
        selectedItems: selectedItemsToBuy,
      });

      const session: CheckoutSessionState = {
        order: response.data?.order as PaymentOrderState,
        hold: (response.data?.hold || null) as InventoryHoldState | null,
      };

      if (response.data?.order?.redirectUrl) {
        window.location.href = response.data.order.redirectUrl;
        return;
      }

      applyCheckoutSession(session);
      setPaymentStatusMessage(response.data?.message || 'Checkout creado correctamente.');
      setActiveSubTab('payment');
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload;
      const backendMessage =
        apiError.response?.data?.details ||
        apiError.response?.data?.error ||
        '';
      const inventoryUnavailable = /insuficiente|agotad|sin stock|sin inventario|reserva/i.test(backendMessage);
      setCheckoutError(
        inventoryUnavailable
          ? 'Se agotaron las reservas. Se hará restock pronto.'
          : apiError.response?.data?.error ||
          apiError.response?.data?.details ||
          'No se pudo iniciar la reserva de inventario para la receta seleccionada.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  /**
   * Refresca manualmente el estado del checkout consultando al backend.
   * @returns {Promise<void>}
   */
  const handleRefreshPaymentStatus = async () => {
    if (!checkoutSession?.order?.recipeId) {
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError('');
      const session = await fetchCheckoutSession(checkoutSession.order.recipeId);
      applyCheckoutSession(session, session.order.status === 'payment_confirmed');
      setPaymentStatusMessage('Estado del checkout actualizado desde el backend.');
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload;
      setCheckoutError(
        apiError.response?.data?.error ||
        apiError.response?.data?.details ||
        'No se pudo consultar el estado del checkout.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const activeNavId =
    activeSubTab === 'recipes' || activeSubTab === 'voucher'
      ? 'recipes'
      : activeSubTab === 'treatment'
        ? 'treatment'
        : activeSubTab === 'proposals' || activeSubTab === 'payment' || activeSubTab === 'delivery'
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
            <SidebarCredentialButton
              onOpen={() => {
                void handleGenerarQR();
                setIsCredentialModalOpen(true);
              }}
            />
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
        open={incomingConsent !== null && !showConsentModal}
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
                    <span className="text-xs font-mono font-semibold text-surface-500">ID: {checkoutSession?.order?.orderId || activeCheckoutPrescription?.recipeId || 'SIN-ORDEN'}</span>
                  </div>
                  <h3 className="text-sm !font-bold text-foreground">Retiro de medicamentos en farmacia</h3>
                </div>

                <span
                  className={`inline-flex self-start shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${lastOrderStatus === 'Retirado'
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
                    onClick={() => { void handleRefreshPaymentStatus(); }}
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
                              className={`h-0.5 flex-1 ${index <= activeOrderStepIndex ? 'bg-secondary-500/40' : 'bg-surface-800'
                                }`}
                            />
                          ) : (
                            <span className="flex-1" aria-hidden />
                          )}

                          <span
                            className={`mx-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isComplete
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
                              className={`h-0.5 flex-1 ${index < activeOrderStepIndex ? 'bg-secondary-500/40' : 'bg-surface-800'
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
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[29%]" />
                  <col className="w-[23%]" />
                  <col className="w-[18%]" />
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
                  {recipes.length === 0 && !recipesLoading && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-surface-500">
                        {recipesError || 'No hay recipes emitidos todavía para este paciente.'}
                      </td>
                    </tr>
                  )}
                  {recipes.map((rec) => (
                    <tr key={rec.id} className="hover:bg-surface-850/25 transition-colors group">
                      <td className="py-4 pr-4 font-mono font-bold text-xs text-white break-all align-top">
                        <span className="block max-w-full">{rec.id}</span>
                      </td>
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
              {recipes.length === 0 && !recipesLoading && (
                <div className="py-6 text-center text-xs text-surface-500">
                  {recipesError || 'No hay recipes emitidos todavía para este paciente.'}
                </div>
              )}
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
                      ? '¡¡¡Todas las tomas de hoy completadas!'
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
                  </div>                      </div>
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

          {/* Credencial QR (Módulo 1 / Sprint #2) */}
          <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Credencial QR
                </h3>
              </div>
              <p className="text-xs text-surface-400 max-w-md">
                Genere un código QR de seguridad de un solo uso para autorizar accesos o validar su identidad en consultorios médicos.
              </p>
              <p className="text-xs text-surface-500">
                ID interno del paciente: <span className="font-mono text-surface-300 font-semibold">{qrPatientIdentity}</span>
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0">
              <button
                onClick={handleGenerarQR}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-primary-950/20 active:scale-95 animate-pulse"
              >
                Generar credencial QR
              </button>

              {/* Renderizado de la imagen Base64 del Módulo 1 */}
              {qrImage && (
                <div className="mt-2 bg-white p-3.5 rounded-2xl border border-surface-200 flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
                  <Image src={qrImage} alt="QR Efímero Paciente" width={180} height={180} unoptimized className="h-[180px] w-[180px]" />
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${isActive
                      ? 'patient-treatment-tab--active shadow-sm'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-850'
                    }`}
                >
                  <TabIcon className="h-3.5 w-3.5 shrink-0" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tabular-nums ${isActive ? 'bg-white/20 text-white' : 'bg-primary-500/15 text-primary-400'
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
                      className={`p-5 sm:p-6 rounded-2xl border backdrop-blur-md transition-colors bg-surface-900/60 ${isPending
                          ? 'border-primary-500/30'
                          : isTaken
                            ? 'border-secondary-500/25'
                            : 'border-surface-800'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={`p-3 rounded-xl shrink-0 ${isPending ? 'bg-primary-500/15' : isTaken ? 'bg-secondary-500/15' : 'bg-surface-850'
                            }`}>
                            <TimeIcon className={`h-5 w-5 ${isPending ? 'text-primary-400' : isTaken ? 'text-secondary-400' : 'text-surface-500'
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-4 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-wide text-surface-500">Adherencia global</p>
                  <p className="mt-1 text-2xl font-bold text-white tabular-nums">{globalAdherencePercent}%</p>
                  <p className="text-[11px] text-surface-500 mt-1">Basada en tratamientos activos</p>
                </div>
                <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-4 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-wide text-surface-500">Tomas registradas</p>
                  <p className="mt-1 text-2xl font-bold text-white tabular-nums">{doseLogs.length}</p>
                  <p className="text-[11px] text-surface-500 mt-1">Historial total disponible</p>
                </div>
                <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-4 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-wide text-surface-500">Tratamientos cerrados</p>
                  <p className="mt-1 text-2xl font-bold text-white tabular-nums">{completedTreatments}</p>
                  <p className="text-[11px] text-surface-500 mt-1">Ciclos ya completados</p>
                </div>
              </div>

              <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-surface-500" />
                  <div>
                    <h3 className="zenith-section-title">Historial de tomas</h3>
                    <p className="text-xs text-surface-500 mt-1">Revisa las confirmaciones más recientes y detecta omisiones o patrones de consumo.</p>
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="zenith-section-title">Medicamentos recetados</h3>
                  <p className="text-xs text-surface-500 mt-1">Checkout asociado a la receta: <span className="font-mono text-primary-300">{activeCheckoutPrescription?.recipeId || 'SIN_RÉCIPE'}</span></p>
                </div>
                {backendPrescriptions.length > 1 && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs text-surface-400 font-medium whitespace-nowrap">Seleccionar récipe:</span>
                    <select
                      value={activeCheckoutRecipeId || activeCheckoutPrescription?.recipeId || ''}
                      onChange={(e) => {
                        setActiveCheckoutRecipeId(e.target.value);
                        setUnselectedItemIds(new Set());
                      }}
                      className="bg-surface-950 border border-surface-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-secondary-500 cursor-pointer max-w-[200px]"
                    >
                      {backendPrescriptions.map(presc => (
                        <option key={presc.recipeId} value={presc.recipeId}>
                          {presc.recipeId} ({new Date(presc.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {checkoutError ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                  {checkoutError}
                </div>
              ) : null}

              {proposalStatusMessage ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                  {proposalStatusMessage}
                </div>
              ) : null}

              <div className="divide-y divide-surface-850">
                {proposalItems.map((item) => {
                  const originalSub = item.unitPrice * item.quantity;
                  const finalSub = calculateItemSubtotal(item);
                  const discountAmt = originalSub - finalSub;
                  return (
                    <div key={item.id} className={`py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity ${unselectedItemIds.has(item.id) ? 'opacity-40 grayscale' : ''}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!unselectedItemIds.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-4 h-4 rounded border-surface-700 bg-surface-900 text-secondary-500 focus:ring-secondary-500 focus:ring-offset-surface-950 cursor-pointer shrink-0"
                        />
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-bold text-surface-200">{item.medication}</h4>
                          <p className="text-xs text-surface-550 flex items-center gap-2">
                            <span>Cant: {item.quantity}</span>
                            <span>•</span>
                            <span>Precio Unitario: {formatCurrency(item.unitPrice)}</span>
                          </p>
                        </div>
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
                    {PATIENT_PORTAL_COPY.selectedBranchOptions.map((branch) => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                variant="patient"
                onClick={handleConfirmOrder}
                disabled={!termsAccepted || !proposalItems.length || proposalItems.length === unselectedItemIds.size || checkoutLoading}
                className="w-full"
                size="lg"
              >
                <span>{checkoutLoading ? 'Preparando checkout...' : 'Confirmar y Enviar Carrito'}</span>
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

            {/* Estado del checkout y futura redirección */}
            {/* Pasarela de pago temporal (Mock) */}
            <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-5 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="h-16 w-16 rounded-full bg-primary-500/10 flex items-center justify-center mb-2">
                <CreditCard className="h-8 w-8 text-primary-400" />
              </div>
              <h3 className="zenith-section-title text-xl">Pasarela de Pago Segura</h3>
              <p className="text-sm text-surface-400 max-w-md">
                Esta es una simulación de la pasarela de pago temporal. Por favor confirme la transacción por <span className="font-bold text-white">{formatCurrency(totals.netTotal)}</span> para completar su compra.
              </p>

              {checkoutLoading && (
                <div className="text-primary-400 text-sm font-semibold animate-pulse mt-4 bg-primary-500/10 px-6 py-3 rounded-xl">
                  Procesando pago, por favor espere...
                </div>
              )}

              {!checkoutLoading && (
                <div className="flex gap-4 mt-6 w-full max-w-sm pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatusMessage('Pago cancelado por el usuario. Puede volver a intentar.');
                      setActiveSubTab('proposals');
                    }}
                    className="flex-1 px-4 py-3 bg-surface-950 border border-surface-800 rounded-xl text-surface-300 hover:text-white text-xs font-bold transition-all cursor-pointer hover:bg-surface-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutLoading(true);
                      setTimeout(() => {
                        setCheckoutLoading(false);
                        setPaymentStatusMessage('Compra validada correctamente. El pedido quedó listo para continuar con el proceso.');
                        setActiveSubTab('delivery');
                      }, 2500);
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-primary-500/20 transition-all cursor-pointer"
                  >
                    Pagar Ahora
                  </button>
                </div>
              )}
            </div>

            {/* Summary of checkout */}
            <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="zenith-section-title">Resumen de Compra</h3>

              <div className="space-y-3">
                {proposalItems.filter(item => !unselectedItemIds.has(item.id)).map((item) => (
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

      {/* P.4: DELIVERY / PERSONAL PICKUP SELECTION */}
      {activeSubTab === 'delivery' && (
        <div className="max-w-3xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary-500/15 border border-secondary-500/30 text-secondary-300 flex items-center justify-center shrink-0">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-secondary-400 font-bold">Pago validado</p>
                <h3 className="zenith-section-title">Servicio de delivery o entrega personal</h3>
                <p className="text-xs text-surface-400 max-w-xl">
                  La compra fue confirmada correctamente. El inventario reservado quedó consumido y el pedido pasa a la siguiente etapa operativa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-primary-500/25 bg-primary-500/5 p-5 space-y-3">
                <PackageCheck className="h-6 w-6 text-primary-300" />
                <div>
                  <h4 className="text-sm font-bold text-white">Servicio de delivery</h4>
                  <p className="text-xs text-surface-400 mt-1">
                    Próximamente se habilitará la coordinación de despacho, dirección, operador logístico y seguimiento del pedido.
                  </p>
                </div>
                <span className="inline-flex rounded-full border border-primary-500/25 bg-primary-500/10 px-2.5 py-1 text-[10px] font-bold text-primary-300">
                  Próximamente
                </span>
              </div>

              <div className="rounded-2xl border border-secondary-500/25 bg-secondary-500/5 p-5 space-y-3">
                <Building className="h-6 w-6 text-secondary-300" />
                <div>
                  <h4 className="text-sm font-bold text-white">Entrega personal</h4>
                  <p className="text-xs text-surface-400 mt-1">
                    El paciente podrá retirar el pedido presentando su credencial QR vigente y documento de identidad en la sucursal asignada.
                  </p>
                </div>
                <span className="block text-xs text-surface-300">
                  Sucursal: <strong>Sede Principal</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={() => setActiveSubTab('voucher')}>
                Ver comprobante
              </Button>
              <Button variant="patient" onClick={() => setActiveSubTab('recipes')}>
                Continuar
              </Button>
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
                  <h4 className="text-sm font-bold text-surface-950">{PATIENT_PORTAL_COPY.pharmacyLegalName}</h4>
                  <p className="text-2xs text-surface-500">{PATIENT_PORTAL_COPY.pharmacyLegalReference}</p>
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
                  <p className="font-semibold text-surface-600">Recipe / Order ID:</p>
                  <p className="font-mono text-surface-800 font-bold mt-0.5">{checkoutSession?.order?.recipeId || activeCheckoutPrescription?.recipeId || 'PENDIENTE'}</p>
                  <p className="font-semibold text-surface-600 mt-2">Referencia de pago confirmada:</p>
                  <p className="font-mono text-surface-800 font-bold mt-0.5">{simulatedPaymentReference || 'PENDIENTE DE CALLBACK'}</p>
                </div>

                <div className="flex items-center gap-1.5 text-secondary-605 font-bold">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span>{checkoutSession?.order?.status === 'payment_confirmed' ? 'Reserva Confirmada en Almacén' : 'Esperando confirmación del backend'}</span>
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
          {profileSaveMsg && (
            <div className="p-4 bg-secondary-500/10 border border-secondary-500/25 rounded-2xl flex items-center gap-2.5 text-secondary-400 text-xs">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <span>{profileSaveMsg}</span>
            </div>
          )}
          {profileError && (
            <div className="p-4 bg-danger-500/10 border border-danger-500/25 rounded-2xl flex items-center gap-2.5 text-danger-500 text-xs font-semibold">
              <Info className="h-4.5 w-4.5 shrink-0" />
              <span>{profileError.message}</span>
            </div>
          )}
          <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-8 backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-850 pb-4">
              <div>
                <h3 className="zenith-section-title text-xs">Perfil del paciente</h3>
                <p className="text-xs text-surface-400">
                  Los datos quedan en modo lectura hasta que pulses editar.
                </p>
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-2 sm:min-w-[220px]">
                {isEditingProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleConfirmProfileEdit()}
                      disabled={profileLoading}
                      className="w-full sm:min-w-[220px] px-4 py-2.5 bg-secondary hover:bg-secondary-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      {profileLoading ? 'Guardando...' : 'Confirmar cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProfileEdit}
                      className="w-full sm:min-w-[220px] px-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-surface-300 hover:text-white text-xs font-bold transition-all"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartProfileEdit}
                    disabled={profileLoading}
                    className="w-full sm:min-w-[220px] px-4 py-2.5 bg-secondary hover:bg-secondary-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {profileLoading ? 'Cargando...' : 'Editar perfil'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">
                  Información Personal
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="zenith-field-label">Nombre Completo</label>
                    <input
                      type="text"
                      value={isEditingProfile ? profileDraft.name : profileName}
                      onChange={(e) => {
                        setProfileDraft((prev) => ({ ...prev, name: e.target.value }));
                        if (profileError?.field === 'name') setProfileError(null);
                      }}
                      readOnly={!isEditingProfile}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingProfile ? (profileError?.field === 'name' ? 'bg-surface-950 text-white border-danger-500 focus:border-danger-400 ring-1 ring-danger-500' : 'bg-surface-950 text-white border-surface-850 focus:border-secondary-500') : 'bg-surface-950/40 text-surface-250 border-surface-850'}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="zenith-field-label">Correo Electrónico</label>
                    <input
                      type="email"
                      value={patientEmail}
                      readOnly
                      className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-250 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="zenith-field-label">Teléfono Móvil</label>
                    <input
                      type="tel"
                      value={isEditingProfile ? profileDraft.phone : profilePhone}
                      onChange={(e) => {
                        setProfileDraft((prev) => ({ ...prev, phone: e.target.value }));
                        if (profileError?.field === 'phone') setProfileError(null);
                      }}
                      readOnly={!isEditingProfile}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none ${isEditingProfile ? (profileError?.field === 'phone' ? 'bg-surface-950 text-white border-danger-500 focus:border-danger-400 ring-1 ring-danger-500' : 'bg-surface-950 text-white border-surface-850 focus:border-secondary-500') : 'bg-surface-950/40 text-surface-250 border-surface-850'}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="zenith-field-label">ID Interno del Sistema</label>
                    <input
                      type="text"
                      value={qrPatientIdentity}
                      readOnly
                      className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-250 font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="zenith-field-label">Referencia del Perfil</label>
                    <input
                      type="text"
                      value={patientProfile?.patientId || qrPatientIdentity}
                      readOnly
                      className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-250 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="zenith-section-title text-xs border-b border-surface-850 pb-2">
                  Dirección Predeterminada de Delivery
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="zenith-field-label">Dirección (Av., Urb., Edif., Piso)</label>
                    <input
                      type="text"
                      value={isEditingProfile ? profileDraft.deliveryAddress : deliveryAddress}
                      onChange={(e) => {
                        setProfileDraft((prev) => ({ ...prev, deliveryAddress: e.target.value }));
                        if (profileError?.field === 'deliveryAddress') setProfileError(null);
                      }}
                      readOnly={!isEditingProfile}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingProfile ? (profileError?.field === 'deliveryAddress' ? 'bg-surface-950 text-white border-danger-500 focus:border-danger-400 ring-1 ring-danger-500' : 'bg-surface-950 text-white border-surface-850 focus:border-secondary-500') : 'bg-surface-950/40 text-surface-250 border-surface-850'}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Estado</label>
                      {isEditingProfile ? (
                        <div className={profileError?.field === 'deliveryState' ? 'rounded-xl ring-1 ring-danger-500 border-danger-500' : ''}>
                          <VenezuelanStateSelect
                            value={profileDraft.deliveryState}
                            onChange={(value) => {
                              setProfileDraft((prev) => ({ ...prev, deliveryState: value }));
                              if (profileError?.field === 'deliveryState') setProfileError(null);
                            }}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={deliveryState}
                          readOnly
                          className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-250 focus:outline-none"
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="zenith-field-label">Municipio</label>
                      <input
                        type="text"
                        value={isEditingProfile ? profileDraft.deliveryMunicipio : deliveryMunicipio}
                        onChange={(e) => {
                          setProfileDraft((prev) => ({ ...prev, deliveryMunicipio: e.target.value }));
                          if (profileError?.field === 'deliveryMunicipio') setProfileError(null);
                        }}
                        readOnly={!isEditingProfile}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none ${isEditingProfile ? (profileError?.field === 'deliveryMunicipio' ? 'bg-surface-950 text-white border-danger-500 focus:border-danger-400 ring-1 ring-danger-500' : 'bg-surface-950 text-white border-surface-850 focus:border-secondary-500') : 'bg-surface-950/40 text-surface-250 border-surface-850'}`}
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
                  className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                  title="Descargar"
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
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
                    <h1 className="zenith-page-title uppercase">{PATIENT_PORTAL_COPY.printableFacilityName}</h1>
                  </div>
                  <p className="text-2xs text-surface-500 font-medium">
                    {PATIENT_PORTAL_COPY.printableFacilitySubtitle}<br />
                    {PATIENT_PORTAL_COPY.printableFacilityAddress}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold bg-surface-100 border border-surface-300 px-3 py-1 rounded-full text-surface-700 font-mono">
                    {selectedRecipe.id}
                  </span>
                  <p className="text-2xs text-surface-400 mt-2">{PATIENT_PORTAL_COPY.printableDocumentLabel}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200 text-xs">
                <div>
                  <p className="text-surface-500 font-bold uppercase text-[9px]">Paciente</p>
                  <p className="font-bold text-surface-850 text-sm mt-0.5">{profileName}</p>
                  <p className="text-surface-500 mt-1">ID: {qrPatientIdentity} • Correo: {patientEmail}</p>
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
                    <span className="text-[7px] font-bold uppercase tracking-wider">{PATIENT_PORTAL_COPY.printableSignatureLabel}</span>
                    <span className="text-2xs font-extrabold uppercase my-0.5 tracking-tight font-sans">{buildDoctorSignatureLabel(selectedRecipe.doctor)}</span>
                    <span className="text-[7px] font-mono leading-none">REGISTRADO EN SISTEMA</span>
                  </div>
                  <span className="text-[9px] text-surface-400 font-mono mt-1">{PATIENT_PORTAL_COPY.printableSignatureFooter}</span>
                </div>
              </div>

              <div className="border-t border-surface-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-surface-550 text-[10px]">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[9px] font-bold uppercase text-surface-400">Código de Verificación Único</span>
                  <span className="text-2xs font-mono font-medium text-surface-600">
                    SEC-TOKEN: {selectedRecipe.id}-{qrSeedRight}
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
                  <span className="text-[7px] font-mono text-surface-400">{PATIENT_PORTAL_COPY.verificationPortalLabel}</span>
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
        displayName={patientName || ""}
        credentialLine={undefined}
        modalTitle={null}
        qrImage={qrImage}
        qrToken={patientProfile?.patientId || qrPatientIdentity}
        qrSecondsLeft={qrSecondsLeft}
        onRefresh={() => {
          handleRefreshQR();
          void handleGenerarQR();
        }}
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
                {`Los medicamentos quedan reservados en la sucursal seleccionada durante un m\u00E1ximo de ${PATIENT_PORTAL_COPY.paymentHoldMinutes} minutos desde la emisi\u00F3n del recipe. Al vencer ese lapso, el sistema libera el stock y cualquier compra posterior vuelve a validar existencia real.`}
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
