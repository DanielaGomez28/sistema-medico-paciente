'use client';

import React, { useState } from 'react';
import { Activity, AlertCircle, ChevronDown, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { LoginAnimatedBackdrop } from './auth/LoginAnimatedBackdrop';
import { ThemeToggle } from './theme';
import { Label } from './ui';
import { cn } from '../lib/utils';

interface LoginViewProps {
  onLoginSuccess: (role: string, email: string) => void;
}

const MOCK_USERS = [
  { email: 'admin@zenith.com', password: 'password123', role: 'superadmin', name: 'Administrador General' },
  { email: 'medico@clinica.com', password: 'medico123', role: 'médico', name: 'Dr. Alejandro Ríos' },
  { email: 'paciente@clinica.com', password: 'paciente123', role: 'paciente', name: 'Sofía Peralta' },
];

const TEST_ACCOUNT_LABELS: Record<string, string> = {
  superadmin: 'Admin',
  médico: 'Médico',
  paciente: 'Paciente',
};

function LoginBrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className="login-view__brand-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border">
        <Activity className="h-5 w-5" />
      </div>
      <div className="text-left">
        <p className="text-base font-bold tracking-tight leading-none">Médico-Paciente</p>
        <p className="login-view__brand-tag mt-1 uppercase tracking-wider">
          Zenith Health
        </p>
      </div>
    </div>
  );
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  const handleQuickFill = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  };

  const validateEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasError = false;

    if (!email) {
      setEmailError('El correo electrónico es obligatorio.');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Formato de correo electrónico no válido.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('La contraseña es obligatoria.');
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 280));

    const matchedUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      onLoginSuccess(matchedUser.role, matchedUser.email);
    } else {
      const userExistsInDb = MOCK_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!userExistsInDb) {
        setGeneralError('Usuario no registrado. Contacte al administrador para obtener acceso.');
      } else {
        setGeneralError('Contraseña incorrecta. Por favor intente de nuevo.');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="login-view flex min-h-screen font-sans">
      <div className="login-view__hero relative hidden flex-1 flex-col justify-between overflow-hidden p-10 lg:flex">
        <LoginAnimatedBackdrop />
        <div className="relative z-10">
          <LoginBrandMark className="login-view__hero-brand text-login-hero-foreground" />
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight text-login-hero-foreground drop-shadow-sm">
            El centro de control de tu práctica clínica
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-login-hero-muted">
            Expedientes, recetas y seguimiento en un solo lugar. Menos papeleo, más tiempo con tus
            pacientes — un panel pensado para equipos de salud que no se detienen.
          </p>
        </div>
        <p className="login-view__hero-tagline relative z-10 text-sm font-medium">
          Médicos, pacientes y administración conectados.
        </p>
      </div>

      <div className="login-view__panel relative flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle className="login-view__theme-toggle" />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <LoginBrandMark className="login-view__panel-brand" />
            <h2 className="mt-5 text-center text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h2>
            <p className="login-view__panel-subtitle mt-2 text-center">
              Tu portal te espera. Un acceso y sigues donde lo dejaste.
            </p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h2>
            <p className="login-view__panel-subtitle mt-2">
              Un acceso y vuelves al mando de tu operación clínica.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {generalError && (
              <div
                role="alert"
                className="login-view__alert flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="login-email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-login-muted" />
                <input
                  id="login-email"
                  type="text"
                  name="email"
                  autoComplete="username"
                  placeholder="ejemplo@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    'login-view__field w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow',
                    emailError && 'login-view__field--error'
                  )}
                />
              </div>
              {emailError && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{emailError}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Contraseña</Label>
                <span className="login-view__hint">Mín. 6 caracteres</span>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-login-muted" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'login-view__field w-full rounded-lg border py-2.5 pl-10 pr-11 text-sm outline-none transition-shadow',
                    passwordError && 'login-view__field--error'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-view__icon-btn absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'login-view__submit flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity',
                submitting && 'cursor-not-allowed opacity-70'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Acceder al portal'
              )}
            </button>
          </form>

          <div className="login-view__divider mt-8 border-t pt-5">
            <button
              type="button"
              onClick={() => setShowTestAccounts((open) => !open)}
              aria-expanded={showTestAccounts}
              aria-controls="login-test-accounts"
              className="login-view__demo-toggle mx-auto flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors"
            >
              Cuentas de prueba
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform duration-200', showTestAccounts && 'rotate-180')}
                aria-hidden
              />
            </button>

            {showTestAccounts && (
              <div id="login-test-accounts" className="mt-3 grid grid-cols-1 gap-2">
                {MOCK_USERS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleQuickFill(account.email, account.password)}
                    className="login-view__quick-fill flex flex-col gap-1 rounded-xl border px-3 py-2 text-left text-xs transition-all sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0 break-all">
                      {TEST_ACCOUNT_LABELS[account.role] ?? account.role}:{' '}
                      <code className="login-view__link font-mono">{account.email}</code>
                    </span>
                    <span className="login-view__mono shrink-0 font-mono text-2xs sm:text-right">
                      Clave: {account.password}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="login-view__panel-footnote mt-6 text-center">
            Expedientes, recetas y despacho — un solo lugar para hacer crecer tu operación clínica.
          </p>
        </div>
      </div>
    </div>
  );
}
