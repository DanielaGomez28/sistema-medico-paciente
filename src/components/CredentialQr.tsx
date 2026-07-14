'use client';

/**
 * @fileoverview Componente credential qr.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

import { useState, useEffect, useCallback } from 'react';
import { QrCode, RefreshCw } from 'lucide-react';
import { useShell } from './layout';
import { Button, Modal, ModalBody } from './ui';

/**
 * Constante que define el tiempo de expiración (en segundos) de una credencial QR antes de rotar.
 * @constant
 */
const QR_ROTATION_SECONDS = 300; // 5 minutos

/**
 * Genera un token pseudo-aleatorio con el prefijo dado.
 * Utilizado para crear los códigos numéricos de los códigos QR.
 *
 * @param {string} prefix - Prefijo (ej. 'DR', 'PAT').
 * @returns {string} Token generado con sufijo aleatorio.
 */
function generateToken(prefix: string) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

/**
 * Hook para manejar la lógica y el estado de una credencial QR dinámica.
 * Expone el estado del modal, el token actual y la cuenta regresiva antes de rotar.
 *
 * @param {string} tokenPrefix - Prefijo estático del token.
 * @param {string} initialSuffix - Sufijo inicial predeterminado.
 * @returns {object} Objeto con propiedades y métodos para controlar la credencial y el modal.
 */
export function useCredentialQr(tokenPrefix: string, initialSuffix: string) {
  const [qrToken, setQrToken] = useState(`${tokenPrefix}-${initialSuffix}`);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_ROTATION_SECONDS);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          setQrToken(generateToken(tokenPrefix));
          return QR_ROTATION_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [tokenPrefix]);

  const handleRefreshQR = useCallback(() => {
    setQrToken(generateToken(tokenPrefix));
    setQrSecondsLeft(QR_ROTATION_SECONDS);
  }, [tokenPrefix]);

  return {
    qrToken,
    qrSecondsLeft,
    isCredentialModalOpen,
    setIsCredentialModalOpen,
    handleRefreshQR,
  };
}

/**
 * Componente SVG que simula la apariencia de un código QR a nivel decorativo.
 * Adaptado a los colores de la aplicación.
 *
 * @returns {JSX.Element} SVG de un QR abstracto.
 */
