'use client';

/**
 * @fileoverview Documento imprimible del récipe clínico.
 * @description Cuerpo del recetario compartido por el portal del paciente y el
 * panel administrativo, para que ambos muestren exactamente el mismo documento
 * (posología, presentación, laboratorio, firma y código de verificación) en vez
 * de dos representaciones distintas de la misma receta.
 *
 * OJO: este documento SIEMPRE tiene fondo blanco porque es para imprimir, así
 * que usa colores FIJOS (slate, teal) y no las clases del sistema de temas
 * (surface, primary): esas cambian de valor entre modo claro y oscuro y volvían
 * el texto invisible sobre el fondo blanco fijo.
 */

import { Activity } from 'lucide-react';

/** Medicamento tal como se imprime en el recetario. */
export interface PrintablePrescriptionItem {
  id: string;
  /** Nombre comercial del medicamento. */
  name: string;
  /** Posología indicada por el médico. */
  instructions?: string;
  presentation?: string;
  laboratory?: string;
  activeIngredient?: string;
  prescribedQuantity?: number;
  dispensedQuantity?: number;
  treatmentDays?: number | null;
  dailyDoses?: number | null;
}

export interface PrintablePrescriptionProps {
  recipeId: string;
  issuedAt: string;
  expiresAt?: string;
  patientName: string;
  patientIdentifier?: string;
  patientEmail?: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
  notes?: string;
  items: PrintablePrescriptionItem[];
  facilityName: string;
  facilitySubtitle?: string;
  facilityAddress?: string;
  documentLabel?: string;
  signatureLabel?: string;
  signatureName?: string;
  signatureFooter?: string;
  verificationLabel?: string;
  verificationSeed?: string;
}

/** Anchos del código de barras decorativo, fijos para que el render sea estable. */
const BARCODE_BARS = [
  [0, 2], [3, 1], [5, 3], [10, 1], [13, 2], [17, 4], [23, 1], [25, 2], [29, 1],
  [32, 3], [37, 1], [40, 2], [44, 4], [50, 1], [53, 3], [58, 1], [61, 2],
  [65, 4], [71, 1], [74, 2], [78, 3], [83, 1], [86, 2], [90, 4], [96, 1], [98, 2],
];

/**
 * Renderiza el cuerpo del recetario clínico imprimible.
 * @param {PrintablePrescriptionProps} props - Datos del récipe a imprimir.
 * @returns {JSX.Element} Documento del récipe.
 */
