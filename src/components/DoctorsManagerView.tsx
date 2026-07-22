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
import { getDoctorStatusBadgeClassName } from '../lib/statusColors';

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

interface DoctorProfile {
  id: number;
  name: string;
  email: string;
  status: 'activo' | 'suspendido';
  legacyDoctorId?: string | null;
  mpps?: string | null;
  specialty?: string | null;
  medicalBoard?: string | null;
  specialSanitaryRegistration?: string | null;
  officeLocation?: string | null;
}

interface DoctorFormState {
  name: string;
  email: string;
  password: string;
  mpps: string;
  specialty: string;
  medicalBoard: string;
  specialSanitaryRegistration: string;
  officeLocation: string;
  status: 'activo' | 'suspendido';
}

const EMPTY_FORM: DoctorFormState = {
  name: '',
  email: '',
  password: '',
  mpps: '',
  specialty: '',
  medicalBoard: '',
  specialSanitaryRegistration: '',
  officeLocation: '',
  status: 'activo',
};

const toDoctorForm = (doctor: DoctorProfile): DoctorFormState => ({
  name: doctor.name,
  email: doctor.email,
  password: '',
  mpps: doctor.mpps || '',
  specialty: doctor.specialty || '',
  medicalBoard: doctor.medicalBoard || '',
  specialSanitaryRegistration: doctor.specialSanitaryRegistration || '',
  officeLocation: doctor.officeLocation || '',
  status: doctor.status,
});

/**
 * Vista de administración de médicos: lista, crea, edita y gestiona el
 * estado de las cuentas médicas registradas en la plataforma.
 *
 * @returns {JSX.Element} Panel de gestión de médicos.
 */
