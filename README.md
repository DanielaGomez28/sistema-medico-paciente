# Sistema Médico-Paciente (SMP) - Farmahumana

Plataforma transaccional para la gestión de vinculación médico-paciente en tiempo real mediante QR efímeros y WebSockets.

## 🚀 Guía de Inicio Rápido

1. **Instalación:**
   ```bash
   npm install
   ```

2. **Configuración para Pruebas en Móvil:**
   Crea un archivo `.env.local` en el frontend y un archivo `.env` en el backend usando los siguientes datos:

   - **Frontend** (`.env.local`):
     ```env
     NEXT_PUBLIC_API_URL=http://TU_IP:4000/api
     NEXT_PUBLIC_SOCKET_URL=http://TU_IP:4000
     ```

   - **Backend** (`.env`):
     ```env
     PORT=4000
     FRONTEND_URL=http://TU_IP:3000
     ```

   *Nota: Reemplaza "TU_IP" por tu Dirección IPv4 (obtenida con `ipconfig` en CMD).*

3. **Ejecución:**
   - **Backend:** `npm start`
   - **Frontend:** `npm run dev -- -H TU_IP`

4. **Acceso:**
   - Accede desde el navegador de tu móvil a: `http://TU_IP:3000`

---

## 💡 Notas Importantes
- **Red:** Asegúrate de que tanto el móvil como la PC estén en la misma red Wi-Fi.
- **Cambios:** Siempre reinicia los servidores tras modificar cualquier archivo `.env` / `.env.local`.
- **Seguridad:** Estos archivos son locales y no deben subirse al repositorio.

---

> [!WARNING]
> ### ⚠️ El Escáner QR NO funciona en `http://`
> Si accedes a la aplicación móvil usando `http://TU_IP:3000`, **tu celular bloqueará la cámara por seguridad** (Chrome y Safari exigen HTTPS).
> Para solucionar esto tienes dos opciones:
> 1. **(Recomendado) Usar Localtunnel:** Ejecuta `npx localtunnel --port 3000` en tu PC y entra a la URL `.loca.lt` que te arroje desde tu celular. (Deberás configurar esa URL en el `FRONTEND_URL` del backend).
> 2. **Truco en Android (Chrome):** En el Chrome de tu celular, ingresa a `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, añade `http://TU_IP:3000`, activa la opción y reinicia Chrome.
