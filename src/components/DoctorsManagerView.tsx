'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Stethoscope, 
  Mail, 
  Shield, 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle, 
  Lock, 
  Eye, 
  Search,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';
import { PageHeader, Button } from './ui';

interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  specialty: string;
  licenseMpps: string;
  status: 'Verificado' | 'Pendiente' | 'Inactivo';
  registeredAt: string;
}

const INITIAL_DOCTORS: DoctorProfile[] = [
  { id: 'MED-101', firstName: 'Alejandro', lastName: 'Ríos', email: 'ale.rios@zenith.com', dni: 'V-14.890.344', specialty: 'Cardiología', licenseMpps: 'MPPS-28490', status: 'Verificado', registeredAt: '2026-05-10' },
  { id: 'MED-102', firstName: 'Elena', lastName: 'Vargas', email: 'elena.vargas@zenith.com', dni: 'V-16.782.903', specialty: 'Medicina General', licenseMpps: 'MPPS-49321', status: 'Verificado', registeredAt: '2026-05-18' },
  { id: 'MED-103', firstName: 'Juan', lastName: 'Pérez', email: 'juan.perez@zenith.com', dni: 'V-12.334.892', specialty: 'Pediatría', licenseMpps: 'MPPS-10293', status: 'Verificado', registeredAt: '2026-06-01' },
];

