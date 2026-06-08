'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  PlusCircle, 
  LogOut, 
  Heart, 
  ShieldAlert, 
  Clock,
  Check,
  ChevronRight,
  QrCode,
  Camera,
  Laptop,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Activity,
  UserCheck,
  ShieldCheck,
  Search,
  Sparkles,
  Percent,
  Send,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  Award,
  BarChart3,
  BadgeCheck,
  Star
} from 'lucide-react';

interface DoctorViewProps {
  doctorName: string;
  doctorEmail: string;
  onLogout: () => void;
}

interface LinkedPatient {
  id: string;
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

interface MedicalProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  description: string;
}

interface CartItem {
  product: MedicalProduct;
  posology: string;
  discount: number;
  aiOptimized: boolean;
}

const FARMA_HUMANA_CATALOG: MedicalProduct[] = [
  { id: 'med-1', name: 'Ramipril 5mg', sku: 'RX-RAM-001', category: 'Cardiovascular', price: 12.50, stock: 120, description: 'Indicado para el tratamiento de la hipertensión arterial y reducción de morbilidad cardiovascular.' },
  { id: 'med-2', name: 'Aspirina 100mg', sku: 'RX-ASP-002', category: 'Analgesia / Antiagregante', price: 6.00, stock: 450, description: 'Antiagregante plaquetario para la prevención cardiovascular.' },
  { id: 'med-3', name: 'Amoxicilina 875mg + Ácido Clavulánico 125mg', sku: 'RX-AMO-003', category: 'Antibiótico', price: 18.20, stock: 80, description: 'Tratamiento de infecciones bacterianas del tracto respiratorio u oído.' },
  { id: 'med-4', name: 'Metformina 850mg', sku: 'RX-MET-004', category: 'Antidiabético', price: 9.80, stock: 310, description: 'Tratamiento de la diabetes mellitus tipo 2 en adultos.' },
  { id: 'med-5', name: 'Atorvastatina 20mg', sku: 'RX-ATO-005', category: 'Hipolipemiante', price: 15.40, stock: 150, description: 'Tratamiento para la reducción del colesterol total y LDL elevado.' },
  { id: 'med-6', name: 'Ibuprofeno 600mg', sku: 'RX-IBU-006', category: 'Antiinflamatorio', price: 4.50, stock: 500, description: 'Alivio del dolor moderado y reducción de procesos febriles o inflamatorios.' }
];

// Commission entry record
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

// Signed recipe log entry
interface RecipeLogEntry {
  id: string;
  date: string;
  patientName: string;
  patientId: string;
  medications: string[];
  branch: string;
  status: 'Enviado' | 'Confirmado' | 'Retirado';
}

const MOCK_COMMISSIONS: CommissionEntry[] = [
  { id: 'COM-2026-041', date: '08 Jun, 2026', patientName: 'Sofía Peralta', medication: 'Ramipril 5mg + Aspirina 100mg', saleAmount: 18.50, commissionRate: 8, commissionAmount: 1.48, status: 'Acreditado' },
  { id: 'COM-2026-038', date: '05 Jun, 2026', patientName: 'Carlos Mendoza', medication: 'Metformina 850mg', saleAmount: 9.80, commissionRate: 8, commissionAmount: 0.78, status: 'Acreditado' },
  { id: 'COM-2026-031', date: '01 Jun, 2026', patientName: 'Ana Gómez Román', medication: 'Atorvastatina 20mg', saleAmount: 15.40, commissionRate: 8, commissionAmount: 1.23, status: 'Acreditado' },
  { id: 'COM-2026-029', date: '28 May, 2026', patientName: 'Luis Rodríguez Silva', medication: 'Ibuprofeno 600mg', saleAmount: 4.50, commissionRate: 8, commissionAmount: 0.36, status: 'Pendiente' },
  { id: 'COM-2026-022', date: '20 May, 2026', patientName: 'Sofía Peralta', medication: 'Aspirina 100mg', saleAmount: 6.00, commissionRate: 8, commissionAmount: 0.48, status: 'Acreditado' },
];

