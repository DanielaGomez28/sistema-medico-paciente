'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Activity, 
  Download, 
  MapPin, 
  Phone, 
  LogOut,
  User,
  Heart,
  RefreshCw,
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
  QrCode,
  DollarSign,
  ExternalLink,
  Pill,
  Bell,
  TrendingUp
} from 'lucide-react';
import { AppShell, AppSidebar, AppHeader, useShell } from './layout';
import { PageHeader, Button, ListCard, Modal, ModalBody, StatCard } from './ui';

interface PatientViewProps {
  patientName: string;
  patientEmail: string;
  onLogout: () => void;
}

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
    doctorLicense: 'M.P. 28.490/7',
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
    doctorLicense: 'M.P. 28.490/7',
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
    doctorLicense: 'M.P. 28.490/7',
    status: 'Expirado'
  }
];

interface ProposalItem {
  id: string;
  medication: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

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

interface DoseLog {
  id: string;
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
    id: 'alert-1',
    type: 'control',
    title: 'Control cardiológico de seguimiento',
    message: 'Cita de control con el Dr. Alejandro Ríos para evaluar respuesta al tratamiento antihipertensivo.',
    date: '15 Jun, 2026',
  },
  {
    id: 'alert-2',
    type: 'recordatorio',
    title: 'Registro de presión arterial',
    message: 'Registrar lectura matutina de presión arterial en el cuaderno de seguimiento.',
    date: '09 Jun, 2026',
  },
  {
    id: 'alert-3',
    type: 'renovacion',
    title: 'Renovación de receta Ramipril',
    message: 'La receta REC-2026-904 vence el 06 Dic, 2026. Solicite renovación con 15 días de anticipación.',
    date: '21 Nov, 2026',
  },
];

const WEEKLY_ADHERENCE = [
  { day: 'Lun', percent: 100 },
  { day: 'Mar', percent: 100 },
  { day: 'Mié', percent: 50 },
  { day: 'Jue', percent: 100 },
  { day: 'Vie', percent: 100 },
  { day: 'Sáb', percent: 100 },
  { day: 'Dom', percent: 50 },
];

const EXAMPLE_EXTERNAL_PAYMENT_GATEWAY = 'https://pagos.humana.example/checkout';

function SidebarCredentialButton({ onOpen }: { onOpen: () => void }) {
  const { closeSidebar } = useShell();

  return (
    <button
      type="button"
      onClick={() => {
        onOpen();
        closeSidebar();
      }}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-primary-400 hover:text-white hover:bg-primary-500/10 border border-primary-500/20 transition-colors cursor-pointer"
    >
      <QrCode className="h-4 w-4 shrink-0" />
      <span>Credencial QR</span>
    </button>
  );
}

