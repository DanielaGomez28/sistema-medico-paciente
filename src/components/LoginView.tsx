'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Activity } from 'lucide-react';
import { Card, Input, Button, Label } from './ui';
import { ThemeToggle } from './theme';

interface LoginViewProps {
  onLoginSuccess: (role: string, email: string) => void;
}

// Local mock credentials database
const MOCK_USERS = [
  { email: 'admin@zenith.com', password: 'password123', role: 'superadmin', name: 'Administrador General' },
  { email: 'medico@clinica.com', password: 'medico123', role: 'médico', name: 'Dr. Alejandro Ríos' },
  { email: 'paciente@clinica.com', password: 'paciente123', role: 'paciente', name: 'Sofía Peralta' },
];

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation and Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Auto-fill test accounts helper
  const handleQuickFill = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  };

  // Email validation regex
  const validateEmail = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasError = false;

    // Validate inputs
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

    // Search user in mock DB
    const matchedUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      // Role recognized -> Trigger successful login callback
      onLoginSuccess(matchedUser.role, matchedUser.email);
    } else {
      // Email not found in the database
      const userExistsInDb = MOCK_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!userExistsInDb) {
        setGeneralError('Usuario no registrado. Contacte al administrador para obtener acceso.');
      } else {
        // Wrong password for existing user
        setGeneralError('Contraseña incorrecta. Por favor intente de nuevo.');
      }
    }
  };

  return (
    <div className="login-view min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="login-view__theme-toggle" />
      </div>
      {/* Decorative background glows */}
      <div className="login-view__glow--primary absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] pointer-events-none" />
      <div className="login-view__glow--secondary absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none" />

      <Card variant="section" className="login-view__card w-full max-w-md p-4 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Logo and header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="login-view__logo h-12 w-12 rounded-xl border flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
          <h2 className="zenith-page-title mt-2">Médico-Paciente</h2>
          <p className="login-view__subtitle text-xs">
            Inicio de Sesión Unificado para Médicos, Pacientes y Administradores
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Errors */}
          {generalError && (
            <div className="p-3.5 bg-secondary-500/10 border border-secondary-500/20 rounded-xl flex items-start gap-2.5 text-xs text-secondary-450">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <Label>Correo Electrónico</Label>
            <Input
              icon={<Mail className="h-4 w-4" />}
              type="text"
              placeholder="ejemplo@clinica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              className="login-view__input text-sm py-2.5"
            />
            {emailError && <p className="text-xs text-secondary-450 font-medium">{emailError}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label>Contraseña</Label>
              <span className="login-view__hint text-[10px]">Mín. 6 caracteres</span>
            </div>
            <div className="relative">
              <Input
                icon={<Lock className="h-4 w-4" />}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                className="login-view__input text-sm py-2.5 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-view__icon-btn absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded z-10 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && <p className="text-xs text-secondary-450 font-medium">{passwordError}</p>}
          </div>

          <Button type="submit" size="lg" className="login-view__submit w-full mt-4">
            Iniciar Sesión
          </Button>
        </form>

        {/* Footer credentials reminder */}
        <div className="login-view__divider border-t pt-4 text-[10px] flex flex-col space-y-2 text-center">
          <p className="login-view__footer-label font-semibold">
            Cuentas de Prueba (Haz clic para autorellenar):
          </p>
          <div className="grid grid-cols-1 gap-1.5 text-xs text-left max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@zenith.com', 'password123')}
              className="login-view__quick-fill px-3 py-1.5 border rounded-xl flex items-center justify-between transition-all cursor-pointer font-sans"
            >
              <span>
                Admin: <code className="login-view__link">admin@zenith.com</code>
              </span>
              <span className="login-view__mono font-mono text-2xs">Clave: password123</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('medico@clinica.com', 'medico123')}
              className="login-view__quick-fill px-3 py-1.5 border rounded-xl flex items-center justify-between transition-all cursor-pointer font-sans"
            >
              <span>
                Médico: <code className="login-view__link">medico@clinica.com</code>
              </span>
              <span className="login-view__mono font-mono text-2xs">Clave: medico123</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('paciente@clinica.com', 'paciente123')}
              className="login-view__quick-fill px-3 py-1.5 border rounded-xl flex items-center justify-between transition-all cursor-pointer font-sans"
            >
              <span>
                Paciente: <code className="login-view__link">paciente@clinica.com</code>
              </span>
              <span className="login-view__mono font-mono text-2xs">Clave: paciente123</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
