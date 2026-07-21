'use client';

/**
 * @fileoverview Componente doctors manager view.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Pencil,
  Search,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { PageHeader, Button, Modal, ModalBody, ListCard } from './ui';
import { DOCTOR_SPECIALTY_OPTIONS } from '../data/mockData';
import apiClient from '../lib/api';

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

interface DoctorProfile {
  id_usuario: number;
  nombre: string;
  correo: string;
  status: 'activo' | 'suspendido';
  legacy_doctor_id?: string | null;
  mpps?: string | null;
  especialidad?: string | null;
  colegio_medicos?: string | null;
  special_sanitary_registration?: string | null;
  digital_signature_hash?: string | null;
  office_location?: string | null;
}

interface DoctorFormState {
  nombre: string;
  correo: string;
  password: string;
  mpps: string;
  especialidad: string;
  colegio_medicos: string;
  special_sanitary_registration: string;
  digital_signature_hash: string;
  office_location: string;
  status: 'activo' | 'suspendido';
}

const EMPTY_FORM: DoctorFormState = {
  nombre: '',
  correo: '',
  password: '',
  mpps: '',
  especialidad: '',
  colegio_medicos: '',
  special_sanitary_registration: '',
  digital_signature_hash: '',
  office_location: '',
  status: 'activo',
};

const toDoctorForm = (doctor: DoctorProfile): DoctorFormState => ({
  nombre: doctor.nombre,
  correo: doctor.correo,
  password: '',
  mpps: doctor.mpps || '',
  especialidad: doctor.especialidad || '',
  colegio_medicos: doctor.colegio_medicos || '',
  special_sanitary_registration: doctor.special_sanitary_registration || '',
  digital_signature_hash: doctor.digital_signature_hash || '',
  office_location: doctor.office_location || '',
  status: doctor.status,
});

export default function DoctorsManagerView() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [form, setForm] = useState<DoctorFormState>(EMPTY_FORM);
  const [editingDoctorId, setEditingDoctorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await apiClient.get('/admin/doctors');
      setDoctors(Array.isArray(response.data?.items) ? response.data.items : []);
    } catch (error: unknown) {
      setErrorMsg(
        (error as ApiErrorPayload).response?.data?.error ||
          (error as ApiErrorPayload).response?.data?.details ||
          'No se pudo cargar el directorio de médicos.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const response = await apiClient.get('/admin/doctors');
        if (!cancelled) {
          setDoctors(Array.isArray(response.data?.items) ? response.data.items : []);
        }
      } catch {
        if (!cancelled) {
          setDoctors([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDoctors = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return doctors;

    return doctors.filter((doctor) =>
      [doctor.nombre, doctor.correo, doctor.mpps || '', doctor.colegio_medicos || '', doctor.especialidad || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [doctors, searchQuery]);

  const handleChange = <K extends keyof DoctorFormState>(field: K, value: DoctorFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingDoctorId(null);
  };

  const handleEdit = (doctor: DoctorProfile) => {
    setForm(toDoctorForm(doctor));
    setEditingDoctorId(doctor.id_usuario);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuspend = async (doctorId: number) => {
    try {
      setSaving(true);
      setErrorMsg('');
      await apiClient.delete(`/admin/doctors/${doctorId}`);
      await loadDoctors();
      setSuccessMsg(`Médico ${doctorId} suspendido correctamente.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: unknown) {
      setErrorMsg(
        (error as ApiErrorPayload).response?.data?.error ||
          (error as ApiErrorPayload).response?.data?.details ||
          'No se pudo suspender el médico.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErrorMsg('');

      const payload = {
        nombre: form.nombre,
        correo: form.correo,
        ...(editingDoctorId ? {} : { password: form.password }),
        mpps: form.mpps,
        especialidad: form.especialidad,
        colegio_medicos: form.colegio_medicos,
        special_sanitary_registration: form.special_sanitary_registration || undefined,
        digital_signature_hash: form.digital_signature_hash || undefined,
        office_location: form.office_location || undefined,
        status: form.status,
      };

      if (editingDoctorId) {
        await apiClient.put(`/admin/doctors/${editingDoctorId}`, payload);
        setSuccessMsg(`Perfil médico ${editingDoctorId} actualizado correctamente.`);
      } else {
        await apiClient.post('/admin/doctors', payload);
        setSuccessMsg('Médico registrado correctamente.');
      }

      resetForm();
      await loadDoctors();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: unknown) {
      setErrorMsg(
        (error as ApiErrorPayload).response?.data?.error ||
          (error as ApiErrorPayload).response?.data?.details ||
          'No se pudo guardar el perfil médico.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button variant="outline" onClick={() => setIsDirectoryOpen(true)}>
            <Stethoscope className="h-4 w-4" />
            Directorio Médico
            <span className="ml-1 text-surface-500">({doctors.length})</span>
          </Button>
        }
      />

      {errorMsg ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center gap-2.5 text-amber-300 text-xs">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {successMsg ? (
        <div className="p-4 bg-secondary-500/10 border border-secondary-500/25 rounded-2xl flex items-center gap-2.5 text-secondary-450 text-xs">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="admin-surface-card w-full border rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-surface-850 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4.5 w-4.5 text-surface-400" />
            <h3 className="zenith-section-title">{editingDoctorId ? 'Editar médico' : 'Registrar médico'}</h3>
          </div>
          {editingDoctorId ? (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Cancelar edición
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="zenith-field-label">Nombre completo *</label>
            <input value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-surface-400 ${editingDoctorId ? 'bg-surface-950/40 text-surface-250 border-surface-850' : 'bg-surface-950 text-white border-surface-850'}`} required readOnly={!!editingDoctorId} />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Correo electrónico *</label>
            <input type="email" value={form.correo} onChange={(e) => handleChange('correo', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400" required />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Contraseña {editingDoctorId ? '(opcional)' : '*'}</label>
            <input type="text" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400" required={!editingDoctorId} />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Registro MPPS *</label>
            <input value={form.mpps} onChange={(e) => handleChange('mpps', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-surface-400" required />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Colegio de Médicos *</label>
            <input value={form.colegio_medicos} onChange={(e) => handleChange('colegio_medicos', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-surface-400" required />
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Especialidad *</label>
            <select value={form.especialidad} onChange={(e) => handleChange('especialidad', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400" required>
              <option value="" disabled>Seleccionar</option>
              {DOCTOR_SPECIALTY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="zenith-field-label">Registro sanitario especial</label>
            <input value={form.special_sanitary_registration} onChange={(e) => handleChange('special_sanitary_registration', e.target.value)} placeholder="RSE-50001" className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-surface-400" />
          </div>

          <div className={`space-y-1 ${!editingDoctorId ? 'lg:col-span-2' : ''}`}>
            <label className="zenith-field-label">Consultorio</label>
            <input value={form.office_location} onChange={(e) => handleChange('office_location', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400" />
          </div>
          {editingDoctorId && (
            <div className="space-y-1">
              <label className="zenith-field-label">Estado</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value as DoctorFormState['status'])} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400">
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-surface-850">
          <Button type="submit" disabled={saving}>
            {editingDoctorId ? 'Guardar cambios' : 'Registrar médico'}
          </Button>
        </div>
      </form>

      <Modal open={isDirectoryOpen} onClose={() => setIsDirectoryOpen(false)} size="xl" className="max-w-6xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
          <div>
            <h3 className="zenith-section-title">Directorio de Profesionales</h3>
            <p className="text-xs text-surface-400 mt-0.5">Listado conectado al backend administrativo.</p>
          </div>
          <button type="button" onClick={() => setIsDirectoryOpen(false)} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer" aria-label="Cerrar">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-2 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white placeholder-surface-700 focus:outline-none focus:border-surface-400"
            />
          </div>

          {loading ? (
            <div className="rounded-xl border border-surface-800 bg-surface-950/60 px-3 py-4 text-xs text-surface-400">
              Consultando directorio de médicos...
            </div>
          ) : null}

          <div className="zenith-table-wrap hidden lg:block">
            <table className="zenith-table text-xs">
              <thead>
                <tr className="border-b border-surface-850 text-surface-500 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">Médico</th>
                  <th>Especialidad</th>
                  <th>MPPS / Colegio</th>
                  <th>Estado</th>
                  <th>Control Especial</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/60 text-surface-300">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id_usuario} className="hover:bg-surface-950/10">
                    <td className="py-3">
                      <p className="font-semibold text-white">{doctor.nombre}</p>
                      <p className="text-[10px] text-surface-500 font-mono">{doctor.correo}</p>
                    </td>
                    <td>{doctor.especialidad || 'Sin especialidad'}</td>
                    <td>
                      <p className="font-mono text-surface-300">{doctor.mpps || 'Sin MPPS'}</p>
                      <p className="text-[10px] font-mono text-surface-500">{doctor.colegio_medicos || 'Sin colegio'}</p>
                    </td>
                    <td>
                      <span className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold ${doctor.status === 'activo' ? 'bg-secondary-500/10 text-secondary-400' : 'bg-amber-500/10 text-amber-300'}`}>
                        {doctor.status}
                      </span>
                    </td>
                    <td className="text-[10px] font-mono text-surface-400">{doctor.special_sanitary_registration || 'No aplica'}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <button type="button" onClick={() => handleEdit(doctor)} className="p-1.5 rounded-lg border border-surface-800 hover:border-surface-700 hover:bg-surface-900 text-surface-300">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleSuspend(doctor.id_usuario)} className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 text-red-400" disabled={saving || doctor.status === 'suspendido'}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {filteredDoctors.map((doctor) => (
              <ListCard
                key={doctor.id_usuario}
                title={doctor.nombre}
                subtitle={doctor.correo}
                badge={<span className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold ${doctor.status === 'activo' ? 'bg-secondary-500/10 text-secondary-400' : 'bg-amber-500/10 text-amber-300'}`}>{doctor.status}</span>}
                fields={[
                  { label: 'Especialidad', value: doctor.especialidad || 'Sin especialidad' },
                  { label: 'MPPS', value: doctor.mpps || 'Sin MPPS' },
                  { label: 'Colegio', value: doctor.colegio_medicos || 'Sin colegio' },
                  { label: 'RSE', value: doctor.special_sanitary_registration || 'No aplica' },
                ]}
                actions={
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEdit(doctor)} className="px-2.5 py-1 text-xs font-semibold text-surface-300 bg-surface-800 rounded-md border border-surface-700">Editar</button>
                    <button type="button" onClick={() => handleSuspend(doctor.id_usuario)} className="px-2.5 py-1 text-xs font-semibold text-red-400 bg-red-500/10 rounded-md border border-red-500/20" disabled={saving || doctor.status === 'suspendido'}>Suspender</button>
                  </div>
                }
              />
            ))}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
