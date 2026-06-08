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
  ShieldCheck
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

export default function DoctorView({ doctorName, doctorEmail, onLogout }: DoctorViewProps) {
  // Navigation active tab: 'agenda' | 'reception'
  const [activeTab, setActiveTab] = useState<'agenda' | 'reception'>('agenda');

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
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-rose-500 to-red-650 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
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

                  {/* Patient warnings warnings */}
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
                            <span className="text-slate-550 text-[10px] font-medium">Edad: {pat.age} años</span>
                          </div>
                          <p className="text-[10px] text-rose-450 flex items-center gap-1 font-semibold">
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
                          {/* Animated scan laser line */}
                          <div className="absolute left-0 w-full h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] laser-line"></div>
                          
                          {/* Camera corners */}
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

                    {/* Manual entry separator */}
                    <div className="w-full flex items-center justify-center gap-3 text-2xs font-bold text-slate-600 uppercase tracking-widest py-1">
                      <span className="h-px bg-slate-800 flex-1"></span>
                      <span>o</span>
                      <span className="h-px bg-slate-800 flex-1"></span>
                    </div>

                    {/* Manual ID Input Form */}
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
                      <p className="text-[10px] text-slate-550 italic leading-snug">
                        Tip de prueba: Digite <code className="text-rose-400 font-mono">8849</code> para vincular directamente a Sofía Peralta.
                      </p>
                    </form>
                  </div>

                  {/* Right Column: Bidirectional panel (2/3 width) */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {linkedPatient ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Bloque A: Demographic data and patient history (for the doctor) */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 animate-in fade-in duration-300">
                          <div>
                            <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Bloque A</span>
                            <h3 className="font-bold text-white text-base mt-1.5">Expediente Clínico</h3>
                            <p className="text-xs text-slate-400">Datos médicos visibles en su pantalla de control.</p>
                          </div>

                          {/* Demographic summary */}
                          <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl space-y-2.5 text-xs">
                            <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                              <span className="font-semibold text-white text-sm">{linkedPatient.name}</span>
                              <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded">
                                {linkedPatient.gender}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-2 text-2xs text-slate-400">
                              <div>
                                <span className="text-slate-550 uppercase font-bold block">Edad</span>
                                <span className="text-slate-200">{linkedPatient.age} años</span>
                              </div>
                              <div>
                                <span className="text-slate-550 uppercase font-bold block">Grupo Sanguíneo</span>
                                <span className="text-slate-200">{linkedPatient.bloodType}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-550 uppercase font-bold block">Teléfono Móvil</span>
                                <span className="text-slate-200">{linkedPatient.phone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Medical History */}
                          <div className="space-y-2.5 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-rose-450 uppercase block">Diagnóstico de Control</span>
                              <p className="text-slate-300 font-semibold">{linkedPatient.condition}</p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-rose-450 uppercase block">Alergias Críticas</span>
                              <p className="text-rose-400 font-bold flex items-center gap-1.5">
                                <ShieldAlert className="h-3.5 w-3.5 text-rose-450" />
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

                        {/* Bloque B: Visual Mirror confirmation of patient feed */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-5 flex flex-col justify-between animate-in fade-in duration-300">
                          <div className="space-y-4">
                            <div>
                              <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Bloque B</span>
                              <h3 className="font-bold text-white text-base mt-1.5">Espejo de Datos</h3>
                              <p className="text-xs text-slate-400">Confirmación del envío de información en espejo.</p>
                            </div>

                            {/* Mirror status telemetry panel */}
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

                              {/* Progress bar of mirroring transmission */}
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

                          {/* Mirror completion text alert */}
                          {mirrorProgress === 100 ? (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-450 text-2xs flex items-start gap-2 animate-in zoom-in-95 duration-200">
                              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-450" />
                              <p className="leading-snug">
                                **Confirmado**: Los datos del médico e informe se transmitieron en espejo a la pantalla del paciente con éxito.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-500 text-2xs flex items-start gap-2">
                              <RefreshCw className="h-4 w-4 shrink-0 mt-0.5 animate-spin" />
                              <p className="leading-snug">
                                Enviando paquete de telemetría de consulta al dispositivo del paciente...
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      // Empty state when no patient is linked yet
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

          </div>
        </main>
      </div>

    </div>
  );
}
