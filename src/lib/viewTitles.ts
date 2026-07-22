/**
 * Títulos de página por vista/portal para orientar al usuario.
 */

export function getDoctorPageTitle(tab: string, doctorName: string): string {
  const cleanName = doctorName.replace(/^Dr\.\s*/i, '').trim() || doctorName;

  switch (tab) {
    case 'agenda':
      return `Bienvenido, ${cleanName}`;
    case 'reception':
      return 'Pacientes';
    case 'prescription':
      return 'Generar récipe';
    case 'commissions':
      return 'Comisiones';
    case 'help':
      return 'Ayuda';
    case 'profile':
      return 'Perfil médico';
    default:
      return 'Portal médico';
  }
}

export function getDoctorPageDescription(tab: string): string | undefined {
  switch (tab) {
    case 'agenda':
      return 'Panel principal y resumen de tu actividad clínica.';
    case 'reception':
      return 'Directorio de pacientes y expedientes clínicos.';
    case 'prescription':
      return 'Emisión de prescripciones y configuración de tratamientos.';
    case 'commissions':
      return 'Libro de comisiones e historial de récipes firmados.';
    case 'help':
      return 'Guía de uso del portal médico.';
    case 'profile':
      return 'Datos profesionales, bancarios y configuración de cuenta.';
    default:
      return undefined;
  }
}

export function getDoctorPageLayoutClass(tab: string): string {
  switch (tab) {
    case 'profile':
      return 'w-full max-w-2xl mx-auto';
    default:
      return 'w-full';
  }
}

export type PatientSubTab =
  | 'recipes'
  | 'treatment'
  | 'proposals'
  | 'payment'
  | 'voucher'
  | 'delivery'
  | 'profile'
  | 'help';

export function getPatientPageTitle(subTab: PatientSubTab, patientName: string): string {
  const cleanName = patientName.trim() || 'Paciente';

  switch (subTab) {
    case 'treatment':
      return `Bienvenido, ${cleanName}`;
    case 'recipes':
    case 'voucher':
      return 'Récipes médicos';
    case 'proposals':
      return 'Confirmar pedido';
    case 'payment':
      return 'Pasarela de pago';
    case 'delivery':
      return 'Método de entrega';
    case 'help':
      return 'Ayuda';
    case 'profile':
      return 'Mi perfil';
    default:
      return 'Portal paciente';
  }
}

export function getPatientPageLayoutClass(subTab: PatientSubTab): string {
  switch (subTab) {
    case 'profile':
    case 'voucher':
      return 'w-full max-w-2xl mx-auto';
    case 'delivery':
      return 'w-full max-w-3xl mx-auto';
    default:
      return 'w-full';
  }
}

export function getPatientPageDescription(subTab: PatientSubTab): string | undefined {
  switch (subTab) {
    case 'treatment':
      return 'Seguimiento de tratamientos, credencial QR y actividad clínica.';
    case 'recipes':
    case 'voucher':
      return 'Prescripciones emitidas por especialistas y retiro en farmacia.';
    case 'proposals':
      return 'Revisión del pedido antes de confirmar la compra.';
    case 'payment':
      return 'Confirmación del pago de tu tratamiento.';
    case 'delivery':
      return 'Selección de cómo recibir tus medicamentos.';
    case 'help':
      return 'Guía de uso del portal paciente.';
    case 'profile':
      return 'Datos personales, contacto y preferencias de entrega.';
    default:
      return undefined;
  }
}
