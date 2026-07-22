'use client';

/**
 * @fileoverview Módulo de ayuda del portal paciente.
 * @description Explica el funcionamiento de la plataforma y responde preguntas frecuentes.
 */

import { useState } from 'react';
import { ChevronDown, CircleHelp, HelpCircle, LifeBuoy } from 'lucide-react';
import { cn } from '../lib/utils';
import { PATIENT_HELP_FAQS, PATIENT_HELP_STEPS } from '../data/mockData';

/**
 * Vista de ayuda del portal paciente: presenta la guía de pasos de uso y un
 * acordeón de preguntas frecuentes.
 *
 * @returns {JSX.Element} Sección de ayuda para pacientes.
 */
export default function PatientHelpView() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="space-y-4">
      <div className="portal-dashboard-card py-3 px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/25 flex items-center justify-center shrink-0">
            <LifeBuoy className="h-5 w-5 text-primary-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="zenith-section-title text-sm sm:text-base">Centro de ayuda</h2>
            <p className="text-xs sm:text-sm text-surface-400 leading-snug mt-0.5">
              Guía rápida para usar +Salud: navegación, tratamientos y dudas comunes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <section className="portal-dashboard-card space-y-3">
          <div className="flex items-center gap-2 border-b border-surface-850 pb-2.5">
            <HelpCircle className="h-4 w-4 text-primary-400 shrink-0" />
            <h3 className="zenith-section-title text-xs sm:text-sm">Cómo funciona la plataforma</h3>
          </div>

          <ol className="grid gap-2.5">
            {PATIENT_HELP_STEPS.map((step, index) => (
              <li key={step.title} className="portal-dashboard-stat !p-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/15 border border-primary-500/30 text-[10px] font-bold text-primary-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">{step.title}</h4>
                    <p className="text-[11px] sm:text-xs text-surface-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="portal-dashboard-card space-y-3">
          <div className="flex items-center gap-2 border-b border-surface-850 pb-2.5">
            <CircleHelp className="h-4 w-4 text-primary-400 shrink-0" />
            <h3 className="zenith-section-title text-xs sm:text-sm">Preguntas frecuentes</h3>
          </div>

          <div className="space-y-2">
            {PATIENT_HELP_FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <div key={faq.question} className="portal-dashboard-stat overflow-hidden !p-0">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-start justify-between gap-2.5 p-3 text-left cursor-pointer hover:bg-surface-900/40 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-bold text-white leading-snug">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-surface-400 transition-transform duration-200 mt-0.5',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="px-3 pb-3 -mt-0.5">
                      <p className="text-[11px] sm:text-xs text-surface-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
