'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle, 
  ShieldCheck, 
  Palette, 
  Info, 
  Eye, 
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface CmsSettings {
  logoUrl: string;
  bannerUrl: string;
  themeColor: string;
  termsAndConditions: string;
  privacyPolicy: string;
  deliveryPolicy: string;
}

const DEFAULT_TERMS = `Términos y Condiciones de Farma-Humana:
1. Aceptación de los Términos: Al acceder y utilizar este portal de salud digital, el usuario acepta de manera explícita los términos de servicio expuestos en el presente acuerdo.
2. Prescripción Médica: La compra de medicamentos controlados requerirá de la validación física u homologación digital del récipe emitido por un médico colegiado verificado en Zenith OMS.
3. Descuentos y Promociones: Los descuentos otorgados son exclusivos del programa de incentivos del médico tratante y no son transferibles.`;

const DEFAULT_PRIVACY = `Políticas de Privacidad y Consentimiento de Datos:
De conformidad con las leyes de protección de datos de salud y regulaciones de secreto médico, toda la información de diagnóstico y recetas emitidas se almacena de forma encriptada de punto a punto y no es compartida con entidades de mercadotecnia de terceros.`;

export default function CmsView() {
  const [settings, setSettings] = useState<CmsSettings>({
    logoUrl: '/images/default-logo.png',
    bannerUrl: '/images/default-banner.jpg',
    themeColor: 'indigo',
    termsAndConditions: DEFAULT_TERMS,
    privacyPolicy: DEFAULT_PRIVACY,
    deliveryPolicy: 'Las entregas a domicilio estándar se procesan en un lapso de 24 horas hábiles a partir de la confirmación del pago en Farma-Humana.'
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string }[]>([
    { name: 'logo_farma_humana_vector.png', size: '142 KB', type: 'image/png' },
    { name: 'banner_promocional_junio.jpg', size: '1.2 MB', type: 'image/jpeg' }
  ]);

  const [dragActive, setDragActive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load configuration from local storage
  useEffect(() => {
    const localCms = localStorage.getItem('zenith_cms_settings');
    if (localCms) {
      setSettings(JSON.parse(localCms));
    }
  }, []);

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const newFile = {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        type: file.type
      };
      setUploadedFiles(prev => [...prev, newFile]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newFile = {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        type: file.type
      };
      setUploadedFiles(prev => [...prev, newFile]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    localStorage.setItem('zenith_cms_settings', JSON.stringify(settings));
    localStorage.setItem('zenith_terms_conditions', settings.termsAndConditions);
    
    // Trigger custom event so other views can immediately listen to visual changes
    window.dispatchEvent(new Event('zenith_cms_update'));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Personalización y Configuración CMS</h2>
          <p className="text-sm text-slate-400">Administre la identidad de marca, plantillas visuales y políticas legales.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? 'Volver al Editor' : 'Vista Previa en Vivo'}</span>
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-650 hover:to-purple-750 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-550/15 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Publicar Cambios</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center gap-2.5 text-emerald-450 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <div>
            <span className="font-bold">¡Publicación Exitosa!</span> Las políticas legales y la plantilla visual del portal se han sincronizado en caliente para todos los usuarios.
          </div>
        </div>
      )}

      {previewMode ? (
        /* Live Preview Mode of Visual Identity */
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Previsualizador de Identidad Corporativa</span>
            <h3 className="text-lg font-bold text-white">Así visualizarán los pacientes el portal</h3>
          </div>

          {/* Simulated Banner */}
          <div className="relative h-44 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-slate-900/80 border border-indigo-500/10 overflow-hidden flex items-center justify-between px-8">
            <div className="space-y-2 relative z-10 max-w-sm">
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold text-white bg-${settings.themeColor}-600`}>
                Descuento de Consulta
              </span>
              <h4 className="text-lg font-black text-white leading-tight">Su médico le ha otorgado beneficios exclusivos</h4>
              <p className="text-2xs text-slate-400">Canjee su récipe digital en cualquier sucursal afiliada a Farma-Humana.</p>
            </div>
            <div className={`h-20 w-20 rounded-2xl bg-${settings.themeColor}-550/15 border border-${settings.themeColor}-550/20 flex items-center justify-center`}>
              <Palette className={`h-10 w-10 text-${settings.themeColor}-400`} />
            </div>
            {/* Ambient glows */}
            <div className={`absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-${settings.themeColor}-500/10 blur-xl`}></div>
          </div>

          {/* Legal document preview card */}
          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-2.5">
              <BookOpen className="h-4.5 w-4.5 text-slate-450" />
              <h4 className="text-xs font-bold text-slate-200">Términos y Condiciones Sincronizados</h4>
            </div>
            <p className="text-2xs text-slate-400 whitespace-pre-line leading-relaxed font-mono">
              {settings.termsAndConditions}
            </p>
          </div>
        </div>
      ) : (
        /* Standard Edit Forms Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column: Drag & Drop Zone */}
          <div className="space-y-6">
            
            {/* File drop panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <div>
                <h3 className="font-bold text-white text-base">Carga de Multimedia y Banners</h3>
                <p className="text-xs text-slate-400">Cargue banners de campaña, logotipos e imágenes del sistema.</p>
              </div>

              {/* Drag/Drop area */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/5' 
                    : 'border-slate-850 bg-slate-950/20 hover:border-slate-700'
                }`}
              >
                <input 
                  type="file" 
                  id="cms-file-upload" 
                  multiple 
                  onChange={handleFileInput}
                  className="hidden" 
                />
                
                <label 
                  htmlFor="cms-file-upload" 
                  className="flex flex-col items-center justify-center gap-3 cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Arrastre archivos multimedia o examine su equipo</p>
                    <p className="text-[10px] text-slate-500 mt-1">Soporta PNG, JPEG o SVG hasta 5MB por archivo.</p>
                  </div>
                </label>
              </div>

              {/* Uploaded Files Ledger */}
              <div className="space-y-2">
                <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Archivos de la Interfaz Activos ({uploadedFiles.length})</p>
                
                <div className="divide-y divide-slate-850">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0">
                          <FileText className="h-4.5 w-4.5 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                          <p className="text-[9px] font-mono text-slate-500">{file.size} • {file.type}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Corporate visual theme configuration */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <Palette className="h-4.5 w-4.5 text-rose-450" />
                <h3 className="font-bold text-white text-base">Identidad Visual & Estilos</h3>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-2xs font-bold text-slate-450 uppercase">Gama de Color Temático</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'indigo', name: 'Índigo', color: 'bg-indigo-600' },
                      { id: 'rose', name: 'Rosa Carmín', color: 'bg-rose-600' },
                      { id: 'emerald', name: 'Esmeralda', color: 'bg-emerald-600' },
                      { id: 'amber', name: 'Ámbar', color: 'bg-amber-600' },
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setSettings(prev => ({ ...prev, themeColor: theme.id }))}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                          settings.themeColor === theme.id 
                            ? 'bg-slate-950 border-indigo-500 text-white font-extrabold' 
                            : 'bg-slate-950/20 border-slate-850 text-slate-450 hover:text-slate-200'
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-full ${theme.color} shrink-0`}></span>
                        <span>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-2xs font-bold text-slate-450 uppercase">Logotipo Oficial (Path)</label>
                    <input 
                      type="text" 
                      value={settings.logoUrl}
                      onChange={e => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-2xs font-bold text-slate-450 uppercase">Ruta del Banner Principal</label>
                    <input 
                      type="text" 
                      value={settings.bannerUrl}
                      onChange={e => setSettings(prev => ({ ...prev, bannerUrl: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Legal Texts & Policies */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Políticas Legales y Consentimientos</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-2xs font-bold text-slate-450 uppercase">Términos y Condiciones de Farma-Humana</label>
                  <span className="text-[9px] text-slate-500">Requerido en el carrito del paciente</span>
                </div>
                <textarea
                  rows={6}
                  value={settings.termsAndConditions}
                  onChange={e => setSettings(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-mono leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-2xs font-bold text-slate-450 uppercase">Políticas de Privacidad de Datos</label>
                <textarea
                  rows={4}
                  value={settings.privacyPolicy}
                  onChange={e => setSettings(prev => ({ ...prev, privacyPolicy: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-mono leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-2xs font-bold text-slate-450 uppercase">Políticas de Despacho / Delivery</label>
                <textarea
                  rows={3}
                  value={settings.deliveryPolicy}
                  onChange={e => setSettings(prev => ({ ...prev, deliveryPolicy: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/15 rounded-xl flex items-start gap-2.5 text-[10px] text-slate-400">
              <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>Cualquier cambio en este bloque legal forzará la re-aceptación de los términos y condiciones en la interfaz del paciente antes de poder confirmar un pedido.</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
