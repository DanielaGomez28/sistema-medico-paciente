'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, RefreshCw } from 'lucide-react';
import { useShell } from './layout';
import { Button, Modal, ModalBody } from './ui';

const QR_ROTATION_SECONDS = 30;

function generateToken(prefix: string) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

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

export interface CredentialQrModalProps {
  open: boolean;
  onClose: () => void;
  description: string;
  displayName: string;
  credentialLine?: string;
  qrToken: string;
  qrSecondsLeft: number;
  onRefresh: () => void;
}

export function CredentialQrModal({
  open,
  onClose,
  description,
  displayName,
  credentialLine,
  qrToken,
  qrSecondsLeft,
  onRefresh,
}: CredentialQrModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Credencial QR Dinámica" size="lg">
      <ModalBody className="space-y-4">
        <p className="text-xs text-surface-400 text-center">{description}</p>
        <div className="flex flex-col items-center bg-white text-[#0a1220] p-6 sm:p-8 rounded-xl shadow-inner border border-surface-700/10 mx-auto max-w-md w-full">
          <CredentialQrSvg />
          <div className="mt-3 text-center space-y-1">
            <p className="text-sm font-bold text-[#0a1220]">{displayName}</p>
            {credentialLine && (
              <p className="text-[10px] font-mono text-surface-600">{credentialLine}</p>
            )}
            <span className="text-xs font-mono font-bold text-[#0a1220] tracking-wider block">
              TOKEN: {qrToken}
            </span>
            <p className="text-[10px] text-surface-600 font-medium">
              Vence en <span className="text-secondary-600 font-bold">{qrSecondsLeft}s</span>
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            Rotar credencial
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