export default function DoctorsManagerView() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>(INITIAL_DOCTORS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [specialty, setSpecialty] = useState('Cardiología');
  const [licenseMpps, setLicenseMpps] = useState('');
  
  // Attachments state
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  // Generated credentials popup state
  const [generatedCreds, setGeneratedCreds] = useState<{ user: string; pass: string; name: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const localDocs = localStorage.getItem('zenith_doctors_directory');
    if (localDocs) {
      setDoctors(JSON.parse(localDocs));
    } else {
      localStorage.setItem('zenith_doctors_directory', JSON.stringify(INITIAL_DOCTORS));
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setAttachments(prev => [...prev, { name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' }]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachments(prev => [...prev, { name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' }]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !dni || !licenseMpps) {
      alert('Por favor complete todos los campos obligatorios y adjunte soportes.');
      return;
    }

    const nextIdNum = doctors.reduce((max, d) => {
      const match = d.id.match(/MED-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 100);
    const newId = `MED-${nextIdNum + 1}`;

    const newDoc: DoctorProfile = {
      id: newId,
      firstName,
      lastName,
      email,
      dni,
      specialty,
      licenseMpps,
      status: attachments.length > 0 ? 'Verificado' : 'Pendiente',
      registeredAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newDoc, ...doctors];
    setDoctors(updated);
    localStorage.setItem('zenith_doctors_directory', JSON.stringify(updated));

    // Auto generate random password for system access
    const generatedPass = `ZOMS-${licenseMpps.replace(/\D/g, '') || '9988'}`;
    setGeneratedCreds({
      user: email,
      pass: generatedPass,
      name: `Dr. ${firstName} ${lastName}`
    });

    setSuccessMsg(`Médico registrado con éxito bajo ID ${newId}.`);

    // Reset Form
    setFirstName('');
    setLastName('');
    setEmail('');
    setDni('');
    setLicenseMpps('');
    setAttachments([]);
  };

  const filteredDoctors = doctors.filter(doc => 
    `${doc.firstName} ${doc.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.licenseMpps.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Registro y Gestión de Médicos"
        description="Administre los expedientes profesionales y autorice el alta médica en el sistema."
      />

      {successMsg && (
        <div className="p-4 bg-secondary-500/10 border border-secondary-500/25 rounded-2xl flex items-center gap-2.5 text-secondary-450 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Directory Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Doctor Registration Form (5 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
            <UserPlus className="h-4.5 w-4.5 text-secondary-455" />
            <h3 className="font-bold text-white text-base">Dar de Alta Médico</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-2xs font-bold text-surface-450 uppercase">Nombres *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Ej. Alejandro"
                className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-2xs font-bold text-surface-450 uppercase">Apellidos *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Ej. Ríos"
                className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-2xs font-bold text-surface-450 uppercase">Correo Institucional *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-650" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@zenith.com"
                className="w-full pl-9 pr-3 py-2 bg-surface-950 border border-surface-850 rounded-xl text-xs text-white focus:outline-none focus:border-secondary-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-2xs font-bold text-surface-450 uppercase">Cédula de Identidad *</label>
              <input
                type="text"
                required
                value={dni}
                onChange={e => setDni(e.target.value)}
                placeholder="V-12.345.678"
                className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-2xs font-bold text-surface-450 uppercase">Colegiatura / MPPS *</label>
              <input
                type="text"
                required
                value={licenseMpps}
                onChange={e => setLicenseMpps(e.target.value)}
                placeholder="MPPS-28490"
                className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-2xs font-bold text-surface-450 uppercase">Especialidad Clínica</label>
            <select
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary-500"
            >
              <option value="Cardiología">Cardiología</option>
              <option value="Medicina General">Medicina General</option>
              <option value="Pediatría">Pediatría</option>
              <option value="Endocrinología">Endocrinología</option>
              <option value="Dermatología">Dermatología</option>
            </select>
          </div>

          {/* Soportes probatorios drag and drop */}
          <div className="space-y-2">
            <label className="text-2xs font-bold text-surface-455 uppercase flex justify-between">
              <span>Soportes Probatorios (Títulos/Diplomas)</span>
              <span className="text-surface-500 font-normal">Obligatorio para verificación</span>
            </label>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                dragActive ? 'border-primary-500 bg-primary-500/5' : 'border-surface-850 bg-surface-950/20 hover:border-surface-800'
              }`}
            >
              <input 
                type="file" 
                id="doc-cert-upload" 
                onChange={handleFileInput}
                className="hidden" 
              />
              <label htmlFor="doc-cert-upload" className="cursor-pointer space-y-1">
                <Upload className="h-5 w-5 text-surface-500 mx-auto" />
                <p className="text-[10px] text-surface-400 font-semibold">Examine o arrastre su archivo probatorio (PDF, PNG)</p>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {attachments.map((file, i) => (
                  <div key={i} className="flex justify-between items-center bg-surface-950/60 border border-surface-850 px-3 py-1.5 rounded-lg text-[10px]">
                    <span className="font-mono text-surface-300 truncate max-w-[200px]">{file.name} ({file.size})</span>
                    <button type="button" onClick={() => removeAttachment(i)} className="text-surface-500 hover:text-secondary-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-secondary to-secondary-650 hover:from-secondary-600 hover:to-secondary-750 text-white rounded-xl text-xs font-black shadow-md shadow-secondary-650/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Dar de Alta y Generar Credenciales</span>
          </button>
        </form>

        {/* Directory & Verification Monitor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Credentials modal inline block */}
          {generatedCreds && (
            <div className="bg-surface-900 border border-primary-500/30 rounded-3xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 border-b border-surface-850 pb-2">
                <Lock className="h-4.5 w-4.5 text-primary-400" />
                <div>
                  <h4 className="font-bold text-white text-xs">Credenciales Provisionales Generadas</h4>
                  <p className="text-[10px] text-surface-500">Envíe estos datos de acceso seguro al profesional.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-950/80 border border-surface-850 rounded-xl p-3 text-left">
                  <p className="text-[9px] font-bold text-surface-550 uppercase">Nombre Profesional</p>
                  <p className="text-xs font-extrabold text-white">{generatedCreds.name}</p>
                </div>
                <div className="bg-surface-950/80 border border-surface-850 rounded-xl p-3 text-left">
                  <p className="text-[9px] font-bold text-surface-550 uppercase">Usuario / E-mail</p>
                  <p className="text-xs font-mono font-bold text-primary-300">{generatedCreds.user}</p>
                </div>
                <div className="bg-surface-950/80 border border-surface-850 rounded-xl p-3 md:col-span-2 text-left flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-bold text-surface-550 uppercase">Contraseña Temporal</p>
                    <p className="text-xs font-mono font-black text-secondary-400">{generatedCreds.pass}</p>
                  </div>
                  <span className="text-[9px] bg-secondary-500/10 text-secondary-400 px-2 py-0.5 rounded font-extrabold">Listo para Enviar</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setGeneratedCreds(null)}
                  className="px-3.5 py-1.5 bg-surface-950 hover:bg-surface-850 border border-surface-800 text-surface-350 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  Entendido / Limpiar
                </button>
              </div>
            </div>
          )}

          {/* Directory view list */}
          <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-850 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Directorio de Profesionales</h3>
                <p className="text-xs text-surface-400">Lista completa de médicos y estado de vigencia.</p>
              </div>

              <div className="relative max-w-[200px] w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-500" />
                <input
                  type="text"
                  placeholder="Buscar médico..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white placeholder-surface-700 focus:outline-none focus:border-secondary-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-850 text-surface-500 font-bold uppercase tracking-wider">
                    <th className="pb-2.5">Médico</th>
                    <th>Especialidad</th>
                    <th>Cédula / MPPS</th>
                    <th>Estado</th>
                    <th className="text-right">Fecha Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-850/60 text-surface-300">
                  {filteredDoctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-surface-950/10">
                      <td className="py-3">
                        <p className="font-bold text-white">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-[10px] text-surface-500 font-mono">{doc.email}</p>
                      </td>
                      <td>{doc.specialty}</td>
                      <td>
                        <p className="font-mono text-surface-300">{doc.dni}</p>
                        <p className="text-[10px] font-mono text-surface-500">{doc.licenseMpps}</p>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === 'Verificado' 
                            ? 'bg-secondary-500/10 text-secondary-450' 
                            : doc.status === 'Pendiente' 
                            ? 'bg-primary-500/10 text-primary-450 border border-primary-500/10 animate-pulse'
                            : 'bg-surface-800 text-surface-500'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="text-right text-surface-500 font-mono">{doc.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