export function CredentialQrSvg() {
  return (
    <svg viewBox="0 0 100 100" className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 text-[#0a1220]">
      <rect x="0" y="0" width="20" height="20" fill="currentColor" />
      <rect x="5" y="5" width="10" height="10" fill="white" />
      <rect x="80" y="0" width="20" height="20" fill="currentColor" />
      <rect x="85" y="5" width="10" height="10" fill="white" />
      <rect x="0" y="80" width="20" height="20" fill="currentColor" />
      <rect x="5" y="85" width="10" height="10" fill="white" />
      <rect x="30" y="10" width="10" height="5" fill="currentColor" />
      <rect x="45" y="5" width="5" height="15" fill="currentColor" />
      <rect x="60" y="0" width="10" height="10" fill="currentColor" />
      <rect x="35" y="30" width="15" height="10" fill="currentColor" />
      <rect x="10" y="35" width="10" height="15" fill="currentColor" />
      <rect x="55" y="45" width="20" height="5" fill="currentColor" />
      <rect x="30" y="60" width="15" height="15" fill="currentColor" />
      <rect x="80" y="30" width="10" height="20" fill="currentColor" />
      <rect x="75" y="60" width="15" height="10" fill="currentColor" />
      <rect x="50" y="80" width="25" height="15" fill="currentColor" />
      <rect x="85" y="85" width="10" height="10" fill="white" />
    </svg>
  );
}

/**
 * Botón auxiliar para renderizar en el sidebar (`sidebarExtra`) que dispara la apertura
 * del modal de la credencial QR. Cierra el menú lateral automáticamente en vista móvil.
 *
 * @param {object} props - Propiedades del componente.
 * @param {() => void} props.onOpen - Función para abrir el modal del QR.
 * @returns {JSX.Element}
 */
export function SidebarCredentialButton({ onOpen }: { onOpen: () => void }) {
  const { closeSidebar } = useShell();

  return (
    <button
      type="button"
      onClick={() => {
        onOpen();
        closeSidebar();
      }}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-primary-400 hover:text-white hover:bg-primary-500/10 border border-primary-500/20 transition-colors cursor-pointer"
    >
      <QrCode className="h-4 w-4 shrink-0" />
      <span>Credencial QR</span>
    </button>
  );
}

/**
 * Propiedades del modal de credencial QR interactivo.
 * @interface CredentialQrModalProps
 * @property {boolean} open - Visibilidad del modal.
 * @property {() => void} onClose - Acción al cerrar.
 * @property {string} description - Texto descriptivo (ej: 'Muestre este código en recepción').
 * @property {string} displayName - Nombre del doctor o paciente.
 * @property {string} [credentialLine] - Línea adicional debajo del nombre (ej: Especialidad o CI).
 * @property {string} qrToken - Token de seguridad actual visible.
 * @property {number} qrSecondsLeft - Segundos restantes antes de la rotación automática.
 * @property {() => void} onRefresh - Acción para forzar una rotación manual.
 */
export interface CredentialQrModalProps {
  open: boolean;
  onClose: () => void;
  description: string;
  displayName: string;
  credentialLine?: string;
  qrToken: string;
  qrSecondsLeft: number;
  onRefresh: () => void;
  /**
   * Si se provee, se mostrará un botón "Regresar" que llamará esta función.
   */
  onReturn?: () => void;
  /**
   * Si se pasa `null`, se oculta la cabecera/título del modal.
   * Si se omite, se usa el título por defecto.
   */
  modalTitle?: string | null;
}

/**
 * Modal que muestra la credencial digital (código QR), nombre del titular,
 * token de seguridad en vivo y cuenta regresiva.
 *
 * @param {CredentialQrModalProps} props - Propiedades del modal de credencial.
 * @returns {JSX.Element}
 */
export function CredentialQrModal({
  open,
  onClose,
  description,
  displayName,
  credentialLine,
  qrToken,
  qrSecondsLeft,
  onRefresh,
  onReturn,
  modalTitle,
}: CredentialQrModalProps) {
  const modalTitleToUse = modalTitle === null ? undefined : modalTitle ?? 'Credencial QR Dinámica';

  const formatExpiry = (secs: number) => {
    if (secs >= 60) {
      const mins = Math.ceil(secs / 60);
      return `${mins} minutos`;
    }
    return `${secs}s`;
  };

  return (
    <Modal open={open} onClose={onClose} title={modalTitleToUse} size="lg">
      <ModalBody className="space-y-4">
        {description ? (
          <p className="text-xs text-surface-400 text-center">{description}</p>
        ) : null}
        <div className="flex flex-col items-center bg-white text-[#0a1220] p-6 sm:p-8 rounded-xl shadow-inner border border-surface-700/10 mx-auto max-w-md w-full">
          <CredentialQrSvg />
          <div className="mt-3 text-center space-y-1">
            {displayName ? <p className="text-sm font-bold text-[#0a1220]">{displayName}</p> : null}
            {credentialLine ? (
              <p className="text-[10px] font-mono text-surface-600">{credentialLine}</p>
            ) : null}
            <span className="text-xs font-mono font-bold text-[#0a1220] tracking-wider block">TOKEN: {qrToken}</span>
            <p className="text-[10px] text-surface-600 font-medium">Vence en <span className="text-secondary-600 font-bold">{formatExpiry(qrSecondsLeft)}</span></p>
          </div>
        </div>
        <div className="flex justify-center">
          {onReturn ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onReturn();
                onClose();
              }}
            >
              Regresar
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5" />
              Rotar credencial
            </Button>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
