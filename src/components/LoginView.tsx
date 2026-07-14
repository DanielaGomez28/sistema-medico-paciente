'use client';

/**
 * @fileoverview Componente login view.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

import React, { useMemo, useState } from 'react';

import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from 'lucide-react';
import { ThemeToggle } from './theme';
import { cn } from '../lib/utils';
import { APP_USER_DEFAULTS } from '../data/mockData';

type LoginSuccessPayload = {
  role: string;
  email: string;
  name: string;
  token?: string | null;
  userId?: string | null;
  doctorId?: string | null;
  patientId?: string | null;
  socketIdentity?: string | null;
  doctorProfile?: {
    mpps?: string | null;
    specialty?: string | null;
    medicalCollege?: string | null;
    specialSanitaryRegistration?: string | null;
    digitalSignatureHash?: string | null;
    officeLocation?: string | null;
    status?: string | null;
  } | null;
};

interface LoginViewProps {
  onLoginSuccess: (user: LoginSuccessPayload) => void;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const containsSuspiciousPattern = (value: string) => /('|--|;|\/\*|\*\/|\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b|<script)/i.test(value);

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api', []);

  const validateEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');


    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();

    let hasError = false;

    if (!normalizedEmail) {
      setEmailError('El correo electronico es obligatorio.');
      hasError = true;
    } else if (!validateEmail(normalizedEmail)) {
      setEmailError('Formato de correo electronico no valido.');
      hasError = true;
    } else if (containsSuspiciousPattern(normalizedEmail)) {
      setEmailError('El correo contiene un patron invalido.');
      hasError = true;
    }

    if (!normalizedPassword) {
      setPasswordError('La contrasena es obligatoria.');
      hasError = true;
    } else if (containsSuspiciousPattern(normalizedPassword)) {
      setPasswordError('La contrasena contiene un patron invalido.');
      hasError = true;
    }



    if (hasError) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        const userRole = (data.role || data.rol || 'paciente').toLowerCase();
        const userEmail = data.email || data.correo || normalizedEmail;
        const userName = data.name || data.nombre || APP_USER_DEFAULTS.patientName;
        onLoginSuccess({
          role: userRole,
          email: userEmail,
          name: userName,
          token: data.token || null,
          userId: data.userId || null,
          doctorId: data.doctorId || null,
          patientId: data.patientId || null,
          socketIdentity: data.socketIdentity || data.patientId || data.userId || userEmail,
          doctorProfile: data.doctorProfile || null,
        });
      } else if (response.status === 401) {
        setPasswordError(data.error || 'La contrasena ingresada es incorrecta.');
      } else if (response.status === 404) {
        setEmailError(data.error || 'Usuario no registrado.');

      } else if (response.status === 403) {
        setGeneralError(data.error || 'La cuenta no tiene permisos o se encuentra suspendida.');
      } else {
        setGeneralError(data.error || 'No fue posible iniciar sesion.');
      }
    } catch {
      setGeneralError('No se pudo conectar con el servidor. Verifica que el backend este encendido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-view flex min-h-screen items-center justify-center px-4 py-10">
      <div className="login-view__bg" aria-hidden>
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className={`login-view__line login-view__line--${index + 1}`} />
        ))}
      </div>

      <div className="login-view__theme-wrap absolute top-4 right-4 z-20">
        <ThemeToggle className="login-view__theme-toggle" />
      </div>

      <div className="login-view__shell relative z-10 w-full max-w-[420px]">
        <div className="login-view__card">
          <div className="login-view__card-icon" aria-hidden>
            <LogIn className="h-5 w-5" />
          </div>

          <h1 className="login-view__title">Iniciar sesion</h1>
          <p className="login-view__subtitle">Ingrese sus datos para acceder al sistema</p>

          <form onSubmit={handleSubmit} className="login-view__form">
            {generalError && (
              <div role="alert" className="login-view__alert mb-4 flex items-start gap-3 rounded-xl border px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <Mail className="login-view__field-icon pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="text"
                    name="email"
                    autoComplete="username"
                    placeholder="ejemplo@ejemplo.com"
                    aria-label="Correo electronico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn('login-view__field w-full rounded-xl border-0 py-3.5 pl-11 pr-4 outline-none transition-shadow', emailError && 'login-view__field--error')}
                  />
                </div>
                {emailError && <p className="login-view__field-error">{emailError}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className="login-view__field-icon pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="********"
                    aria-label="Contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn('login-view__field w-full rounded-xl border-0 py-3.5 pl-11 pr-11 outline-none transition-shadow', passwordError && 'login-view__field--error')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-view__icon-btn absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="login-view__field-error">{passwordError}</p>}
              </div>


            </div>

            <button type="submit" disabled={submitting} className={cn('login-view__submit mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 transition-opacity', submitting && 'cursor-not-allowed opacity-70')}>
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Entrando...</>) : 'Ingresar al sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

