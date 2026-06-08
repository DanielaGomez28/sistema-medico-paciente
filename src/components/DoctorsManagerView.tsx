'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Stethoscope,
  Mail,
  Upload,
  Trash2,
  CheckCircle,
  Lock,
  Search,
  X,
} from 'lucide-react';
import { PageHeader, Button, Modal, ModalBody, ListCard } from './ui';

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
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [specialty, setSpecialty] = useState('Cardiología');
  const [licenseMpps, setLicenseMpps] = useState('');

  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);

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
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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
      registeredAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newDoc, ...doctors];
    setDoctors(updated);
    localStorage.setItem('zenith_doctors_directory', JSON.stringify(updated));

    const generatedPass = `ZOMS-${licenseMpps.replace(/\D/g, '') || '9988'}`;
    setGeneratedCreds({
      user: email,
      pass: generatedPass,
      name: `Dr. ${firstName} ${lastName}`,
    });

    setSuccessMsg(`Médico registrado con éxito bajo ID ${newId}.`);

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
        actions={
          <Button variant="outline" onClick={() => setIsDirectoryOpen(true)}>
            <Stethoscope className="h-4 w-4" />
            Directorio de Profesionales
            <span className="ml-1 text-surface-500">({doctors.length})</span>
          </Button>
        }
      />

      {successMsg && (
        <div className="p-4 bg-secondary-500/10 border border-secondary-500/25 rounded-2xl flex items-center gap-2.5 text-secondary-450 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {generatedCreds && (
        <div className="bg-surface-900 border border-surface-800 rounded-3xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 border-b border-surface-850 pb-2">
            <Lock className="h-4.5 w-4.5 text-surface-400" />
            <div>
              <h4 className="zenith-section-title text-xs">Credenciales Provisionales Generadas</h4>
              <p className="text-[10px] text-surface-500">Envíe estos datos de acceso seguro al profesional.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-950 border border-surface-850 rounded-xl p-3 text-left">
              <p className="zenith-field-label">Nombre Profesional</p>
              <p className="text-xs font-semibold text-white">{generatedCreds.name}</p>
            </div>
            <div className="bg-surface-950 border border-surface-850 rounded-xl p-3 text-left">
              <p className="zenith-field-label">Usuario / E-mail</p>
              <p className="text-xs font-mono font-semibold text-surface-200">{generatedCreds.user}</p>
            </div>
            <div className="bg-surface-950 border border-surface-850 rounded-xl p-3 text-left lg:col-span-2 flex justify-between items-center">
              <div>
                    <p className="zenith-field-label">Contraseña Temporal</p>
                <p className="text-xs font-mono font-semibold text-white">{generatedCreds.pass}</p>
              </div>
              <span className="text-[9px] bg-surface-800 text-surface-300 border border-surface-700 px-2 py-0.5 rounded font-semibold">
                Listo para Enviar
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => setGeneratedCreds(null)}>
              Entendido / Limpiar
            </Button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full bg-surface-900 border border-surface-800 rounded-3xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
          <UserPlus className="h-4.5 w-4.5 text-surface-400" />
          <h3 className="zenith-section-title">Dar de Alta Médico</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="zenith-field-label">Nombres *</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Ej. Alejandro"
              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400"
            />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Apellidos *</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Ej. Ríos"
              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400"
            />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Correo Institucional *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-650" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@zenith.com"
                className="w-full pl-9 pr-3 py-2 bg-surface-950 border border-surface-850 rounded-xl text-xs text-white focus:outline-none focus:border-surface-400 font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Cédula de Identidad *</label>
            <input
              type="text"
              required
              value={dni}
              onChange={e => setDni(e.target.value)}
              placeholder="V-12.345.678"
              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Colegiatura / MPPS *</label>
            <input
              type="text"
              required
              value={licenseMpps}
              onChange={e => setLicenseMpps(e.target.value)}
              placeholder="MPPS-28490"
              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Especialidad Clínica</label>
            <select
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400"
            >
              <option value="Cardiología">Cardiología</option>
              <option value="Medicina General">Medicina General</option>
              <option value="Pediatría">Pediatría</option>
              <option value="Endocrinología">Endocrinología</option>
              <option value="Dermatología">Dermatología</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="zenith-field-label flex justify-between">
            <span>Soportes Probatorios (Títulos/Diplomas)</span>
            <span className="text-surface-500 font-normal">Obligatorio para verificación</span>
          </label>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-surface-400 bg-surface-800' : 'border-surface-850 bg-surface-950 hover:border-surface-700'
            }`}
          >
            <input type="file" id="doc-cert-upload" onChange={handleFileInput} className="hidden" />
            <label htmlFor="doc-cert-upload" className="cursor-pointer space-y-1">
              <Upload className="h-5 w-5 text-surface-500 mx-auto" />
              <p className="text-[10px] text-surface-400 font-semibold">Examine o arrastre su archivo probatorio (PDF, PNG)</p>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {attachments.map((file, i) => (
                <div key={i} className="flex justify-between items-center bg-surface-950 border border-surface-850 px-3 py-1.5 rounded-lg text-[10px]">
                  <span className="font-mono text-surface-300 truncate max-w-[200px]">{file.name} ({file.size})</span>
                  <button type="button" onClick={() => removeAttachment(i)} className="text-surface-500 hover:text-surface-200">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-surface-850">
          <Button type="submit" className="w-full sm:w-auto">
            Dar de Alta y Generar Credenciales
          </Button>
        </div>
      </form>

      <Modal open={isDirectoryOpen} onClose={() => setIsDirectoryOpen(false)} size="xl" className="max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
          <div>
            <h3 className="zenith-section-title">Directorio de Profesionales</h3>
            <p className="text-xs text-surface-400 mt-0.5">Lista completa de médicos y estado de vigencia.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsDirectoryOpen(false)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ModalBody className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-500" />
            <input
              type="text"
              placeholder="Buscar médico..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-2 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white placeholder-surface-700 focus:outline-none focus:border-surface-400"
            />
          </div>

          {filteredDoctors.length === 0 ? (
            <p className="py-8 text-center text-surface-500 text-sm">
              No se encontraron médicos con ese criterio.
            </p>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
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
                          <p className="font-semibold text-white">Dr. {doc.firstName} {doc.lastName}</p>
                          <p className="text-[10px] text-surface-500 font-mono">{doc.email}</p>
                        </td>
                        <td>{doc.specialty}</td>
                        <td>
                          <p className="font-mono text-surface-300">{doc.dni}</p>
                          <p className="text-[10px] font-mono text-surface-500">{doc.licenseMpps}</p>
                        </td>
                        <td className="whitespace-nowrap">
                          <span
                            className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold ${
                              doc.status === 'Verificado'
                                ? 'bg-surface-800 text-surface-200 border border-surface-700'
                                : doc.status === 'Pendiente'
                                ? 'bg-surface-800 text-white border border-surface-600'
                                : 'bg-surface-800 text-surface-500 border border-surface-700'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="text-right text-surface-500 font-mono">{doc.registeredAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden space-y-3">
                {filteredDoctors.map((doc) => (
                  <ListCard
                    key={doc.id}
                    title={`Dr. ${doc.firstName} ${doc.lastName}`}
                    subtitle={doc.email}
                    badge={
                      <span
                        className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold ${
                          doc.status === 'Verificado'
                            ? 'bg-surface-800 text-surface-200 border border-surface-700'
                            : doc.status === 'Pendiente'
                            ? 'bg-surface-800 text-white border border-surface-600'
                            : 'bg-surface-800 text-surface-500 border border-surface-700'
                        }`}
                      >
                        {doc.status}
                      </span>
                    }
                    fields={[
                      { label: 'Especialidad', value: doc.specialty },
                      { label: 'Cédula', value: doc.dni },
                      { label: 'MPPS', value: doc.licenseMpps },
                      { label: 'Registro', value: doc.registeredAt },
                    ]}
                  />
                ))}
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
