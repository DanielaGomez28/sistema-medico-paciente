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
import { APP_USER_DEFAULTS, LOGIN_TEST_ACCOUNT_LABELS, LOGIN_TEST_USERS } from '../data/mockData';

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

function normalizeFrontendRole(role: string | null | undefined): string {
  const normalizedRole = String(role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['superusuario', 'superuser', 'superadmin', 'admin'].includes(normalizedRole)) {
    return 'admin';
  }

  if (['medico', 'doctor'].includes(normalizedRole)) {
    return 'doctor';
  }

  if (['paciente', 'patient'].includes(normalizedRole)) {
    return 'patient';
  }

  return normalizedRole;
}

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

  const handleQuickAccessSelect = (emailValue: string, passwordValue: string) => {
    setEmail(emailValue);
    setPassword(passwordValue);
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  };

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
        const userRole = normalizeFrontendRole(data.role || data.rol || 'paciente');
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#ffffff] dark:bg-[#0c1322] transition-colors duration-300" style={{ fontFamily: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif' }}>

      {/* Left Panel - Login Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 relative bg-[#ffffff] dark:bg-[#0c1322]">
        
        {/* Theme wrap inside the form panel */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle className="shadow-sm border border-gray-100 dark:border-surface-800" />
        </div>

        <div className="w-full max-w-[390px] space-y-7">
          
          {/* Form Header */}
          <div className="text-center">
            <h1 className="text-[34px] font-extrabold tracking-tight text-black dark:text-black">
              Iniciar sesion
            </h1>
            <p className="text-base text-black mt-2">
              Ingrese sus datos para acceder al sistema
            </p>
          </div>

          {/* Alert */}
          {generalError && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-base text-red-600">
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-black pointer-events-none" />
                <input
                  id="login-email"
                  type="text"
                  name="email"
                  autoComplete="username"
                  placeholder="ejemplo@ejemplo.com"
                  aria-label="Correo electronico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border border-gray-200 bg-[#fbfbf9] py-3.5 pl-12 pr-4 text-base text-black placeholder:text-black/50 focus:outline-none focus:border-[#13379b] focus:ring-2 focus:ring-[#13379b]/10 transition-all',
                    emailError && 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                  )}
                />
              </div>
              {emailError && <p className="text-[15px] text-red-500 pl-1">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-black pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="********"
                  aria-label="Contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border border-gray-200 bg-[#fbfbf9] py-3.5 pl-12 pr-12 text-base text-black placeholder:text-black/50 focus:outline-none focus:border-[#13379b] focus:ring-2 focus:ring-[#13379b]/10 transition-all',
                    passwordError && 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-black hover:text-black/70 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="text-[15px] text-red-500 pl-1">{passwordError}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#13379b] hover:bg-[#0f2c7d] text-white font-bold py-3.5 text-base shadow-md shadow-[#13379b]/25 hover:shadow-lg hover:shadow-[#13379b]/35 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none',
                submitting && 'opacity-70'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Ingresar al sistema'
              )}
            </button>
          </form>

          {/* Test Accounts Panel */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-black">
                Perfiles de prueba
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LOGIN_TEST_USERS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickAccessSelect(account.email, account.password)}
                  className="rounded-xl border border-gray-100 bg-[#fbfbf9] px-3 py-2.5 text-left transition-all hover:border-[#13379b] hover:bg-[#13379b]/5 cursor-pointer"
                >
                  <span className="block text-sm font-bold text-black">
                    {LOGIN_TEST_ACCOUNT_LABELS[account.role]}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-black truncate">
                    {account.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Right Panel - Brand Viewport */}
      <div className="hidden md:flex md:w-[42%] lg:w-[38%] relative overflow-hidden select-none shrink-0" style={{ background: 'linear-gradient(160deg, #179150 0%, #0a6b75 55%, #13379b 100%)' }}>
      </div>
      
    </div>
  );
}
