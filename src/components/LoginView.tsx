'use client';

import React, { useMemo, useState } from 'react';

import {
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from 'lucide-react';
import { ThemeToggle } from './theme';
import { cn } from '../lib/utils';

type LoginSuccessPayload = {
  role: string;
  email: string;
  name: string;
  userId?: string | null;
  doctorId?: string | null;
  patientId?: string | null;
  socketIdentity?: string | null;
};

interface LoginViewProps {
  onLoginSuccess: (user: LoginSuccessPayload) => void;
}

const MOCK_USERS = [
  { email: 'admin@sistema.local', password: 'admin123', role: 'superadmin', name: 'Administrador Sistema' },
  { email: 'roberto.gomez@clinica.local', password: 'medico123', role: 'medico', name: 'Dr. Roberto Gomez' },
  { email: 'ana.martinez@email.com', password: 'paciente123', role: 'paciente', name: 'Ana Martinez' },
];

const TEST_ACCOUNT_LABELS: Record<string, string> = {
  superadmin: 'Admin',
  medico: 'Medico',
  paciente: 'Paciente',
};



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
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api', []);

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
        const fallbackUser = MOCK_USERS.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
        const userName = data.name || data.nombre || fallbackUser?.name || 'Usuario';
        onLoginSuccess({
          role: userRole,
          email: userEmail,
          name: userName,
          userId: data.userId || null,
          doctorId: data.doctorId || null,
          patientId: data.patientId || null,
          socketIdentity: data.socketIdentity || data.patientId || data.userId || userEmail,
        });
      } else if (response.status === 401) {
        setPasswordError(data.error || 'La contrasena ingresada es incorrecta.');
      } else if (response.status === 404) {
        setEmailError(data.error || 'Usuario no registrado.');

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

          <div className="login-view__divider mt-6 border-t pt-5">
            <button type="button" onClick={() => setShowTestAccounts((open) => !open)} aria-expanded={showTestAccounts} aria-controls="login-test-accounts" className="login-view__demo-toggle mx-auto flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors">
              Cuentas de prueba
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', showTestAccounts && 'rotate-180')} aria-hidden />
            </button>

            {showTestAccounts && (
              <div id="login-test-accounts" className="mt-3 grid grid-cols-1 gap-2">
                {MOCK_USERS.map((account) => (
                  <button key={account.email} type="button" onClick={() => handleQuickFill(account.email, account.password)} className="login-view__quick-fill flex flex-col gap-1 rounded-xl border px-3 py-2 text-left transition-all sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0 break-all">
                      {TEST_ACCOUNT_LABELS[account.role] ?? account.role}: <code className="login-view__link font-mono">{account.email}</code>
                    </span>
                    <span className="login-view__mono shrink-0 font-mono text-2xs sm:text-right">Clave: {account.password}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
