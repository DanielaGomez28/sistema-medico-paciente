'use client';

/**
 * @fileoverview Componente login view.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

import React, { useEffect, useMemo, useState } from 'react';

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
    officeLocation?: string | null;
    status?: string | null;
  } | null;
};

/** Props del componente `LoginView`. */
interface LoginViewProps {
  onLoginSuccess: (user: LoginSuccessPayload) => void;
}

const DEFAULT_LOGIN_BANNER_TITLE = '¡Bienvenido a +Salud!';
const DEFAULT_LOGIN_BANNER_SUBTITLE =
  '¿Eres médico? Genera y envía recetas electrónicas a tus pacientes de manera sencilla y centralizada.\n¿Eres paciente? Accede a tus prescripciones médicas y compra tus medicamentos en un solo clic.';

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const containsSuspiciousPattern = (value: string) => /('|--|;|\/\*|\*\/|\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b|<script)/i.test(value);

/**
 * Normaliza el rol recibido del backend (con variantes de idioma/acentos) a
 * uno de los roles canónicos del frontend: `admin`, `doctor` o `patient`.
 *
 * @param {string | null | undefined} role - Rol crudo devuelto por la API.
 * @returns {string} Rol normalizado, o el valor normalizado sin mapear si no coincide.
 */
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

/**
 * Vista de inicio de sesión: valida credenciales contra la API, normaliza el
 * rol del usuario autenticado y notifica el éxito al componente padre.
 *
 * @param {LoginViewProps} props - Propiedades del componente.
 * @returns {JSX.Element} Formulario de inicio de sesión.
 */
export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bannerTitle, setBannerTitle] = useState(DEFAULT_LOGIN_BANNER_TITLE);
  const [bannerSubtitle, setBannerSubtitle] = useState(DEFAULT_LOGIN_BANNER_SUBTITLE);
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api', []);

  useEffect(() => {
    let cancelled = false;

    const loadBanner = async () => {
      try {
        const response = await fetch(`${apiUrl}/platform/login-banner`);
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        if (typeof data.loginBannerTitle === 'string' && data.loginBannerTitle.trim()) {
          setBannerTitle(data.loginBannerTitle);
        }
        if (typeof data.loginBannerSubtitle === 'string' && data.loginBannerSubtitle.trim()) {
          setBannerSubtitle(data.loginBannerSubtitle);
        }
      } catch {
        // Sin conexión al backend: se mantiene el texto por defecto.
      }
    };

    void loadBanner();

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#ffffff] dark:bg-[#041a1d] transition-colors duration-300" style={{ fontFamily: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif' }}>

      {/* Left Panel - Login Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 relative bg-[#ffffff] dark:bg-[#041a1d]">

        {/* Theme wrap inside the form panel */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle className="shadow-sm border border-gray-100 dark:border-surface-800" />
        </div>

        <div className="w-full max-w-[390px] space-y-7">

          {/* Form Header */}
          <div className="flex flex-col items-start gap-3 -mt-4">
            {/* Brand row: logo + name */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo del Sistema" width={44} height={44} className="object-contain" style={{ display: 'block', width: '44px', height: '44px' }} />
              <span className="font-semibold" style={{ color: '#179150', fontSize: '23px' }}>+Salud</span>
            </div>
            {/* Title + Subtitle */}
            <div>
              <h1 className="font-bold tracking-tight text-black dark:text-white" style={{ fontSize: '30px', fontWeight: '700', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                Iniciar sesión
              </h1>
              <p className="text-base text-black dark:text-white mt-1">
                Ingrese sus datos para acceder al sistema
              </p>
            </div>
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
                <Mail className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-black dark:text-white pointer-events-none" />
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
                    'w-full rounded-xl border border-gray-200 dark:border-[#08333a] bg-[#fbfbf9] dark:bg-[#06242a] py-3.5 pl-12 pr-4 text-base text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:border-[#13379b] focus:ring-2 focus:ring-[#13379b]/10 transition-all',
                    emailError && 'border-red-500 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500/10'
                  )}
                />
              </div>
              {emailError && <p className="text-[15px] text-red-500 pl-1">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-black dark:text-white pointer-events-none" />
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
                    'w-full rounded-xl border border-gray-200 dark:border-[#08333a] bg-[#fbfbf9] dark:bg-[#06242a] py-3.5 pl-12 pr-12 text-base text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:border-[#13379b] focus:ring-2 focus:ring-[#13379b]/10 transition-all',
                    passwordError && 'border-red-500 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500/10'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-black dark:text-white hover:text-black/70 dark:hover:text-white/80 transition-colors cursor-pointer"
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
                'mt-2 flex w-full items-center justify-center gap-2 rounded-xl text-white font-bold py-3.5 text-[17px] shadow-md shadow-[#179150]/30 hover:shadow-lg hover:shadow-[#179150]/40 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none',
                submitting && 'opacity-70'
              )}
              style={{ backgroundColor: '#179150', color: 'white' }}
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
          <div className="pt-4 border-t border-gray-300 dark:border-[#08333a] space-y-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-black dark:text-white" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                Perfiles de prueba
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LOGIN_TEST_USERS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickAccessSelect(account.email, account.password)}
                  className="rounded-xl border border-gray-100 dark:border-[#08333a] bg-[#fbfbf9] dark:bg-[#06242a] px-3 py-2.5 text-left transition-all hover:border-[#13379b] hover:bg-[#13379b]/5 dark:hover:bg-[#13379b]/10 cursor-pointer"
                >
                  <span className="block text-sm font-bold text-black dark:text-white">
                    {LOGIN_TEST_ACCOUNT_LABELS[account.role]}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-black dark:text-white truncate">
                    {account.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Right Panel - Brand Viewport */}
      <div className="hidden md:flex md:w-[42%] lg:w-[38%] relative overflow-hidden select-none shrink-0 flex-col justify-center px-12" style={{ background: 'linear-gradient(160deg, #179150 0%, #50e9f8 100%)' }}>
        <div className="space-y-6 max-w-sm">
          <h2 className="login-banner-text" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: '37px', fontWeight: '700', lineHeight: '1.2' }}>
            {bannerTitle}
          </h2>
          <div className="login-banner-text" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: '18px', fontWeight: '400', lineHeight: '1.65' }}>
            {bannerSubtitle.split('\n').filter((line) => line.trim()).map((line, index) => (
              <p key={index} className="mb-4 last:mb-0">{line}</p>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
