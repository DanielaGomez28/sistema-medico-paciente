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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary-500/10 border border-primary-500/25 flex items-center justify-center shrink-0">
            <LifeBuoy className="h-5 w-5 text-primary-400" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="zenith-section-title text-sm sm:text-base">Centro de ayuda</h2>
            <p className="text-xs sm:text-sm text-surface-400 leading-relaxed">
              Guía rápida para usar +Salud: cómo navegar el portal, gestionar tus tratamientos y resolver dudas comunes.
            </p>
          </div>
        </div>
      </div>

      <section className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-5">
        <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
          <HelpCircle className="h-4.5 w-4.5 text-primary-400 shrink-0" />
          <h3 className="zenith-section-title text-xs sm:text-sm">Cómo funciona la plataforma</h3>
        </div>

        <ol className="space-y-4">
          {PATIENT_HELP_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-surface-850 bg-surface-950/40 p-4 sm:p-5 space-y-2"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500/15 border border-primary-500/30 text-[11px] font-bold text-primary-300">
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-1.5">
                  <h4 className="text-sm font-bold text-white">{step.title}</h4>
                  <p className="text-xs text-surface-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-5">
        <div className="flex items-center gap-2 border-b border-surface-850 pb-3">
          <CircleHelp className="h-4.5 w-4.5 text-primary-400 shrink-0" />
          <h3 className="zenith-section-title text-xs sm:text-sm">Preguntas frecuentes</h3>
        </div>

        <div className="space-y-3">
          {PATIENT_HELP_FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-surface-850 bg-surface-950/40 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-start justify-between gap-3 p-4 sm:p-5 text-left cursor-pointer hover:bg-surface-900/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-white leading-snug">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-surface-400 transition-transform duration-200 mt-0.5',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
                {isOpen ? (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-1">
                    <p className="text-xs text-surface-400 leading-relaxed">{faq.answer}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