const MOCK_RECIPE_LOG: RecipeLogEntry[] = [
  { id: 'REC-2026-904', date: '08 Jun, 2026', patientName: 'Sofía Peralta', patientId: 'PX-992-8849', medications: ['Ramipril 5mg', 'Aspirina 100mg'], branch: 'Farma-Humana Central', status: 'Confirmado' },
  { id: 'REC-2026-901', date: '05 Jun, 2026', patientName: 'Carlos Mendoza', patientId: 'PX-992-1029', medications: ['Metformina 850mg'], branch: 'Farma-Humana Norte', status: 'Retirado' },
  { id: 'REC-2026-887', date: '01 Jun, 2026', patientName: 'Ana Gómez Román', patientId: 'PX-992-0344', medications: ['Atorvastatina 20mg'], branch: 'Farma-Humana Sur', status: 'Retirado' },
  { id: 'REC-2026-881', date: '28 May, 2026', patientName: 'Luis Rodríguez Silva', patientId: 'PX-992-0811', medications: ['Ibuprofeno 600mg'], branch: 'Farma-Humana Central', status: 'Enviado' },
];

export default function DoctorView({ doctorName, doctorEmail, onLogout }: DoctorViewProps) {
  // Navigation active tab: 'agenda' | 'reception' | 'prescription' | 'commissions'
  const [activeTab, setActiveTab] = useState<'agenda' | 'reception' | 'prescription' | 'commissions'>('agenda');

  const [appointments, setAppointments] = useState([
    { id: 'CITA-201', patientName: 'Sofía Peralta', time: '09:00 AM', reason: 'Control Cardiológico', status: 'Atendido' },
    { id: 'CITA-202', patientName: 'Carlos Mendoza', time: '10:30 AM', reason: 'Evaluación General', status: 'Pendiente' },
    { id: 'CITA-203', patientName: 'Ana Gómez Román', time: '12:00 PM', reason: 'Revisión Resultados Laboratorio', status: 'Pendiente' },
    { id: 'CITA-204', patientName: 'Luis Rodríguez Silva', time: '03:30 PM', reason: 'Chequeo de Presión Arterial', status: 'Pendiente' },
  ]);

  const [activePatients, setActivePatients] = useState([
    { name: 'Sofía Peralta', age: 28, condition: 'Hipertensión Leve', lastVisit: '08 de Jun, 2026' },
    { name: 'Carlos Mendoza', age: 45, condition: 'Diabetes Tipo 2 (Controlada)', lastVisit: '01 de Jun, 2026' },
    { name: 'Ana Gómez Román', age: 34, condition: 'Ninguna (Chequeo anual)', lastVisit: '15 de May, 2026' },
  ]);

  // Reception / QR scan states (M.1)
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [manualIdInput, setManualIdInput] = useState('');
  const [linkedPatient, setLinkedPatient] = useState<LinkedPatient | null>(null);
  const [isMirroring, setIsMirroring] = useState(false);
  const [mirrorProgress, setMirrorProgress] = useState(0);

  // Prescription states (M.2)
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAttendAppointment = (appointmentId: string, patientName: string) => {
    // Mark as attended
    setAppointments(appointments.map(app => 
      app.id === appointmentId ? { ...app, status: 'Atendido' } : app
    ));
    
    // Automatically open reception tab and pre-link patient
    if (patientName === 'Sofía Peralta') {
      linkPatientMock('8849');
    } else {
      linkPatientMock('generic');
    }
    setActiveTab('reception');
  };

  const linkPatientMock = (idType: string) => {
    setIsMirroring(false);
    setMirrorProgress(0);

    if (idType === '8849' || idType.toLowerCase().includes('px-992')) {
      // Link Sofía Peralta
      setLinkedPatient({
        id: 'PX-992-8849',
        name: 'Sofía Peralta',
        age: 28,
        gender: 'Femenino',
        bloodType: 'O+',
        phone: '+34 600 123 456',
        condition: 'Hipertensión Arterial Leve',
        allergies: 'Penicilina',
        lastVisit: '08 Jun, 2026',
        medications: ['Ramipril 5mg', 'Aspirina 100mg']
      });
    } else {
      // Link Carlos Mendoza
      setLinkedPatient({
        id: 'PX-992-1029',
        name: 'Carlos Mendoza',
        age: 45,
        gender: 'Masculino',
        bloodType: 'A-',
        phone: '+34 699 987 654',
        condition: 'Diabetes Tipo 2 (Controlada)',
        allergies: 'Ninguna conocida',
        lastVisit: '01 Jun, 2026',
        medications: ['Metformina 850mg']
      });
    }

    // Auto-trigger Mirror data simulation after linking
    setIsMirroring(true);
  };

  // Simulate scanning camera
  const triggerCameraScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setLinkedPatient(null);
    setIsMirroring(false);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning) {
      timer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            setIsScanning(false);
            linkPatientMock('8849'); // Auto link main patient Sofia
            return 0;
          }
          return prev + 25;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  // Simulate mirroring progress bar
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isMirroring && mirrorProgress < 100) {
      timer = setInterval(() => {
        setMirrorProgress((prev) => {
          if (prev >= 100) {
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isMirroring, mirrorProgress]);

  const handleManualLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIdInput) {
      alert('Por favor ingrese un ID de paciente.');
      return;
    }
    linkPatientMock(manualIdInput);
    setManualIdInput('');
  };

  // Cart operations
  const addToCart = (product: MedicalProduct) => {
    // Check if already in cart
    if (cart.some(item => item.product.id === product.id)) {
      return;
    }
    setCart([...cart, { product, posology: '', discount: 10, aiOptimized: false }]);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCartPosology = (productId: string, val: string) => {
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, posology: val, aiOptimized: false } : item
    ));
  };

  const updateCartDiscount = (productId: string, val: number) => {
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, discount: val } : item
    ));
  };

  // AI assistant suggestion simulation
  const handleAiPosologyAssist = (productId: string, name: string) => {
    setAiLoadingId(productId);
    
    // Simulate AI clinical reasoning
    setTimeout(() => {
      let suggestedPosology = '';
      if (name.includes('Ramipril')) {
        suggestedPosology = 'Tomar 1 comprimido al día por la mañana en ayunas. Controlar presión arterial semanalmente.';
      } else if (name.includes('Aspirina')) {
        suggestedPosology = 'Tomar 1 comprimido diario durante el almuerzo con un vaso de agua completo.';
      } else if (name.includes('Amoxicilina')) {
        suggestedPosology = 'Tomar 1 comprimido cada 12 horas con las comidas por 7 días. Completar el ciclo indicado.';
      } else if (name.includes('Metformina')) {
        suggestedPosology = 'Tomar 1 comprimido por la noche con la cena para reducir malestar gastrointestinal.';
      } else if (name.includes('Atorvastatina')) {
        suggestedPosology = 'Tomar 1 comprimido por la noche antes de acostarse. Evitar consumo de pomelo.';
      } else {
        suggestedPosology = 'Tomar 1 comprimido cada 8 horas en caso de dolor o inflamación aguda.';
      }

      setCart(prevCart => prevCart.map(item => 
        item.product.id === productId ? { ...item, posology: suggestedPosology, aiOptimized: true } : item
      ));
      setAiLoadingId(null);
    }, 800);
  };

  // Submit Prescription
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
    
    setTimeout(() => {
      setSuccessMsg('');
    }, 4500);
  };

  // Filter pharmaceutical products
  const filteredCatalog = FARMA_HUMANA_CATALOG.filter(prod => 
    prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Laser scanning keyframe animation style */}
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

      {/* Doctor Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-850 flex flex-col h-full shrink-0 text-slate-300">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-850 bg-slate-950/20">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-rose-500 to-red-655 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-base leading-none">Portal Médico</h1>
            <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">Sistema de Salud</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Menú Principal
          </div>
          
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'agenda'
                ? 'bg-gradient-to-r from-rose-500/10 to-red-500/10 text-white border-l-2 border-rose-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 border-l-2 border-transparent'
            }`}
          >
            <Calendar className={`h-5 w-5 ${activeTab === 'agenda' ? 'text-rose-400' : ''}`} />
            <span>Agenda del Día</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('reception')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'reception'
                ? 'bg-gradient-to-r from-rose-500/10 to-red-500/10 text-white border-l-2 border-rose-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 border-l-2 border-transparent'
            }`}
          >
            <QrCode className={`h-5 w-5 ${activeTab === 'reception' ? 'text-rose-455' : ''}`} />
            <span>Recepción y Escáner (M.1)</span>
          </button>

          <button 
            onClick={() => setActiveTab('prescription')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'prescription'
                ? 'bg-gradient-to-r from-rose-500/10 to-red-500/10 text-white border-l-2 border-rose-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 border-l-2 border-transparent'
            }`}
          >
            <FileText className={`h-5 w-5 ${activeTab === 'prescription' ? 'text-rose-455' : ''}`} />
            <span>Prescribir con IA (M.2)</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('commissions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'commissions'
                ? 'bg-gradient-to-r from-rose-500/10 to-red-500/10 text-white border-l-2 border-rose-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 border-l-2 border-transparent'
            }`}
          >
            <TrendingUp className={`h-5 w-5 ${activeTab === 'commissions' ? 'text-rose-455' : ''}`} />
            <span>Comisiones e Historial (M.3)</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 border-l-2 border-transparent">
            <Users className="h-5 w-5" />
            <span>Pacientes</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 border-l-2 border-transparent">
            <FileText className="h-5 w-5" />
            <span>Informes Clínicos</span>
          </button>
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/20 space-y-3">
          <div className="flex items-center gap-3 p-1">
            <div className="h-9 w-9 rounded-full bg-rose-600 flex items-center justify-center font-bold text-white text-xs">
              AR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{doctorName}</p>
              <p className="text-[10px] text-slate-500 truncate">Cardiólogo (M.P. 28.490/7)</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 flex items-center justify-between px-8 bg-slate-950/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Consulta en Curso</span>
          </div>
          <span className="text-xs font-bold text-slate-350">{doctorEmail}</span>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* VIEW TAB 1: DAILY AGENDA & METRICS */}
            {activeTab === 'agenda' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Bienvenido de nuevo, {doctorName}</h2>
                  <p className="text-sm text-slate-400">Resumen de citas agendadas y pacientes clínicos asignados.</p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Citas Hoy</span>
                      <p className="text-xl font-bold text-white mt-0.5">{appointments.length}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Citas Pendientes</span>
                      <p className="text-xl font-bold text-white mt-0.5">
                        {appointments.filter(a => a.status === 'Pendiente').length}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Pacientes Activos</span>
                      <p className="text-xl font-bold text-white mt-0.5">{activePatients.length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Appointments list */}
                  <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-white text-base">Pacientes Agendados</h3>
                      <p className="text-xs text-slate-400">Atienda y vincule expedientes clínicos en lista de espera.</p>
                    </div>

                    <div className="divide-y divide-slate-850">
                      {appointments.map((app) => (
                        <div key={app.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{app.patientName}</p>
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                                {app.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-550" />
                              <span>{app.time} • Motivo: <span className="italic">{app.reason}</span></span>
                            </p>
                          </div>

                          <div>
                            {app.status === 'Atendido' ? (
                              <span className="px-2.5 py-1 text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                <span>Atendido</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAttendAppointment(app.id, app.patientName)}
                                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer"
                              >
                                Atender Paciente
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patient warnings */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">Alertas Clínicas Críticas</h3>
                      <p className="text-xs text-slate-400">Seguimiento de condiciones críticas registradas.</p>
                    </div>

                    <div className="space-y-3 flex-1 pt-2">
                      {activePatients.map((pat, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">{pat.name}</span>
                            <span className="text-slate-555 text-[10px] font-medium">Edad: {pat.age} años</span>
                          </div>
                          <p className="text-[10px] text-rose-455 flex items-center gap-1 font-semibold">
                            <ShieldAlert className="h-3 w-3 text-rose-400" />
                            <span>Condición: {pat.condition}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => setActiveTab('reception')}
                      className="w-full text-center text-xs text-rose-400 font-semibold hover:text-rose-300 transition-colors pt-2 border-t border-slate-850 mt-4 flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <span>Abrir Escáner de Récipes</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW TAB 2: PATIENT QR SCANNER & RECEPTION (Pantalla M.1) */}
            {activeTab === 'reception' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Escáner y Recepción de Paciente</h2>
                  <p className="text-sm text-slate-400">Escanee el código QR dinámico de la credencial del paciente para vincular el historial clínico en tiempo real.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: QR Code simulated Scanner */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-5 flex flex-col items-center text-center">
                    <div className="w-full text-left">
                      <h3 className="font-bold text-white text-base">Módulo de Vinculación</h3>
                      <p className="text-xs text-slate-400">Active la cámara o digite manualmente el ID del token.</p>
                    </div>

                    {/* Camera Simulation Box */}
                    <div className="w-full max-w-[240px] aspect-square rounded-2xl bg-slate-950 border border-slate-800 relative flex flex-col items-center justify-center overflow-hidden p-4 group">
                      
                      {isScanning ? (
                        <>
                          <div className="absolute left-0 w-full h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] laser-line"></div>
                          
                          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-rose-500"></div>
                          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-rose-500"></div>
                          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-rose-500"></div>
                          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-rose-500"></div>

                          <div className="space-y-2 text-center z-10">
                            <Camera className="h-8 w-8 text-rose-500 animate-pulse mx-auto" />
                            <p className="text-[10px] text-rose-400 font-mono font-bold tracking-wider">BUSCANDO QR ({scanProgress}%)</p>
                          </div>
                        </>
                      ) : linkedPatient ? (
                        <div className="space-y-2 text-center z-10 animate-in zoom-in-95 duration-200">
                          <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/30 flex items-center justify-center mx-auto">
                            <UserCheck className="h-6 w-6" />
                          </div>
                          <p className="text-xs font-bold text-white">Paciente Vinculado</p>
                          <span className="text-[10px] text-slate-500 font-mono block">{linkedPatient.id}</span>
                        </div>
                      ) : (
                        <div className="space-y-3 text-center z-10">
                          <QrCode className="h-12 w-12 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400 font-medium">Cámara de Escáner Inactiva</p>
                          <button
                            onClick={triggerCameraScan}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-2xs font-bold transition-all shadow-md shadow-rose-650/10 cursor-pointer"
                          >
                            Activar Escáner Cámara
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="w-full flex items-center justify-center gap-3 text-2xs font-bold text-slate-600 uppercase tracking-widest py-1">
                      <span className="h-px bg-slate-800 flex-1"></span>
                      <span>o</span>
                      <span className="h-px bg-slate-800 flex-1"></span>
                    </div>

                    <form onSubmit={handleManualLinkSubmit} className="w-full space-y-3 text-left">
                      <div className="space-y-1.5">
                        <label className="text-2xs font-bold text-slate-550 uppercase">Ingresar ID Paciente Manualmente</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ej: PX-992-8849"
                            value={manualIdInput}
                            onChange={(e) => setManualIdInput(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-750 focus:outline-none focus:border-rose-500"
                          />
                          <button
                            type="submit"
                            className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                          >
                            Vincular
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-555 italic leading-snug">
                        Tip de prueba: Digite <code className="text-rose-400 font-mono">8849</code> para vincular directamente a Sofía Peralta.
                      </p>
                    </form>
                  </div>

                  {/* Right Column: Bidirectional panel */}
                  <div className="lg:col-span-2 space-y-6">
                    {linkedPatient ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Bloque A: Demographic data and patient history */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 animate-in fade-in duration-300 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div>
                              <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Bloque A</span>
                              <h3 className="font-bold text-white text-base mt-1.5">Expediente Clínico</h3>
                              <p className="text-xs text-slate-400">Datos médicos visibles en su pantalla de control.</p>
                            </div>

                            <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl space-y-2.5 text-xs">
                              <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                                <span className="font-semibold text-white text-sm">{linkedPatient.name}</span>
                                <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded">
                                  {linkedPatient.gender}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-y-2 text-2xs text-slate-400">
                                <div>
                                  <span className="text-slate-555 uppercase font-bold block">Edad</span>
                                  <span className="text-slate-200">{linkedPatient.age} años</span>
                                </div>
                                <div>
                                  <span className="text-slate-555 uppercase font-bold block">Grupo Sanguíneo</span>
                                  <span className="text-slate-200">{linkedPatient.bloodType}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-555 uppercase font-bold block">Teléfono Móvil</span>
                                  <span className="text-slate-200">{linkedPatient.phone}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2.5 text-xs">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-rose-455 uppercase block">Diagnóstico de Control</span>
                                <p className="text-slate-300 font-semibold">{linkedPatient.condition}</p>
                              </div>
                              
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-rose-455 uppercase block">Alergias Críticas</span>
                                <p className="text-rose-400 font-bold flex items-center gap-1.5">
                                  <ShieldAlert className="h-3.5 w-3.5 text-rose-455" />
                                  <span>{linkedPatient.allergies}</span>
                                </p>
                              </div>

                              <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Tratamientos Prescritos Activos</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {linkedPatient.medications.map((med, index) => (
                                    <span key={index} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-2xs font-medium">
                                      {med}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveTab('prescription')}
                            className="w-full mt-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Iniciar Consulta / Prescribir</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Bloque B: Visual Mirror confirmation of patient feed */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-5 flex flex-col justify-between animate-in fade-in duration-300">
                          <div className="space-y-4">
                            <div>
                              <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Bloque B</span>
                              <h3 className="font-bold text-white text-base mt-1.5">Espejo de Datos</h3>
                              <p className="text-xs text-slate-400">Confirmación del envío de información en espejo.</p>
                            </div>

                            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-4 text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${mirrorProgress === 100 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`}></span>
                                <span className="font-bold text-slate-300">
                                  {mirrorProgress === 100 ? 'Conexión Espejo Estable' : 'Sincronizando Espejo...'}
                                </span>
                              </div>

                              <div className="space-y-2 text-2xs text-slate-400">
                                <div className="flex justify-between">
                                  <span>Médico Conectado</span>
                                  <span className="text-slate-200">{doctorName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>ID Cédula Profesional</span>
                                  <span className="text-slate-200">M.P. 28.490/7</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pantalla del Paciente</span>
                                  <span className="text-slate-200 font-mono">{linkedPatient.name} Portal</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-rose-500 transition-all duration-300 ease-out"
                                    style={{ width: `${mirrorProgress}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9px] text-slate-500 font-mono text-right block">{mirrorProgress}% Transmitido</span>
                              </div>
                            </div>
                          </div>

                          {mirrorProgress === 100 ? (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-450 text-2xs flex items-start gap-2 animate-in zoom-in-95 duration-200">
                              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-450" />
                              <p className="leading-snug">
                                **Confirmado**: Los datos del médico e informe se transmitieron en espejo a la pantalla del paciente con éxito.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-550 text-2xs flex items-start gap-2">
                              <RefreshCw className="h-4 w-4 shrink-0 mt-0.5 animate-spin" />
                              <p className="leading-snug">
                                Enviando paquete de telemetría de consulta al dispositivo del paciente...
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div className="h-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[340px]">
                        <AlertCircle className="h-10 w-10 text-slate-650" />
                        <h4 className="font-bold text-white text-sm">Sin Paciente Vinculado</h4>
                        <p className="text-xs text-slate-450 max-w-sm leading-relaxed">
                          La sesión de consulta no se ha abierto. Escanee el código QR dinámico de la credencial de su paciente para cargar su historial clínico de forma segura.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* VIEW TAB 3: CLINICAL PRESCRIPTION & AI ASSISTANT (Pantalla M.2) */}
            {activeTab === 'prescription' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Linked Patient Header Bar */}
                <div className="bg-slate-900/65 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-rose-650 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                      {linkedPatient ? linkedPatient.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-450 uppercase font-bold tracking-wider">Paciente en Consulta</span>
                        {linkedPatient && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.2 rounded font-mono font-bold">
                            VINCULADO
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-0.5">
                        {linkedPatient ? `${linkedPatient.name} (${linkedPatient.age} años)` : 'Ninguno seleccionado'}
                      </h3>
                    </div>
                  </div>

                  {!linkedPatient && (
                    <button
                      onClick={() => setActiveTab('reception')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Vincular Paciente
                    </button>
                  )}
                </div>

                {successMsg && (
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs animate-in fade-in slide-in-from-top-2 duration-300 leading-relaxed">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {linkedPatient ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Grid: Catalog & Search (5 cols) */}
                    <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 flex flex-col max-h-[600px]">
                      <div>
                        <h3 className="font-bold text-white text-base">Buscador de Medicamentos</h3>
                        <p className="text-xs text-slate-400">Catálogo indexado de la farmacia Farma-Humana.</p>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o categoría..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-750 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Catalog Items list */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {filteredCatalog.map((prod) => {
                          const isAlreadySelected = cart.some(item => item.product.id === prod.id);
                          return (
                            <div 
                              key={prod.id} 
                              className={`p-3 border rounded-xl flex items-start justify-between gap-2.5 transition-all ${
                                isAlreadySelected
                                  ? 'bg-slate-950/60 border-slate-800 opacity-60'
                                  : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                              }`}
                            >
                              <div className="space-y-1 text-left min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-white truncate">{prod.name}</span>
                                  <span className="text-[8px] bg-slate-850 text-slate-400 px-1.5 py-0.2 rounded font-medium">
                                    {prod.category}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{prod.description}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                                  <span>Precio: ${prod.price.toFixed(2)}</span>
                                  <span>•</span>
                                  <span className={prod.stock < 20 ? 'text-amber-500 font-medium' : ''}>
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
                                    ? 'bg-slate-900 border-slate-850 text-slate-600'
                                    : 'bg-rose-500/10 hover:bg-rose-500 border-rose-500/20 hover:border-rose-550 text-rose-450 hover:text-white'
                                }`}
                              >
                                <Plus className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          );
                        })}

                        {filteredCatalog.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-500">
                            Ningún medicamento coincide con su búsqueda.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Grid: Active Prescription Cart & IA Assistant (7 cols) */}
                    <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between max-h-[600px] overflow-y-auto">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                          <div>
                            <h3 className="font-bold text-white text-base">Prescripción en Preparación</h3>
                            <p className="text-xs text-slate-400">Configure la posología de cada medicamento.</p>
                          </div>
                          <span className="text-xs bg-rose-500/10 text-rose-455 px-2 py-0.5 rounded font-bold">
                            {cart.length} medicamentos
                          </span>
                        </div>

                        {cart.length > 0 ? (
                          <form onSubmit={handleRegisterPrescription} className="space-y-5">
                            <div className="space-y-4 divide-y divide-slate-850">
                              {cart.map((item, index) => (
                                <div key={item.product.id} className={`pt-4 first:pt-0 space-y-3`}>
                                  
                                  {/* Item Header */}
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <h4 className="font-bold text-sm text-white">{item.product.name}</h4>
                                      <span className="text-[9px] text-slate-500 font-mono block">SKU: {item.product.sku}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(item.product.id)}
                                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="Quitar de la prescripción"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>

                                  {/* Posology input with IA assistant */}
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-slate-450 uppercase">Instrucciones de Posología</span>
                                      
                                      <button
                                        type="button"
                                        disabled={aiLoadingId === item.product.id}
                                        onClick={() => handleAiPosologyAssist(item.product.id, item.product.name)}
                                        className="text-[10px] font-extrabold bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-550/20 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                                      >
                                        {aiLoadingId === item.product.id ? (
                                          <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Sparkles className="h-3 w-3" />
                                        )}
                                        <span>Asistente IA</span>
                                      </button>
                                    </div>

                                    <textarea
                                      rows={2}
                                      value={item.posology}
                                      onChange={(e) => updateCartPosology(item.product.id, e.target.value)}
                                      placeholder="Ej: Tomar 1 comprimido al día por la mañana en ayunas..."
                                      className={`w-full bg-slate-950 border rounded-xl p-2.5 text-xs text-white placeholder-slate-750 focus:outline-none transition-all ${
                                        item.aiOptimized 
                                          ? 'border-indigo-500/50 focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500/20' 
                                          : 'border-slate-800 focus:border-rose-500'
                                      }`}
                                    />
                                    {item.aiOptimized && (
                                      <p className="text-[9px] text-indigo-400 font-semibold flex items-center gap-1">
                                        <Sparkles className="h-3 w-3" />
                                        <span>Posología estructurada y validada clínicamente por la IA de la clínica.</span>
                                      </p>
                                    )}
                                  </div>

                                  {/* Incentives / Discounts Selector */}
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-450 uppercase flex items-center gap-1">
                                      <Percent className="h-3 w-3 text-rose-455" />
                                      <span>Asignación de Incentivo / Descuento Exclusivo</span>
                                    </span>
                                    
                                    <div className="grid grid-cols-5 gap-1.5">
                                      {[0, 10, 15, 20, 30].map((disc) => (
                                        <button
                                          key={disc}
                                          type="button"
                                          onClick={() => updateCartDiscount(item.product.id, disc)}
                                          className={`py-1 rounded-lg text-2xs font-bold border transition-colors cursor-pointer ${
                                            item.discount === disc
                                              ? 'bg-rose-500 border-rose-550 text-white'
                                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
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
                            <div className="border-t border-slate-850 pt-4 space-y-2">
                              <div className="flex justify-between text-2xs text-slate-400">
                                <span>Estimación Subtotal Farmacia</span>
                                <span className="font-mono text-slate-200">
                                  ${cart.reduce((sum, item) => sum + item.product.price, 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-2xs text-rose-400 font-semibold">
                                <span>Descuentos Médicos Promedio</span>
                                <span>Ahorro para el Paciente</span>
                              </div>
                            </div>

                            {/* Main action submit */}
                            <button
                              type="submit"
                              className="w-full mt-2 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-550/10 hover:shadow-rose-550/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Send className="h-4 w-4" />
                              <span>Registrar e Iniciar Envío de Récipe</span>
                            </button>

                          </form>
                        ) : (
                          <div className="py-16 text-center space-y-2">
                            <PlusCircle className="h-10 w-10 text-slate-750 mx-auto" />
                            <h4 className="font-bold text-white text-xs">Prescripción Vacía</h4>
                            <p className="text-[10px] text-slate-450 max-w-xs mx-auto">
                              Seleccione medicamentos en el catálogo de Farma-Humana de la izquierda para agregarlos a la prescripción del paciente.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                    <AlertCircle className="h-10 w-10 text-slate-650" />
                    <h4 className="font-bold text-white text-sm">Sin Consulta Activa</h4>
                    <p className="text-xs text-slate-450 max-w-sm leading-relaxed">
                      Debe vincular a un paciente en el módulo de Recepción para acceder al entorno de prescripción clínica y asistencia farmacológica con IA.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* VIEW TAB 4: COMMISSIONS & CLINICAL HISTORY (Pantalla M.3) */}
            {activeTab === 'commissions' && (() => {
              const totalAccredited = MOCK_COMMISSIONS
                .filter(c => c.status === 'Acreditado')
                .reduce((sum, c) => sum + c.commissionAmount, 0);
              const totalPending = MOCK_COMMISSIONS
                .filter(c => c.status === 'Pendiente')
                .reduce((sum, c) => sum + c.commissionAmount, 0);
              const totalSales = MOCK_COMMISSIONS.reduce((sum, c) => sum + c.saleAmount, 0);
              const totalRecipes = MOCK_RECIPE_LOG.length;

              return (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Comisiones e Historial Clínico</h2>
                    <p className="text-sm text-slate-400">Seguimiento de ingresos por comisión y bitácora de récipes digitales firmados.</p>
                  </div>

                  {/* Financial KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <DollarSign className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comisiones Acreditadas</p>
                      <p className="text-2xl font-black text-emerald-400">${totalAccredited.toFixed(2)}</p>
                      <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-full bg-emerald-500/5"></div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Clock className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comisiones Pendientes</p>
                      <p className="text-2xl font-black text-amber-400">${totalPending.toFixed(2)}</p>
                      <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-full bg-amber-500/5"></div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <BarChart3 className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ventas Generadas</p>
                      <p className="text-2xl font-black text-indigo-400">${totalSales.toFixed(2)}</p>
                      <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-full bg-indigo-500/5"></div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <BadgeCheck className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Récipes Emitidos</p>
                      <p className="text-2xl font-black text-rose-400">{totalRecipes}</p>
                      <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-full bg-rose-500/5"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Commission Ledger */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-white text-base">Libro de Comisiones</h3>
                          <p className="text-xs text-slate-400">Incentivos asignados por venta efectiva en Farma-Humana.</p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">Tasa: 8%</span>
                      </div>

                      {/* Bar-chart style visualisation per entry */}
                      <div className="space-y-3">
                        {MOCK_COMMISSIONS.map((entry) => (
                          <div key={entry.id} className="space-y-1.5">
                            <div className="flex justify-between items-start text-xs">
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-200 block truncate">{entry.patientName}</span>
                                <span className="text-[10px] text-slate-500 truncate block">{entry.medication} • {entry.date}</span>
                              </div>
                              <div className="text-right shrink-0 pl-3">
                                <span className={`font-black text-sm ${ entry.status === 'Acreditado' ? 'text-emerald-400' : 'text-amber-450' }`}>
                                  +${entry.commissionAmount.toFixed(2)}
                                </span>
                                <span className={`text-[9px] font-bold block ${ entry.status === 'Acreditado' ? 'text-emerald-500/70' : 'text-amber-500/70' }`}>
                                  {entry.status}
                                </span>
                              </div>
                            </div>
                            {/* Sale proportion bar */}
                            <div className="h-1 w-full bg-slate-850 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${ entry.status === 'Acreditado' ? 'bg-emerald-500' : 'bg-amber-500' }`}
                                style={{ width: `${Math.min((entry.saleAmount / 25) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals row */}
                      <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Total Período Actual (Jun 2026)</span>
                        <span className="font-black text-white text-base">${(totalAccredited + totalPending).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Signed Recipe Log */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <div>
                        <h3 className="font-bold text-white text-base">Bitácora de Récipes Firmados</h3>
                        <p className="text-xs text-slate-400">Historial de recetas digitales emitidas y firmadas electrónicamente.</p>
                      </div>

                      <div className="divide-y divide-slate-850">
                        {MOCK_RECIPE_LOG.map((rec) => (
                          <div key={rec.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-white">{rec.patientName}</span>
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-950 border border-slate-850 px-1.5 py-0.2 rounded">{rec.id}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {rec.medications.map((med, idx) => (
                                  <span key={idx} className="text-[9px] bg-slate-800 text-slate-350 px-1.5 py-0.5 rounded font-medium">{med}</span>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <span>{rec.branch}</span>
                                <span>•</span>
                                <span>{rec.date}</span>
                              </p>
                            </div>
                            <div className="shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                rec.status === 'Retirado'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : rec.status === 'Confirmado'
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {rec.status === 'Retirado' && <Check className="h-3 w-3" />}
                                {rec.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Doctor signature block */}
                      <div className="border-t border-slate-850 pt-4 flex items-center justify-between">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-white">{doctorName}</p>
                          <p className="text-[10px] text-slate-500">M.P. 28.490/7 • Cardiología</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-450 font-bold">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Firma Digital Activa</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Performance & Rating Strip */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Rendimiento Mensual del Especialista</p>
                        <p className="text-[10px] text-slate-400">Basado en récipes emitidos, ventas generadas y satisfacción del paciente.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Récipes</p>
                        <p className="text-lg font-black text-white">{totalRecipes}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-800"></div>
                      <div className="text-center">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Ventas</p>
                        <p className="text-lg font-black text-white">${totalSales.toFixed(0)}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-800"></div>
                      <div className="text-center">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Valoración</p>
                        <div className="flex items-center gap-0.5 mt-0.5 justify-center">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-3.5 w-3.5 ${ s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-700' }`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        </main>
      </div>

    </div>
  );
}