export default function PrintablePrescription({
  recipeId,
  issuedAt,
  expiresAt,
  patientName,
  patientIdentifier,
  patientEmail,
  doctorName,
  doctorSpecialty,
  doctorLicense,
  notes,
  items,
  facilityName,
  facilitySubtitle,
  facilityAddress,
  documentLabel,
  signatureLabel = 'FIRMA DIGITAL',
  signatureName,
  signatureFooter,
  verificationLabel,
  verificationSeed,
}: PrintablePrescriptionProps) {
  return (
    <div className="p-8 space-y-8 flex-1 overflow-y-auto print:overflow-visible bg-white print:p-0">

      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-800">
            <Activity className="h-7 w-7 text-teal-700" />
            <h1 className="zenith-page-title uppercase">{facilityName}</h1>
          </div>
          {(facilitySubtitle || facilityAddress) && (
            <p className="text-2xs text-slate-500 font-medium">
              {facilitySubtitle}{facilitySubtitle && facilityAddress ? <br /> : null}{facilityAddress}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs font-bold bg-slate-100 border border-slate-300 px-3 py-1 rounded-full text-slate-700 font-mono">
            {recipeId}
          </span>
          {documentLabel ? <p className="text-2xs text-slate-400 mt-2">{documentLabel}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <p className="text-slate-500 font-bold uppercase text-[9px]">Paciente</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{patientName}</p>
          {(patientIdentifier || patientEmail) && (
            <p className="text-slate-500 mt-1">
              {patientIdentifier ? `ID: ${patientIdentifier}` : ''}
              {patientIdentifier && patientEmail ? ' • ' : ''}
              {patientEmail ? `Correo: ${patientEmail}` : ''}
            </p>
          )}
        </div>
        <div>
          <p className="text-slate-500 font-bold uppercase text-[9px]">Fecha Prescripción</p>
          <p className="font-bold text-slate-800 mt-0.5">{issuedAt}</p>
          {expiresAt ? <p className="text-slate-600 mt-1">Validez: Hasta el {expiresAt}</p> : null}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-teal-800 uppercase tracking-widest border-b border-slate-200 pb-1.5">
          Rx Prescripción Médica
          {items.length > 1 ? (
            <span className="ml-2 normal-case tracking-normal font-semibold text-slate-500">
              ({items.length} medicamentos)
            </span>
          ) : null}
        </h3>

        {items.map((item) => (
          <div key={item.id} className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <h4 className="text-base font-extrabold text-slate-900">{item.name}</h4>
                {item.activeIngredient ? (
                  <p className="text-xs font-semibold text-slate-600 mt-1">Principio activo: {item.activeIngredient}</p>
                ) : null}
                {(item.presentation || item.laboratory) && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {item.presentation ? `Presentación: ${item.presentation}` : ''}
                    {item.presentation && item.laboratory ? ' | ' : ''}
                    {item.laboratory ? `Laboratorio: ${item.laboratory}` : ''}
                  </p>
                )}
              </div>
              {item.prescribedQuantity !== undefined ? (
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Cantidad</p>
                  <p className="text-sm font-bold text-slate-800">{item.prescribedQuantity}</p>
                  {item.dispensedQuantity !== undefined ? (
                    <p className="text-[10px] text-slate-500">Dispensado: {item.dispensedQuantity}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-1 pt-1">
              <p className="text-[10px] font-bold text-teal-900 uppercase">Instrucciones de Dosificación:</p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                &ldquo;{item.instructions || 'Sin posología registrada'}&rdquo;
              </p>
              {(item.treatmentDays || item.dailyDoses) && (
                <p className="text-[10px] text-slate-500">
                  {item.dailyDoses ? `${item.dailyDoses} toma(s) por día` : ''}
                  {item.dailyDoses && item.treatmentDays ? ' • ' : ''}
                  {item.treatmentDays ? `Durante ${item.treatmentDays} día(s)` : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {notes ? (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-teal-900 uppercase">Observaciones del especialista:</p>
          <p className="text-sm text-slate-700 leading-relaxed">{notes}</p>
        </div>
      ) : null}

      <div className="pt-6 border-t border-slate-200 flex justify-between items-end gap-6">
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-900">{doctorName}</p>
          {doctorSpecialty ? <p className="text-[10px] text-slate-600">{doctorSpecialty}</p> : null}
          {doctorLicense ? <p className="text-[10px] text-slate-400 font-mono">{doctorLicense}</p> : null}
        </div>

        <div className="flex flex-col items-center relative pr-4">
          <div className="h-14 w-32 border-2 border-teal-700/60 rounded-lg flex flex-col items-center justify-center p-1 text-teal-800 rotate-3 font-serif select-none pointer-events-none bg-white/50 backdrop-blur-2xs">
            <span className="text-[7px] font-bold uppercase tracking-wider">{signatureLabel}</span>
            <span className="text-2xs font-extrabold uppercase my-0.5 tracking-tight font-sans">
              {signatureName || doctorName}
            </span>
            <span className="text-[7px] font-mono leading-none">REGISTRADO EN SISTEMA</span>
          </div>
          {signatureFooter ? (
            <span className="text-[9px] text-slate-400 font-mono mt-1">{signatureFooter}</span>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-[10px]">
        <div className="flex flex-col gap-1 text-left">
          <span className="text-[9px] font-bold uppercase text-slate-400">Código de Verificación Único</span>
          <span className="text-2xs font-mono font-medium text-slate-600">
            SEC-TOKEN: {recipeId}{verificationSeed ? `-${verificationSeed}` : ''}
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <svg viewBox="0 0 100 20" className="w-36 h-6 text-slate-900">
            {BARCODE_BARS.map(([x, width]) => (
              <rect key={x} x={x} y="0" width={width} height="20" fill="currentColor" />
            ))}
          </svg>
          {verificationLabel ? (
            <span className="text-[7px] font-mono text-slate-400">{verificationLabel}</span>
          ) : null}
        </div>
      </div>

    </div>
  );
}