export default function DoctorsManagerView() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
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
      [doctor.name, doctor.email, doctor.mpps || '', doctor.medicalBoard || '', doctor.specialty || '']
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

  const openCreateForm = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    resetForm();
    setIsFormModalOpen(false);
  };

  const handleEdit = (doctor: DoctorProfile) => {
    setForm(toDoctorForm(doctor));
    setEditingDoctorId(doctor.id);
    setIsFormModalOpen(true);
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
        name: form.name,
        email: form.email,
        ...(editingDoctorId ? {} : { password: form.password }),
        mpps: form.mpps,
        specialty: form.specialty,
        medicalBoard: form.medicalBoard,
        specialSanitaryRegistration: form.specialSanitaryRegistration || undefined,
        officeLocation: form.officeLocation || undefined,
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
      setIsFormModalOpen(false);
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
        className="portal-page-header"
        title="Directorio Médico"
        description="Visualice todos los médicos registrados y administre nuevos perfiles desde aquí."
        actions={
          <Button onClick={openCreateForm}>
            <UserPlus className="h-4 w-4" />
            Registrar médico
          </Button>
        }
      />

      {errorMsg ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-center gap-2.5 text-amber-300 text-xs">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {successMsg ? (
        <div className="p-4 bg-secondary-500/10 border border-secondary-500/25 rounded-lg flex items-center gap-2.5 text-secondary-450 text-xs">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      ) : null}

      <div className="admin-surface-card w-full border rounded-xl p-6 space-y-4">
        <div className="flex flex-col gap-3 border-b border-surface-850 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4.5 w-4.5 text-surface-400" />
              <h3 className="zenith-section-title">Profesionales registrados</h3>
            </div>
            <p className="text-xs text-surface-400 mt-0.5">
              {doctors.length} médico{doctors.length === 1 ? '' : 's'} en el directorio.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-500" />
            <input
              type="text"
              placeholder="Buscar médico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-2 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white placeholder-surface-700 focus:outline-none focus:border-surface-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-surface-800 bg-surface-950/60 px-3 py-4 text-xs text-surface-400">
            Consultando directorio de médicos...
          </div>
        ) : null}

        {!loading && filteredDoctors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-surface-800 bg-surface-950/40 px-4 py-8 text-center space-y-3">
            <Stethoscope className="h-8 w-8 text-surface-600 mx-auto" />
            <p className="text-sm text-surface-400">
              {searchQuery.trim()
                ? 'No hay médicos que coincidan con la búsqueda.'
                : 'Todavía no hay médicos registrados en la plataforma.'}
            </p>
            {!searchQuery.trim() ? (
              <Button onClick={openCreateForm}>
                <UserPlus className="h-4 w-4" />
                Registrar médico
              </Button>
            ) : null}
          </div>
        ) : null}

        {!loading && filteredDoctors.length > 0 ? (
          <>
            <div className="zenith-table-wrap admin-doctors-table hidden lg:block">
              <table className="zenith-table zenith-table--divided text-xs">
                <colgroup>
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead>
                  <tr className="admin-doctors-table__head-row border-b border-surface-850">
                    <th className="admin-doctors-table__head zenith-table__wrap">Médico</th>
                    <th className="admin-doctors-table__head">Especialidad</th>
                    <th className="admin-doctors-table__head zenith-table__wrap">MPPS / Colegio</th>
                    <th className="admin-doctors-table__head">Estado</th>
                    <th className="admin-doctors-table__head zenith-table__wrap">Control Especial</th>
                    <th className="admin-doctors-table__head text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-surface-300">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-surface-950/10">
                      <td className="py-3 zenith-table__wrap align-top">
                        <p className="font-semibold text-white">{doctor.name}</p>
                        <p className="text-[10px] text-surface-500 font-mono">{doctor.email}</p>
                      </td>
                      <td className="py-3 align-top">{doctor.specialty || 'Sin especialidad'}</td>
                      <td className="py-3 zenith-table__wrap align-top">
                        <p className="font-mono text-surface-300">{doctor.mpps || 'Sin MPPS'}</p>
                        <p className="text-[10px] font-mono text-surface-500">{doctor.medicalBoard || 'Sin colegio'}</p>
                      </td>
                      <td className="py-3 align-top">
                        <span className={getDoctorStatusBadgeClassName(doctor.status)}>
                          {doctor.status}
                        </span>
                      </td>
                      <td className="py-3 text-[10px] font-mono text-surface-400 zenith-table__wrap align-top">{doctor.specialSanitaryRegistration || 'No aplica'}</td>
                      <td className="py-3 text-right align-top">
                        <div className="inline-flex items-center gap-2">
                          <button type="button" onClick={() => handleEdit(doctor)} className="p-1.5 rounded-lg border border-surface-800 hover:border-surface-700 hover:bg-surface-900 text-surface-300">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => handleSuspend(doctor.id)} className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 text-red-400" disabled={saving || doctor.status === 'suspendido'}>
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
                  key={doctor.id}
                  title={doctor.name}
                  subtitle={doctor.email}
                  badge={<span className={getDoctorStatusBadgeClassName(doctor.status)}>{doctor.status}</span>}
                  fields={[
                    { label: 'Especialidad', value: doctor.specialty || 'Sin especialidad' },
                    { label: 'MPPS', value: doctor.mpps || 'Sin MPPS' },
                    { label: 'Colegio', value: doctor.medicalBoard || 'Sin colegio' },
                    { label: 'RSE', value: doctor.specialSanitaryRegistration || 'No aplica' },
                  ]}
                  actions={
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEdit(doctor)} className="px-2.5 py-1 text-xs font-semibold text-surface-300 bg-surface-800 rounded-md border border-surface-700">Editar</button>
                      <button type="button" onClick={() => handleSuspend(doctor.id)} className="px-2.5 py-1 text-xs font-semibold text-red-400 bg-red-500/10 rounded-md border border-red-500/20" disabled={saving || doctor.status === 'suspendido'}>Suspender</button>
                    </div>
                  }
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <Modal open={isFormModalOpen} onClose={closeFormModal} size="xl" className="max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
          <div>
            <h3 className="zenith-section-title">{editingDoctorId ? 'Editar médico' : 'Registrar médico'}</h3>
            <p className="text-xs text-surface-400 mt-0.5">
              {editingDoctorId ? 'Actualice los datos del perfil médico seleccionado.' : 'Complete el formulario para dar de alta un nuevo médico.'}
            </p>
          </div>
          <button type="button" onClick={closeFormModal} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="zenith-field-label">Nombre completo *</label>
                <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-surface-400 ${editingDoctorId ? 'bg-surface-950/40 text-surface-250 border-surface-850' : 'bg-surface-950 text-white border-surface-850'}`} required readOnly={!!editingDoctorId} />
              </div>
              <div className="space-y-1">
                <label className="zenith-field-label">Correo electrónico *</label>
                <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400" required />
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
                <input value={form.medicalBoard} onChange={(e) => handleChange('medicalBoard', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-surface-400" required />
              </div>
              <div className="space-y-1">
                <label className="zenith-field-label">Especialidad *</label>
                <select value={form.specialty} onChange={(e) => handleChange('specialty', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400" required>
                  <option value="" disabled>Seleccionar</option>
                  {DOCTOR_SPECIALTY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="zenith-field-label">Registro sanitario especial</label>
                <input value={form.specialSanitaryRegistration} onChange={(e) => handleChange('specialSanitaryRegistration', e.target.value)} placeholder="RSE-50001" className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-surface-400" />
              </div>

              <div className={`space-y-1 ${!editingDoctorId ? 'lg:col-span-2' : ''}`}>
                <label className="zenith-field-label">Consultorio</label>
                <input value={form.officeLocation} onChange={(e) => handleChange('officeLocation', e.target.value)} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400" />
              </div>
              {editingDoctorId ? (
                <div className="space-y-1">
                  <label className="zenith-field-label">Estado</label>
                  <select value={form.status} onChange={(e) => handleChange('status', e.target.value as DoctorFormState['status'])} className="w-full bg-surface-950 border border-surface-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-surface-400">
                    <option value="activo">Activo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-850">
              <Button type="button" variant="outline" onClick={closeFormModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {editingDoctorId ? 'Guardar cambios' : 'Registrar médico'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}
