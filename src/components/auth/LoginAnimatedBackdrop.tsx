/**
 * Fondo animado del panel izquierdo en la vista de login.
 * Muestra esferas (orbes) con efecto de desenfoque flotando sobre una grilla,
 * utilizando clases CSS globales para las animaciones.
 * Es un elemento puramente decorativo.
 *
 * @returns {JSX.Element} Contenedor con elementos decorativos.
 */
export function LoginAnimatedBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="login-panel-base absolute inset-0" />
      <div className="login-panel-grid absolute inset-0 opacity-[0.35]" />
      <div className="login-orb login-orb-a absolute -left-1/4 top-[8%] size-[min(520px,70vw)] rounded-full" />
      <div className="login-orb login-orb-b absolute -right-[15%] top-[42%] size-[min(440px,60vw)] rounded-full" />
      <div className="login-orb login-orb-c absolute bottom-[-12%] left-[22%] size-[min(380px,55vw)] rounded-full" />
      <div className="login-panel-vignette absolute inset-0" />
    </div>
  );
}
