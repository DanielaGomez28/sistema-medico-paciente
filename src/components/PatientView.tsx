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
  CreditCard,
  QrCode,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { AppShell, AppSidebar, AppHeader } from './layout';
import { PageHeader, Button } from './ui';

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

export default function PatientView({ patientName, patientEmail, onLogout }: PatientViewProps) {
  // Navigation Tabs: 'recipes' | 'proposals' | 'payment' | 'voucher' | 'profile'
  const [activeSubTab, setActiveSubTab] = useState<'recipes' | 'proposals' | 'payment' | 'voucher' | 'profile'>('recipes');

  const [recipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Last Order State
  const [lastOrderStatus, setLastOrderStatus] = useState<'Pendiente por retirar' | 'Listo para retirar' | 'Retirado'>('Listo para retirar');
  
  // QR Code Expiry State
  const [qrToken, setQrToken] = useState('PX-992-8812');
  const [qrSecondsLeft, setQrSecondsLeft] = useState(30);

  // Proposal states (Pantalla P.2)
  const [proposalItems] = useState<ProposalItem[]>([
    { id: 'prop-1', medication: 'Ramipril 5mg (28 Comprimidos)', quantity: 1, unitPrice: 12.50, discountPercent: 20 },
    { id: 'prop-2', medication: 'Aspirina 100mg (30 Comprimidos)', quantity: 1, unitPrice: 6.00, discountPercent: 10 }
  ]);
  const [selectedBranch, setSelectedBranch] = useState('Farma-Humana Central (Av. de la Castellana 210)');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Payment States (Pantalla P.3)
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'transfer' | 'card'>('mobile');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900); // 15 minutes in seconds
  const [paymentError, setPaymentError] = useState('');
  
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

  const handleConfirmOrder = () => {
    if (!termsAccepted) {
      alert('Debe aceptar los Términos y Condiciones de Farma-Humana.');
      return;
    }
    setPaymentTimeLeft(900);
    setPaymentError('');
    setReferenceNumber('');
    setCardNumber('');
    setActiveSubTab('payment');
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCVC) {
        setPaymentError('Por favor complete todos los datos de su tarjeta.');
        return;
      }
      if (cardNumber.length < 12) {
        setPaymentError('El número de tarjeta no es válido.');
        return;
      }
    } else {
      if (!referenceNumber) {
        setPaymentError('Por favor ingrese el número de referencia de la transacción.');
        return;
      }
      if (referenceNumber.length < 5) {
        setPaymentError('El número de referencia debe contener al menos 5 dígitos.');
        return;
      }
    }

    const randVoucher = `VOU-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setVoucherId(randVoucher);
    setLastOrderStatus('Listo para retirar');
    setActiveSubTab('voucher');
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
      : activeSubTab === 'proposals' || activeSubTab === 'payment'
        ? 'proposals'
        : 'profile';

  const handleNav = (id: string) => {
    if (id === 'recipes') setActiveSubTab('recipes');
    else if (id === 'proposals') setActiveSubTab('proposals');
    else setActiveSubTab('profile');
  };

  const qrSidebarExtra = (
    <div className="p-4 border-b border-surface-855 bg-surface-950/30 space-y-3">
      <div className="flex justify-between items-center text-[10px] font-bold text-surface-400 uppercase tracking-wider">
        <span>Credencial QR Dinámica</span>
        <button
          onClick={handleRefreshQR}
          className="text-primary-400 hover:text-primary-300 flex items-center gap-0.5 cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Rotar</span>
        </button>
      </div>
      <div className="flex flex-col items-center bg-white p-3 rounded-xl shadow-inner relative group border border-surface-700/10">
        <svg viewBox="0 0 100 100" className="w-28 h-28 text-surface-900">
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
        <div className="mt-2 text-center">
          <span className="text-[10px] font-mono font-bold text-surface-800 tracking-wider">
            TOKEN: {qrToken}
          </span>
          <p className="text-[8px] text-surface-500 font-medium mt-0.5">
            Vence en <span className="text-secondary-500 font-bold">{qrSecondsLeft}s</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell
      contentClassName="max-w-5xl"
      sidebar={
        <AppSidebar
          accent="primary"
          className="bg-surface-900 border-surface-855"
          brand={{ icon: Activity, title: 'Mi Salud', subtitle: 'Portal de Pacientes' }}
          sectionLabel="Mi Historial"
          sidebarExtra={qrSidebarExtra}
          items={[
            { id: 'recipes', name: 'Récipes Médicos', icon: FileText },
            { id: 'proposals', name: 'Propuestas de Compra', icon: FileSpreadsheet },
            { id: 'profile', name: 'Configuración Perfil', icon: User },
          ]}
          activeId={activeNavId}
          onNavigate={handleNav}
          profile={{
            initials: 'SP',
            name: profileName,
            role: 'Paciente ID #8849',
            avatarClassName: 'bg-primary-600 border-none',
          }}
          onLogout={onLogout}
        />
      }
      header={
        <AppHeader
          statusLabel="Portal del Paciente Activo"
          showNotifications={false}
          trailing={<span className="text-xs font-bold text-surface-350">{patientEmail}</span>}
        />
      }
    >
            {activeSubTab === 'recipes' && (
              <div className="space-y-6">
                <PageHeader
                  title="Historial de Récipes Médicos"
                  description="Consulte, visualice e imprima sus recetas prescritas vigentes."
                />

                {/* Progress Stepper for last order */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group">
                  <div className="space-y-1.5 z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Última Orden de Farmacia</span>
                      <span className="text-xs font-mono font-semibold text-surface-500">ID: #ORD-9923</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">Retiro de Medicamentos (Receta Activa)</h3>
                    <p className="text-xs text-surface-400">Retira en Farmacia Central (Sanatorio Zenith) • Pasillo B, Mostrador 3</p>
                  </div>

                  <div className="flex flex-col space-y-2 z-10 shrink-0">
                    <span className="text-[10px] text-surface-500 font-bold uppercase md:text-right">Progreso de Entrega</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-surface-950 border border-surface-850 px-4 py-2.5 rounded-xl gap-6">
                        {/* Step 1: Pendiente */}
                        <div className="flex items-center gap-2 relative">
                          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            lastOrderStatus === 'Pendiente por retirar' 
                              ? 'bg-primary-500 text-surface-950 font-bold shadow-[0_0_8px_rgba(80,233,248,0.5)]' 
                              : 'bg-surface-800 text-surface-500'
                          }`}>
                            {lastOrderStatus === 'Listo para retirar' || lastOrderStatus === 'Retirado' ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-secondary-400" />
                            ) : '1'}
                          </span>
                          <span className={`text-2xs font-semibold ${
                            lastOrderStatus === 'Pendiente por retirar' ? 'text-primary-400 font-bold' : 'text-surface-500'
                          }`}>Pendiente</span>
                        </div>

                        <span className="h-0.5 w-6 bg-surface-800"></span>

                        {/* Step 2: Listo */}
                        <div className="flex items-center gap-2 relative">
                          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            lastOrderStatus === 'Listo para retirar' 
                              ? 'bg-primary-500 text-white font-bold shadow-[0_0_8px_rgba(80,233,248,0.5)]' 
                              : lastOrderStatus === 'Retirado'
                              ? <CheckCircle2 className="h-4.5 w-4.5 text-secondary-400" />
                              : '2'
                          }`}>
                            {lastOrderStatus === 'Retirado' ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-secondary-400" />
                            ) : '2'}
                          </span>
                          <span className={`text-2xs font-semibold ${
                            lastOrderStatus === 'Listo para retirar' ? 'text-primary-400 font-bold' : 'text-surface-550'
                          }`}>Listo para Retirar</span>
                        </div>

                        <span className="h-0.5 w-6 bg-surface-800"></span>

                        {/* Step 3: Retirado */}
                        <div className="flex items-center gap-2 relative">
                          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            lastOrderStatus === 'Retirado' 
                              ? 'bg-secondary-500 text-surface-950 font-bold shadow-[0_0_8px_rgba(23,145,80,0.5)]' 
                              : 'bg-surface-800 text-surface-500'
                          }`}>
                            3
                          </span>
                          <span className={`text-2xs font-semibold ${
                            lastOrderStatus === 'Retirado' ? 'text-secondary-400 font-bold' : 'text-surface-500'
                          }`}>Retirado</span>
                        </div>
                      </div>

                      <button 
                        onClick={cycleOrderStatus} 
                        className="p-2.5 bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white rounded-xl border border-surface-700 transition-colors cursor-pointer"
                        title="Simular actualización del estado de entrega"
                      >
                        <PackageCheck className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  <div className={`absolute top-0 right-0 h-1 w-full bg-gradient-to-r ${
                    lastOrderStatus === 'Pendiente por retirar' 
                      ? 'from-primary-400 to-primary-600' 
                      : lastOrderStatus === 'Listo para retirar'
                      ? 'from-primary-400 to-primary-600'
                      : 'from-secondary-400 to-secondary-500'
                  }`}></div>
                </div>

                {/* Recipes Table Card */}
                <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-base">Récipes Emitidos por Especialistas</h3>
                    <p className="text-xs text-surface-400">Listado cronológico de recetas autorizadas.</p>
                  </div>

                  <div className="overflow-x-auto">
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
                            <td className="py-4">
                              <span className={`px-2 py-0.5 text-2xs font-semibold border rounded-full ${
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
                        <h3 className="font-bold text-white text-base">Desglose de Medicamentos Recetados</h3>
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
                            : 'Requiere la aceptación de Términos y Condiciones Farma-Humana.'
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
                      <h3 className="font-bold text-white text-base">Resumen de Facturación</h3>

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
                          <span className="font-bold text-white text-sm">Total Neto</span>
                          <span className="text-xl font-black text-primary-400">${totals.netTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Building className="h-4 w-4 text-surface-400" />
                        <span>Sucursal de Envío</span>
                      </h3>
                      
                      <div className="space-y-2">
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="w-full bg-surface-950/60 border border-surface-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                        >
                          <option value="Farma-Humana Central (Av. de la Castellana 210)">Farma-Humana Central (Av. Castellana 210)</option>
                          <option value="Farma-Humana Norte (Calle Serrano 80)">Farma-Humana Norte (Calle Serrano 80)</option>
                          <option value="Farma-Humana Sur (Av. de la Albufera 14)">Farma-Humana Sur (Av. Albufera 14)</option>
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
                  title="Pasarela de Confirmación de Pago"
                  description="Registre el pago de sus medicamentos reservados en el almacén de Farma-Humana."
                  actions={
                    <div className="bg-secondary-500/10 border border-secondary-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0">
                      <Clock className="h-5 w-5 text-secondary-400 animate-pulse" />
                      <div>
                        <span className="text-[9px] font-bold text-secondary-450 uppercase leading-none block">Reserva de Inventario</span>
                        <span className="text-lg font-mono font-black text-white">{formatTime(paymentTimeLeft)}</span>
                      </div>
                    </div>
                  }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Payment form */}
                  <div className="lg:col-span-2 bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
                    <div>
                      <h3 className="font-bold text-white text-base">Registro del Comprobante</h3>
                      <p className="text-xs text-surface-400">Seleccione su método de pago y consigne los datos solicitados.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setPaymentMethod('mobile')}
                        className={`py-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'mobile'
                            ? 'bg-primary-500/15 border-primary-500 text-white'
                            : 'bg-surface-950/40 border-surface-850 text-surface-400 hover:text-surface-200'
                        }`}
                      >
                        <QrCode className="h-4.5 w-4.5" />
                        <span>Pago Móvil</span>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('transfer')}
                        className={`py-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'transfer'
                            ? 'bg-primary-500/15 border-primary-500 text-white'
                            : 'bg-surface-950/40 border-surface-850 text-surface-400 hover:text-surface-200'
                        }`}
                      >
                        <Building className="h-4.5 w-4.5" />
                        <span>Transferencia</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`py-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-primary-500/15 border-primary-500 text-white'
                            : 'bg-surface-950/40 border-surface-850 text-surface-400 hover:text-surface-200'
                        }`}
                      >
                        <CreditCard className="h-4.5 w-4.5" />
                        <span>Tarjeta Crédito</span>
                      </button>
                    </div>

                    <form onSubmit={handleRegisterPayment} className="space-y-4">
                      
                      {paymentError && (
                        <div className="p-3 bg-secondary-500/10 border border-secondary-500/20 rounded-xl text-secondary-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>{paymentError}</span>
                        </div>
                      )}

                      {paymentMethod === 'mobile' && (
                        <div className="p-4 bg-surface-950/50 border border-surface-850 rounded-xl space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-4 text-surface-450">
                            <div>
                              <p className="font-semibold text-surface-500">Banco de Destino</p>
                              <p className="font-bold text-white mt-0.5">Banco de España (0030)</p>
                            </div>
                            <div>
                              <p className="font-semibold text-surface-500">Teléfono Afiliado</p>
                              <p className="font-bold text-white mt-0.5">+34 600 123 456</p>
                            </div>
                            <div>
                              <p className="font-semibold text-surface-500">Identificación (CIF)</p>
                              <p className="font-bold text-white mt-0.5">B-12994821</p>
                            </div>
                            <div>
                              <p className="font-semibold text-surface-500">Monto exacto a transferir</p>
                              <p className="font-bold text-primary-400 mt-0.5">${totals.netTotal.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-surface-850">
                            <label className="text-2xs font-bold text-surface-400 uppercase">Número de Referencia del Pago Móvil</label>
                            <input
                              type="text"
                              placeholder="Ej: 882103"
                              value={referenceNumber}
                              onChange={(e) => setReferenceNumber(e.target.value)}
                              className="w-full bg-surface-950 border border-surface-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-700"
                            />
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'transfer' && (
                        <div className="p-4 bg-surface-950/50 border border-surface-850 rounded-xl space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-4 text-surface-450">
                            <div>
                              <p className="font-semibold text-surface-500">Titular de la Cuenta</p>
                              <p className="font-bold text-white mt-0.5">Farma-Humana España S.L.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-surface-500">IBAN de Cuenta</p>
                              <p className="font-bold text-white mt-0.5">ES21 0030 1029 4812 0092</p>
                            </div>
                            <div>
                              <p className="font-semibold text-surface-500">Banco Receptor</p>
                              <p className="font-bold text-white mt-0.5">Banco de España</p>
                            </div>
                            <div>
                              <p className="font-semibold text-surface-500">Importe a Confirmar</p>
                              <p className="font-bold text-primary-400 mt-0.5">${totals.netTotal.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-surface-850">
                            <label className="text-2xs font-bold text-surface-400 uppercase">Referencia Bancaria (Número de Operación)</label>
                            <input
                              type="text"
                              placeholder="Ej: 290199482"
                              value={referenceNumber}
                              onChange={(e) => setReferenceNumber(e.target.value)}
                              className="w-full bg-surface-950 border border-surface-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-700"
                            />
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'card' && (
                        <div className="p-4 bg-surface-950/50 border border-surface-850 rounded-xl space-y-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="text-2xs font-bold text-surface-400 uppercase">Número de Tarjeta</label>
                            <input
                              type="text"
                              placeholder="4000 1234 5678 9010"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full bg-surface-950 border border-surface-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-700"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-2xs font-bold text-surface-400 uppercase">Expiración (MM/AA)</label>
                              <input
                                type="text"
                                placeholder="12/28"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                className="w-full bg-surface-950 border border-surface-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-700"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-2xs font-bold text-surface-400 uppercase">Código CVC</label>
                              <input
                                type="password"
                                placeholder="***"
                                value={cardCVC}
                                onChange={(e) => setCardCVC(e.target.value)}
                                className="w-full bg-surface-950 border border-surface-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-700"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveSubTab('proposals')}
                          className="px-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-surface-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <Button type="submit">
                          Registrar Pago de ${totals.netTotal.toFixed(2)}
                        </Button>
                      </div>

                    </form>
                  </div>

                  {/* Summary of checkout */}
                  <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <h3 className="font-bold text-white text-sm">Resumen de Compra</h3>
                    
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
                        <h3 className="text-base font-extrabold text-white mt-0.5">Comprobante de Venta</h3>
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
                        <h4 className="text-sm font-bold text-surface-950">Farma-Humana España S.L.</h4>
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
                        <p className="font-semibold text-surface-600">Referencia de Pago Registrada:</p>
                        <p className="font-mono text-surface-800 font-bold mt-0.5">
                          {paymentMethod === 'card' ? 'TRANS-CREDIT-CARD-OK' : referenceNumber}
                        </p>
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
                      <h3 className="text-xs font-bold text-primary-400 uppercase tracking-widest border-b border-surface-850 pb-2">
                        Información Personal
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-2xs font-bold text-surface-400 uppercase">Nombre Completo</label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-2xs font-bold text-surface-400 uppercase">Correo Electrónico (No editable)</label>
                          <input
                            type="email"
                            value={patientEmail}
                            disabled
                            className="w-full bg-surface-950/40 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-550 focus:outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-2xs font-bold text-surface-400 uppercase">Teléfono de Contacto</label>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-2xs font-bold text-surface-400 uppercase">Documento de Identidad (DNI/CIF)</label>
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
                      <h3 className="text-xs font-bold text-primary-400 uppercase tracking-widest border-b border-surface-850 pb-2">
                        Dirección Predeterminada de Delivery
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-2xs font-bold text-surface-400 uppercase">Calle, Número, Piso/Puerta</label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Ej: Calle Mayor 12, Piso 4B"
                            className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-2xs font-bold text-surface-400 uppercase">Código Postal</label>
                            <input
                              type="text"
                              value={deliveryPostalCode}
                              onChange={(e) => setDeliveryPostalCode(e.target.value)}
                              placeholder="Ej: 28013"
                              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-surface-800"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-2xs font-bold text-surface-400 uppercase">Ciudad</label>
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
                    <h1 className="text-2xl font-black tracking-tight uppercase">Clínica Zenith</h1>
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

      {/* Mandatory Terms & Conditions Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-surface-950/75 backdrop-blur-sm" onClick={() => setIsTermsModalOpen(false)}></div>
          
          <div className="relative bg-surface-900 border border-surface-800 text-surface-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 bg-surface-950/40">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-400" />
                <span>Términos y Condiciones Farma-Humana</span>
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
                Al aceptar estos términos, autoriza expresamente a Farma-Humana al tratamiento de sus datos sensibles de salud, incluyendo prescripciones médicas, medicamentos recetados y diagnóstico clínico relacionado, de acuerdo con la Ley Orgánica de Protección de Datos de Carácter Personal (LOPD). Sus datos serán confidenciales y procesados únicamente para fines de expendio farmacéutico.
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
                <span>He leído y acepto expresamente los términos de tratamiento de datos y políticas de retiro físico de Farma-Humana.</span>
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
