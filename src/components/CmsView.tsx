'use client';

/**
 * @fileoverview Componente cms view.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, FileText, ImageIcon, Info, Palette, Save, Upload } from 'lucide-react';
import { PageHeader, Button } from './ui';
import { cn } from '../lib/utils';
import apiClient from '../lib/api';

interface ApiErrorPayload {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
}

interface CmsSettings {
  logoUrl: string;
  bannerUrl: string;
  consentTerms: string;
  termsAndConditions: string;
  usagePolicy: string;
}

type CmsSection = 'appearance' | 'legal';

const sectionTabs: { id: CmsSection; label: string; icon: React.ElementType }[] = [
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'legal', label: 'Textos legales', icon: FileText },
];

const DEFAULT_SETTINGS: CmsSettings = {
  logoUrl: '/images/default-logo.png',
  bannerUrl: '/images/default-banner.jpg',
  consentTerms: 'Términos clínicos no cargados.',
  termsAndConditions: 'Términos generales no cargados.',
  usagePolicy: 'Política de uso no cargada.',
};

export default function CmsView() {
  const [settings, setSettings] = useState<CmsSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState<CmsSection>('appearance');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [logoFileName, setLogoFileName] = useState('logo_zenith_vector.png');
  const [bannerFileName, setBannerFileName] = useState('banner_promocional.jpg');
  const [isEditingLegal, setIsEditingLegal] = useState(false);
  const [legalDraft, setLegalDraft] = useState({
    consentTerms: '',
    termsAndConditions: '',
    usagePolicy: ''
  });

  useEffect(() => {
    let cancelled = false;

    const loadCms = async () => {
      const localCms = localStorage.getItem('zenith_cms_settings');
      if (localCms) {
        const parsed = JSON.parse(localCms) as Partial<CmsSettings>;
        setSettings((prev) => ({
          ...prev,
          logoUrl: parsed.logoUrl ?? prev.logoUrl,
          bannerUrl: parsed.bannerUrl ?? prev.bannerUrl,
        }));
      }

      try {
        setLoadingConfig(true);
        setBackendError('');
        const response = await apiClient.get('/admin/cms/config');
        const config = response.data?.config || {};

        if (!cancelled) {
          setSettings((prev) => ({
            ...prev,
            consentTerms: config.consentTermsText ?? prev.consentTerms,
            termsAndConditions: config.termsAndConditionsText ?? prev.termsAndConditions,
            usagePolicy: config.usagePolicyText ?? prev.usagePolicy,
          }));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setBackendError(
            (error as ApiErrorPayload).response?.data?.error ||
              (error as ApiErrorPayload).response?.data?.details ||
              'No se pudo cargar el CMS del backend.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingConfig(false);
        }
      }
    };

    loadCms();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleImageUpload = (file: File, field: 'logoUrl' | 'bannerUrl', setFileName: (name: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSettings((prev) => ({ ...prev, [field]: e.target!.result as string }));
        setFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartLegalEdit = () => {
    setLegalDraft({
      consentTerms: settings.consentTerms,
      termsAndConditions: settings.termsAndConditions,
      usagePolicy: settings.usagePolicy
    });
    setIsEditingLegal(true);
  };

  const handleCancelLegalEdit = () => {
    setIsEditingLegal(false);
  };

  const handleConfirmLegalEdit = async () => {
    try {
      setLoadingConfig(true);
      setBackendError('');
      await apiClient.put('/admin/cms/config', {
        config: {
          consentTermsText: legalDraft.consentTerms,
          termsAndConditionsText: legalDraft.termsAndConditions,
          usagePolicyText: legalDraft.usagePolicy,
        },
      });

      setSettings((prev) => ({
        ...prev,
        consentTerms: legalDraft.consentTerms,
        termsAndConditions: legalDraft.termsAndConditions,
        usagePolicy: legalDraft.usagePolicy,
      }));
      setIsEditingLegal(false);

      localStorage.setItem(
        'zenith_cms_settings',
        JSON.stringify({ logoUrl: settings.logoUrl, bannerUrl: settings.bannerUrl })
      );
      window.dispatchEvent(new Event('zenith_cms_update'));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: unknown) {
      setBackendError(
        (error as ApiErrorPayload).response?.data?.error ||
          (error as ApiErrorPayload).response?.data?.details ||
          'No se pudo guardar la configuración global.'
      );
    } finally {
      setLoadingConfig(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoadingConfig(true);
      setBackendError('');
      await apiClient.put('/admin/cms/config', {
        config: {
          consentTermsText: settings.consentTerms,
          termsAndConditionsText: settings.termsAndConditions,
          usagePolicyText: settings.usagePolicy,
        },
      });

      localStorage.setItem(
        'zenith_cms_settings',
        JSON.stringify({ logoUrl: settings.logoUrl, bannerUrl: settings.bannerUrl })
      );
      window.dispatchEvent(new Event('zenith_cms_update'));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: unknown) {
      setBackendError(
        (error as ApiErrorPayload).response?.data?.error ||
          (error as ApiErrorPayload).response?.data?.details ||
          'No se pudo guardar la configuración global.'
      );
    } finally {
      setLoadingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button size="sm" variant="patient" onClick={handlePublish} disabled={loadingConfig}>
            <Save className="h-4 w-4" />
            Guardar cambios
          </Button>
        }
      />

      {backendError ? (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center gap-2 text-amber-300 text-xs">
          <Info className="h-4 w-4 shrink-0" />
          <span>{backendError}</span>
        </div>
      ) : null}

      {saveSuccess ? (
        <div className="p-3.5 bg-secondary-500/10 border border-secondary-500/25 rounded-xl flex items-center gap-2 text-secondary-450 text-xs">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span><strong className="font-bold">Cambios guardados.</strong> El CMS ya está sincronizado con el backend.</span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-surface-800 pb-1">
        {sectionTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer',
              activeSection === id
                ? 'text-foreground border-primary-500'
                : 'text-surface-500 border-transparent hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {activeSection === 'appearance' ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-5">
            {([
              { key: 'logoUrl', label: 'Logotipo', fileName: logoFileName, setter: setLogoFileName },
              { key: 'bannerUrl', label: 'Banner principal', fileName: bannerFileName, setter: setBannerFileName },
            ] as const).map((item) => (
              <section key={item.key} className="zenith-panel space-y-4">
                <div>
                  <h3 className="zenith-section-title">{item.label}</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-center shrink-0 overflow-hidden">
                    <ImageIcon className="h-7 w-7 text-surface-500" />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="text-xs text-surface-400 truncate">{item.fileName}</p>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-950 border border-surface-800 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-850 transition-colors cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Subir recurso
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, item.key, item.setter);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <aside className="xl:col-span-2">
            <div className="zenith-panel space-y-4 sticky top-6">
              <h3 className="zenith-section-title">Vista previa</h3>
              <p className="text-xs text-surface-500">Configura la apariencia y marca de tu portal.</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="max-w-4xl space-y-5">
          <section className="zenith-panel space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-850 pb-4">
              <div>
                <h3 className="zenith-section-title">Textos legales</h3>
                <p className="text-xs text-surface-400">Los datos permanecen en solo lectura hasta que confirmes la edición.</p>
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-2 sm:min-w-[220px]">
                {isEditingLegal ? (
                  <>
                    <button type="button" onClick={handleConfirmLegalEdit} disabled={loadingConfig} className="w-full sm:min-w-[220px] px-4 py-2.5 bg-gradient-to-r from-secondary to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-secondary-650/10 transition-all">Confirmar cambios</button>
                    <button type="button" onClick={handleCancelLegalEdit} disabled={loadingConfig} className="w-full sm:min-w-[220px] px-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-surface-300 hover:text-white text-xs font-bold transition-all">Cancelar</button>
                  </>
                ) : (
                  <button type="button" onClick={handleStartLegalEdit} disabled={loadingConfig} className="w-full sm:min-w-[220px] px-4 py-2.5 bg-[var(--portal-btn-bg)] hover:bg-[var(--portal-btn-hover)] text-[var(--portal-btn-fg)] rounded-xl text-xs font-extrabold shadow-md transition-colors">Editar textos</button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="zenith-field-label" htmlFor="cms-consent">Términos de consentimiento clínico</label>
              <textarea id="cms-consent" rows={5} value={isEditingLegal ? legalDraft.consentTerms : settings.consentTerms} readOnly={!isEditingLegal} onChange={(e) => setLegalDraft((prev) => ({ ...prev, consentTerms: e.target.value }))} className={`w-full px-3.5 py-2.5 text-xs leading-relaxed resize-y min-h-[120px] rounded-xl border focus:outline-none ${isEditingLegal ? 'bg-surface-950 text-white border-surface-850 focus:border-secondary-500' : 'bg-surface-950/40 text-surface-250 border-surface-850'}`} />
            </div>

            <div className="space-y-1.5">
              <label className="zenith-field-label" htmlFor="cms-terms">Términos y condiciones de la plataforma</label>
              <textarea id="cms-terms" rows={5} value={isEditingLegal ? legalDraft.termsAndConditions : settings.termsAndConditions} readOnly={!isEditingLegal} onChange={(e) => setLegalDraft((prev) => ({ ...prev, termsAndConditions: e.target.value }))} className={`w-full px-3.5 py-2.5 text-xs leading-relaxed resize-y min-h-[120px] rounded-xl border focus:outline-none ${isEditingLegal ? 'bg-surface-950 text-white border-surface-850 focus:border-secondary-500' : 'bg-surface-950/40 text-surface-250 border-surface-850'}`} />
            </div>

            <div className="space-y-1.5">
              <label className="zenith-field-label" htmlFor="cms-policy">Política de uso</label>
              <textarea id="cms-policy" rows={4} value={isEditingLegal ? legalDraft.usagePolicy : settings.usagePolicy} readOnly={!isEditingLegal} onChange={(e) => setLegalDraft((prev) => ({ ...prev, usagePolicy: e.target.value }))} className={`w-full px-3.5 py-2.5 text-xs leading-relaxed resize-y min-h-[100px] rounded-xl border focus:outline-none ${isEditingLegal ? 'bg-surface-950 text-white border-surface-850 focus:border-secondary-500' : 'bg-surface-950/40 text-surface-250 border-surface-850'}`} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