export default function PatientView({ patientName, patientEmail, onLogout }: PatientViewProps) {
  // Navigation Tabs: 'recipes' | 'treatment' | 'proposals' | 'payment' | 'voucher' | 'profile'
  const [activeSubTab, setActiveSubTab] = useState<'recipes' | 'treatment' | 'proposals' | 'payment' | 'voucher' | 'profile'>('recipes');

  const [recipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Treatment tracking states
  const [treatments, setTreatments] = useState<TreatmentMedication[]>(MOCK_TREATMENTS);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(MOCK_DOSE_LOGS);
  const [treatmentAlerts] = useState<TreatmentAlert[]>(MOCK_TREATMENT_ALERTS);
  const [doseSuccessMsg, setDoseSuccessMsg] = useState('');
  
  // Last Order State
  const [lastOrderStatus, setLastOrderStatus] = useState<'Pendiente por retirar' | 'Listo para retirar' | 'Retirado'>('Listo para retirar');
  
  // QR Code Expiry State
  const [qrToken, setQrToken] = useState('PX-992-8812');
  const [qrSecondsLeft, setQrSecondsLeft] = useState(30);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

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
  const [isRedirectSimulating, setIsRedirectSimulating] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [simulatedPaymentReference, setSimulatedPaymentReference] = useState('');
  
  // Voucher info
  const [voucherId, setVoucherId] = useState('');

  // Profile Settings State (Pantalla P.5)
  const [profileName, setProfileName] = useState(patientName);
  const [profilePhone, setProfilePhone] = useState('+34 600 123 456');
  const [deliveryAddress, setDeliveryAddress] = useState('Calle Mayor 12, Piso 4B');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('28013');
  const [deliveryCity, setDeliveryCity] = useState('Madrid');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

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
    const vat = netSubtotal * 0.21;
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

  const weeklyAdherencePercent = Math.round(
    WEEKLY_ADHERENCE.reduce((sum, day) => sum + day.percent, 0) / WEEKLY_ADHERENCE.length
  );

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

  const getAlertIcon = (type: TreatmentAlert['type']) => {
    if (type === 'control') return Calendar;
    if (type === 'renovacion') return FileText;
    return Bell;
  };

  // Load profile settings from localStorage if available
  useEffect(() => {
    const savedName = localStorage.getItem('zenith_patient_name');
    const savedPhone = localStorage.getItem('zenith_patient_phone');
    const savedAddr = localStorage.getItem('zenith_patient_address');
    const savedPC = localStorage.getItem('zenith_patient_pc');
    const savedCity = localStorage.getItem('zenith_patient_city');

    if (savedName) setProfileName(savedName);
    if (savedPhone) setProfilePhone(savedPhone);
    if (savedAddr) setDeliveryAddress(savedAddr);
    if (savedPC) setDeliveryPostalCode(savedPC);
    if (savedCity) setDeliveryCity(savedCity);
  }, []);

  // Rotate QR code token every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          const rand = Math.floor(1000 + Math.random() * 9000);
          setQrToken(`PX-992-${rand}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
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

  // Simulación de redirección a la pasarela externa del cliente
  useEffect(() => {
    if (isRedirectSimulating && redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(redirectCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (isRedirectSimulating && redirectCountdown === 0) {
      const randVoucher = `VOU-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setVoucherId(randVoucher);
      setSimulatedPaymentReference(`PAY-EXT-EXAMPLE-${Math.floor(100000 + Math.random() * 900000)}`);
      setLastOrderStatus('Listo para retirar');
      setIsRedirectSimulating(false);
      setRedirectCountdown(3);
      setActiveSubTab('voucher');
    }
  }, [isRedirectSimulating, redirectCountdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefreshQR = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setQrToken(`PX-992-${rand}`);
    setQrSecondsLeft(30);
  };

  const cycleOrderStatus = () => {
    if (lastOrderStatus === 'Pendiente por retirar') setLastOrderStatus('Listo para retirar');
    else if (lastOrderStatus === 'Listo para retirar') setLastOrderStatus('Retirado');
    else setLastOrderStatus('Pendiente por retirar');
  };

  const orderDeliverySteps = [
    { id: 'Pendiente por retirar', label: 'Pendiente' },
    { id: 'Listo para retirar', label: 'Listo para Retirar' },
    { id: 'Retirado', label: 'Retirado' },
  ] as const;

  const activeOrderStepIndex = orderDeliverySteps.findIndex((step) => step.id === lastOrderStatus);

  const handleConfirmOrder = () => {
    if (!termsAccepted) {
      alert('Debe aceptar los Términos y Condiciones del servicio.');
      return;
    }
    setPaymentTimeLeft(900);
    setIsRedirectSimulating(false);
    setRedirectCountdown(3);
    setSimulatedPaymentReference('');
    setActiveSubTab('payment');
  };

  const handleSimulatePaymentRedirect = () => {
    setIsRedirectSimulating(true);
    setRedirectCountdown(3);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');

    if (!profileName || !profilePhone || !deliveryAddress || !deliveryPostalCode || !deliveryCity) {
      alert('Por favor rellene todos los campos del perfil.');
      return;
    }

    localStorage.setItem('zenith_patient_name', profileName);
    localStorage.setItem('zenith_patient_phone', profilePhone);
    localStorage.setItem('zenith_patient_address', deliveryAddress);
    localStorage.setItem('zenith_patient_pc', deliveryPostalCode);
    localStorage.setItem('zenith_patient_city', deliveryCity);

    setProfileSuccessMsg('¡Perfil y dirección de delivery actualizados con éxito!');

    setTimeout(() => {
      setProfileSuccessMsg('');
    }, 3000);
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

  const credentialQrSvg = (
    <svg viewBox="0 0 100 100" className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 text-[#0a1220]">
      <rect x="0" y="0" width="20" height="20" fill="currentColor" />
      <rect x="5" y="5" width="10" height="10" fill="white" />
      <rect x="80" y="0" width="20" height="20" fill="currentColor" />
      <rect x="85" y="5" width="10" height="10" fill="white" />
      <rect x="0" y="80" width="20" height="20" fill="currentColor" />
      <rect x="5" y="85" width="10" height="10" fill="white" />
      <rect x="30" y="10" width="10" height="5" fill="currentColor" />
      <rect x="45" y="5" width="5" height="15" fill="currentColor" />
      <rect x="60" y="0" width="10" height="10" fill="currentColor" />
      <rect x="35" y="30" width="15" height="10" fill="currentColor" />
      <rect x="10" y="35" width="10" height="15" fill="currentColor" />
      <rect x="55" y="45" width="20" height="5" fill="currentColor" />
      <rect x="30" y="60" width="15" height="15" fill="currentColor" />
      <rect x="80" y="30" width="10" height="20" fill="currentColor" />
      <rect x="75" y="60" width="15" height="10" fill="currentColor" />
      <rect x="50" y="80" width="25" height="15" fill="currentColor" />
      <rect x="85" y="85" width="10" height="10" fill="white" />
    </svg>
  );

  return (
    <AppShell
      contentClassName="max-w-5xl"
      sidebar={
        <AppSidebar
          accent="primary"
          brand={{ icon: Activity, title: 'Mi Salud', subtitle: 'Portal de Pacientes' }}
          items={[
            { id: 'recipes', name: 'Récipes Médicos', icon: FileText },
            { id: 'treatment', name: 'Seguimiento de Tratamiento', icon: Pill },
            { id: 'proposals', name: 'Propuestas de Compra', icon: FileSpreadsheet },
            { id: 'profile', name: 'Configuración Perfil', icon: User },
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
            role: 'Paciente ID #8849',
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
            {activeSubTab === 'recipes' && (
              <div className="space-y-6">
                <PageHeader
                  title="Historial de Récipes Médicos"
                  description="Consulte, visualice e imprima sus recetas prescritas vigentes."
                />

                {/* Progress Stepper for last order */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl backdrop-blur-md relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${
                      lastOrderStatus === 'Retirado'
                        ? 'from-secondary-500 to-secondary-600'
                        : 'from-primary-500/70 to-secondary-500/70'
                    }`}
                  />

                  <div className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-surface-800 text-surface-300 border border-surface-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                            Última Orden de Farmacia
                          </span>
                          <span className="text-xs font-mono font-semibold text-surface-500">ID: #ORD-9923</span>
                        </div>
                        <h3 className="text-sm font-medium text-white">Retiro de Medicamentos (Receta Activa)</h3>
                        <p className="text-xs text-surface-400 leading-relaxed max-w-2xl">
                          Retira en Farmacia Central (Sanatorio Zenith) • Pasillo B, Mostrador 3
                        </p>
                      </div>

                      <span
                        className={`inline-flex self-start shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          lastOrderStatus === 'Retirado'
                            ? 'bg-secondary-500/10 text-secondary-400 border-secondary-500/25'
                            : lastOrderStatus === 'Listo para retirar'
                              ? 'bg-primary-500/10 text-primary-400 border-primary-500/25'
                              : 'bg-surface-800 text-surface-300 border-surface-700'
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
                                      ? 'bg-secondary-500/15 text-secondary-400'
                                      : isActive
                                        ? 'bg-white text-surface-950'
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

                              <span
                                className={`text-[10px] font-semibold leading-tight ${
                                  isActive
                                    ? 'text-white'
                                    : isComplete
                                      ? 'text-secondary-400'
                                      : 'text-surface-500'
                                }`}
                              >
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
                    <p className="text-xs text-surface-400">Listado cronológico de recetas autorizadas.</p>
                  </div>

                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-surface-850 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                          <th className="pb-3">Código</th>
                          <th className="pb-3">Fecha de Emisión</th>
                          <th className="pb-3">Medicamento</th>
                          <th className="pb-3">Especialista</th>
                          <th className="pb-3">Estado</th>
                          <th className="pb-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-850">
                        {recipes.map((rec) => (
                          <tr key={rec.id} className="hover:bg-surface-850/25 transition-colors group">
                            <td className="py-4 font-mono font-bold text-xs text-white">{rec.id}</td>
                            <td className="py-4 text-xs text-surface-400">{rec.date}</td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-surface-200">{rec.medication}</span>
                                <span className="text-[10px] text-surface-500">{rec.dosage}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-surface-200 font-semibold">{rec.doctor}</span>
                                <span className="text-[10px] text-surface-500">{rec.specialty}</span>
                              </div>
                            </td>
                            <td className="py-4 whitespace-nowrap">
                              <span className={`inline-flex whitespace-nowrap px-2 py-0.5 text-2xs font-semibold border rounded-full ${
                                rec.status === 'Activo' 
                                  ? 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20' 
                                  : 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="inline-flex gap-2">
                                <button
                                  onClick={() => setSelectedRecipe(rec)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
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
                        badge={
                          <span className="inline-flex whitespace-nowrap px-2 py-0.5 text-2xs font-semibold border rounded-full bg-secondary-500/10 text-secondary-400 border-secondary-500/20">
                            {rec.status}
                          </span>
                        }
                        fields={[
                          { label: 'Fecha', value: rec.date },
                          { label: 'Dosis', value: rec.dosage },
                          { label: 'Especialista', value: rec.doctor },
                          { label: 'Especialidad', value: rec.specialty },
                        ]}
                        actions={
                          <button
                            onClick={() => setSelectedRecipe(rec)}
                            className="px-3 py-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
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
                <PageHeader
                  title="Seguimiento de Tratamiento"
                  description="Monitoree la adherencia a sus medicamentos, registre tomas diarias y consulte alertas clínicas."
                />

                {doseSuccessMsg && (
                  <div className="p-4 bg-secondary-500/10 border border-secondary-500/30 rounded-2xl flex items-center gap-2.5 text-secondary-450 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                    <span>{doseSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={Pill}
                    label="Tratamientos Activos"
                    value={activeTreatments.length}
                    hint={<span>Vinculados a récipes vigentes</span>}
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Adherencia Semanal"
                    value={`${weeklyAdherencePercent}%`}
                    hint={<span>Promedio de los últimos 7 días</span>}
                  />
                  <StatCard
                    icon={Clock}
                    label="Próxima Toma"
                    value={nextPendingDose ? `${nextPendingDose.scheduledTime}` : 'Completado'}
                    hint={
                      nextPendingDose ? (
                        <span>{nextPendingDose.medicationName}</span>
                      ) : (
                        <span>Sin tomas pendientes hoy</span>
                      )
                    }
                  />
                  <StatCard
                    icon={Bell}
                    label="Alertas Pendientes"
                    value={treatmentAlerts.length}
                    hint={<span>Controles y recordatorios</span>}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Active treatments */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div>
                        <h3 className="zenith-section-title">Medicamentos en Tratamiento</h3>
                        <p className="text-xs text-surface-400">Progreso del plan terapéutico prescrito por su especialista.</p>
                      </div>

                      <div className="space-y-4">
                        {activeTreatments.map((treatment) => {
                          const progress = getTreatmentProgress(treatment);
                          return (
                            <div
                              key={treatment.id}
                              className="p-4 bg-surface-950/50 border border-surface-850 rounded-xl space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-bold text-white">{treatment.name}</h4>
                                    <span className="text-[9px] bg-secondary-500/10 text-secondary-400 border border-secondary-500/25 px-1.5 py-0.5 rounded font-bold">
                                      {treatment.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-surface-400">
                                    {treatment.dosage} • {treatment.frequency}
                                  </p>
                                  <p className="text-[10px] text-surface-500">
                                    {treatment.doctor} • {treatment.specialty} • {treatment.recipeId}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-lg font-semibold text-white tabular-nums">{progress}%</p>
                                  <p className="text-[10px] text-surface-500">
                                    {treatment.takenDoses}/{treatment.totalDoses} tomas
                                  </p>
                                </div>
                              </div>

                              <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary-500 transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-surface-450">
                                <div>
                                  <span className="font-semibold text-surface-500 block">Horarios</span>
                                  <span className="text-surface-300">{treatment.scheduleTimes.join(', ')}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-surface-500 block">Periodo</span>
                                  <span className="text-surface-300">{treatment.startDate} — {treatment.endDate}</span>
                                </div>
                              </div>

                              <p className="text-xs text-surface-400 border-t border-surface-850 pt-3">
                                {treatment.instructions}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Adherence history */}
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div>
                        <h3 className="zenith-section-title">Historial de Tomas</h3>
                        <p className="text-xs text-surface-400">Registro cronológico de adherencia al tratamiento.</p>
                      </div>

                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-surface-850 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                              <th className="pb-3">Fecha</th>
                              <th className="pb-3">Medicamento</th>
                              <th className="pb-3">Hora Programada</th>
                              <th className="pb-3">Hora Real</th>
                              <th className="pb-3">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-850">
                            {doseLogs.map((dose) => (
                              <tr key={dose.id} className="hover:bg-surface-850/25 transition-colors">
                                <td className="py-3 text-xs text-surface-400">{dose.date}</td>
                                <td className="py-3 text-xs font-semibold text-surface-200">{dose.medicationName}</td>
                                <td className="py-3 text-xs text-surface-400 font-mono">{dose.scheduledTime}</td>
                                <td className="py-3 text-xs text-surface-400 font-mono">{dose.takenAt ?? '—'}</td>
                                <td className="py-3">
                                  <span className={`inline-flex px-2 py-0.5 text-2xs font-semibold border rounded-full ${
                                    dose.status === 'Tomada'
                                      ? 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20'
                                      : dose.status === 'Pendiente'
                                        ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                                        : 'bg-secondary-500/10 text-secondary-455 border-secondary-500/20'
                                  }`}>
                                    {dose.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="md:hidden space-y-3">
                        {doseLogs.map((dose) => (
                          <ListCard
                            key={dose.id}
                            title={dose.medicationName}
                            subtitle={dose.date}
                            badge={
                              <span className={`inline-flex px-2 py-0.5 text-2xs font-semibold border rounded-full ${
                                dose.status === 'Tomada'
                                  ? 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20'
                                  : dose.status === 'Pendiente'
                                    ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                                    : 'bg-secondary-500/10 text-secondary-455 border-secondary-500/20'
                              }`}>
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

                  {/* Right column: today's schedule, adherence chart, alerts */}
                  <div className="space-y-6">
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div>
                        <h3 className="zenith-section-title">Agenda de Hoy</h3>
                        <p className="text-xs text-surface-400">{todayLabel}</p>
                      </div>

                      <div className="space-y-3">
                        {todayDoses.length === 0 ? (
                          <p className="text-xs text-surface-500">No hay tomas programadas para hoy.</p>
                        ) : (
                          todayDoses.map((dose) => (
                            <div
                              key={dose.id}
                              className="p-3 bg-surface-950/50 border border-surface-850 rounded-xl flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white">{dose.medicationName}</p>
                                <p className="text-[10px] text-surface-500 font-mono">{dose.scheduledTime}</p>
                                {dose.takenAt && (
                                  <p className="text-[10px] text-secondary-400 mt-0.5">Tomada a las {dose.takenAt}</p>
                                )}
                              </div>
                              {dose.status === 'Pendiente' ? (
                                <button
                                  onClick={() => handleMarkDoseTaken(dose.id)}
                                  className="px-3 py-1.5 text-[10px] font-bold bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                                >
                                  Registrar toma
                                </button>
                              ) : (
                                <CheckCircle2 className={`h-5 w-5 shrink-0 ${
                                  dose.status === 'Tomada' ? 'text-secondary-400' : 'text-surface-600'
                                }`} />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div>
                        <h3 className="zenith-section-title">Adherencia Semanal</h3>
                        <p className="text-xs text-surface-400">Porcentaje de tomas completadas por día.</p>
                      </div>

                      <div className="flex items-end justify-between gap-2 h-28">
                        {WEEKLY_ADHERENCE.map((day) => (
                          <div key={day.day} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full bg-surface-800 rounded-t-md relative flex items-end h-20">
                              <div
                                className="w-full bg-primary-500/80 rounded-t-md transition-all"
                                style={{ height: `${day.percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-surface-500 font-bold">{day.day}</span>
                            <span className="text-[9px] text-surface-400 font-mono">{day.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div>
                        <h3 className="zenith-section-title">Alertas y Controles</h3>
                        <p className="text-xs text-surface-400">Recordatorios clínicos y próximas citas de seguimiento.</p>
                      </div>

                      <div className="space-y-3">
                        {treatmentAlerts.map((alert) => {
                          const AlertIcon = getAlertIcon(alert.type);
                          return (
                            <div
                              key={alert.id}
                              className="p-3 bg-surface-950/50 border border-surface-850 rounded-xl space-y-1.5"
                            >
                              <div className="flex items-start gap-2">
                                <AlertIcon className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white">{alert.title}</p>
                                  <p className="text-[10px] text-surface-500">{alert.date}</p>
                                </div>
                              </div>
                              <p className="text-xs text-surface-400 leading-relaxed">{alert.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* P.2: COMMERCIAL PROPOSAL & BILLING */}
            {activeSubTab === 'proposals' && (
              <div className="space-y-6">
                <PageHeader
                  title="Confirmación de Pedido y Facturación"
                  description="Valide la propuesta comercial enviada desde la consulta de su médico especialista."
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Proposal Breakdown Table */}
                  <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="zenith-section-title">Desglose de Medicamentos Recetados</h3>
                        <p className="text-xs text-surface-400">Descuentos exclusivos aplicados por su médico.</p>
                      </div>
                      <span className="text-[10px] bg-primary-500/10 text-primary-400 border border-primary-500/25 px-2 py-0.5 rounded font-bold">
                        PROPUESTA #PR-2026
                      </span>
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
                                <span>Precio Unitario: ${item.unitPrice.toFixed(2)}</span>
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-4 text-right">
                              {item.discountPercent > 0 && (
                                <div className="space-y-0.5">
                                  <span className="text-[9px] bg-secondary-500/10 text-secondary-400 border border-secondary-500/20 px-1.5 py-0.5 rounded font-bold">
                                    -{item.discountPercent}% Médico
                                  </span>
                                  <p className="text-[10px] text-secondary-400/80 font-medium">Ahorras: -${discountAmt.toFixed(2)}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-white">${finalSub.toFixed(2)}</p>
                                {item.discountPercent > 0 && (
                                  <span className="text-2xs text-surface-500 line-through">${originalSub.toFixed(2)}</span>
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

                      <button
                        onClick={() => setIsTermsModalOpen(true)}
                        className="px-3.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-primary-400 hover:text-white rounded-lg text-xs font-bold border border-surface-700 transition-colors cursor-pointer"
                      >
                        {termsAccepted ? 'Ver Términos' : 'Aceptar Términos'}
                      </button>
                    </div>
                  </div>

                  {/* Facturación Invoice Box */}
                  <div className="space-y-6">
                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <h3 className="zenith-section-title">Resumen de Facturación</h3>

                      <div className="space-y-2.5 text-xs text-surface-400">
                        <div className="flex justify-between">
                          <span>Subtotal Bruto</span>
                          <span className="font-medium text-surface-300">${totals.grossTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-secondary-400">
                          <span>Ahorro Exclusivo</span>
                          <span className="font-bold">-${totals.totalSavings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal Neto</span>
                          <span className="font-medium text-surface-300">${totals.netSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IVA (21%)</span>
                          <span className="font-medium text-surface-300">${totals.vat.toFixed(2)}</span>
                        </div>
                        
                        <div className="border-t border-surface-800 pt-3 flex justify-between items-baseline">
                          <span className="font-medium text-white text-sm">Total Neto</span>
                          <span className="text-lg font-semibold text-white">${totals.netTotal.toFixed(2)}</span>
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
                <PageHeader
                  title="Preparación de Pago"
                  description="Documentación y simulación del flujo de redirección hacia la pasarela externa del cliente."
                  actions={
                    <div className="bg-secondary-500/10 border border-secondary-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0">
                      <Clock className="h-5 w-5 text-secondary-400 animate-pulse" />
                      <div>
                        <span className="text-[9px] font-bold text-secondary-450 uppercase leading-none block">Reserva de Inventario</span>
                        <span className="text-base font-mono font-semibold text-white">{formatTime(paymentTimeLeft)}</span>
                      </div>
                    </div>
                  }
                />

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
                      <p className="text-xs text-surface-400">
                        Al confirmar el pedido, el paciente sería enviado a la URL de la pasarela del cliente con los parámetros del pedido.
                      </p>
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

                    {isRedirectSimulating ? (
                      <div className="p-5 bg-surface-800 border border-surface-700 rounded-2xl space-y-4 text-center">
                        <div className="flex justify-center text-surface-300">
                          <ExternalLink className="h-10 w-10 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="zenith-section-title">Simulando redirección</h4>
                          <p className="text-xs text-surface-400 leading-relaxed">
                            El usuario sería redirigido a la pasarela externa del cliente para completar el pago.
                          </p>
                        </div>
                        <div className="space-y-1.5 pt-2">
                          <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
                              style={{ width: `${(redirectCountdown / 3) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-surface-500 font-mono">
                            Simulación en {redirectCountdown} segundos...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveSubTab('proposals')}
                          className="px-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-surface-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Volver a Propuesta
                        </button>
                        <Button onClick={handleSimulatePaymentRedirect}>
                          <span>Simular redirección (ejemplo)</span>
                          <ExternalLink className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    )}
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
                          <span className="font-bold text-white">${calculateItemSubtotal(item).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-surface-800 pt-4 space-y-2.5 text-xs text-surface-400">
                      <div className="flex justify-between">
                        <span>Ahorros aplicados</span>
                        <span className="text-secondary-400">-${totals.totalSavings.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IVA (21%)</span>
                        <span>${totals.vat.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-baseline font-bold text-white pt-2 border-t border-surface-850">
                        <span>Total Neto</span>
                        <span className="text-base text-primary-400">${totals.netTotal.toFixed(2)}</span>
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
                        <h4 className="text-sm font-bold text-surface-950">Zenith Farmacia S.L.</h4>
                        <p className="text-2xs text-surface-500">CIF: B-12994821 • Av. Castellana 210</p>
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
                            <span className="font-bold text-surface-900">${calculateItemSubtotal(item).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <div className="w-56 space-y-2 text-2xs text-surface-500">
                        <div className="flex justify-between">
                          <span>Subtotal Neto</span>
                          <span className="font-semibold text-surface-800">${totals.netSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IVA (21%)</span>
                          <span className="font-semibold text-surface-800">${totals.vat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline font-bold text-surface-950 border-t border-surface-200 pt-2 text-xs">
                          <span>Total Pagado</span>
                          <span className="text-sm text-primary-700">${totals.netTotal.toFixed(2)}</span>
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
                <PageHeader
                  title="Configuración de Perfil"
                  description="Modifique sus datos personales y actualice su dirección de delivery predeterminada."
                />

                {profileSuccessMsg && (
                  <div className="p-4 bg-secondary-500/10 border border-secondary-500/30 rounded-2xl flex items-center gap-2.5 text-secondary-450 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-8 backdrop-blur-md space-y-6">
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    
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
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="zenith-field-label">Correo Electrónico (No editable)</label>
                          <input
                            type="email"
                            value={patientEmail}
                            disabled
                            className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 focus:outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="zenith-field-label">Teléfono de Contacto</label>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="zenith-field-label">Documento de Identidad (DNI/CIF)</label>
                          <input
                            type="text"
                            disabled
                            value="12345678-SP"
                            className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 focus:outline-none cursor-not-allowed"
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
                          <label className="zenith-field-label">Calle, Número, Piso/Puerta</label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Ej: Calle Mayor 12, Piso 4B"
                            className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Código Postal</label>
                            <input
                              type="text"
                              value={deliveryPostalCode}
                              onChange={(e) => setDeliveryPostalCode(e.target.value)}
                              placeholder="Ej: 28013"
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="zenith-field-label">Ciudad</label>
                            <input
                              type="text"
                              value={deliveryCity}
                              onChange={(e) => setDeliveryCity(e.target.value)}
                              placeholder="Ej: Madrid"
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="pt-4 border-t border-surface-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={onLogout}
                        className="px-5 py-2.5 bg-secondary-500/10 hover:bg-secondary-500/20 text-secondary-400 border border-secondary-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer order-last sm:order-first"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión Seguro</span>
                      </button>

                      <Button type="submit">
                        Guardar Cambios
                      </Button>
                    </div>

                  </form>
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
                    Av. de la Castellana 210, Madrid • Tel: +34 912 345 678
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

      <Modal
        open={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        title="Credencial QR Dinámica"
        size="lg"
      >
        <ModalBody className="space-y-4">
          <p className="text-xs text-surface-400 text-center">
            Presente este código en el mostrador para validar su identidad y retirar medicamentos.
          </p>
          <div className="flex flex-col items-center bg-white text-[#0a1220] p-6 sm:p-8 rounded-xl shadow-inner border border-surface-700/10 mx-auto max-w-md w-full">
            {credentialQrSvg}
            <div className="mt-3 text-center">
              <span className="text-xs font-mono font-bold text-[#0a1220] tracking-wider block">
                TOKEN: {qrToken}
              </span>
              <p className="text-[10px] text-surface-600 font-medium mt-1">
                Vence en <span className="text-secondary-600 font-bold">{qrSecondsLeft}s</span>
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={handleRefreshQR}>
              <RefreshCw className="h-3.5 w-3.5" />
              Rotar credencial
            </Button>
          </div>
        </ModalBody>
      </Modal>

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
                  className="px-4 py-2 bg-surface-900 hover:bg-surface-850 text-surface-400 hover:text-white rounded-lg text-xs font-semibold border border-surface-800 transition-all cursor-pointer"
                >
                  Rechazar
                </button>
                <Button onClick={() => setIsTermsModalOpen(false)}>
                  Aceptar y Continuar
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </AppShell>
  );
}
