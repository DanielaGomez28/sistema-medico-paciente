# Frontend SMP Farmahumana

## Estado actual
Este frontend ahora está conectado y operando contra el backend desplegado en Vercel. Ya no depende exclusivamente de mocks locales para las operaciones principales como el login o la gestión de usuarios, sino que se comunica con la API real. El escáner en tiempo real queda restringido a dispositivos móviles por cuestiones de hardware (cámara).

## Cambios aplicados
- Conexión al backend en Vercel mediante la variable `NEXT_PUBLIC_API_URL`.
- Eliminación del captcha en el inicio de sesión para agilizar el flujo y evitar dependencias externas problemáticas.
- Sanitización básica de email, password y cédula antes de enviar al servidor.
- Escáner en tiempo real:
  - En PC queda bloqueado y se informa al usuario.
  - En móvil con cámara queda habilitado.
  - Sigue existiendo vinculación manual como fallback.

## Configuración: Local vs Nube (Vercel)
El código ya está preparado para funcionar tanto en tu computadora como en la nube sin cambiar ni una sola línea de código, gracias a las **Variables de Entorno**.

### 1. Para correr en LOCAL (Tu PC)
Crea un archivo llamado `.env.local` en la raíz de este proyecto (junto a `package.json`) y agrega:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```
*Next.js leerá este archivo automáticamente cuando uses `npm run dev` y se conectará a tu backend local.*

### 2. Para correr en la NUBE (Vercel)
Cuando importes el proyecto en Vercel, **no subas el archivo `.env.local`**. En su lugar, ve a la pestaña de **Environment Variables** en el panel de Vercel y agrega estas dos:
- `NEXT_PUBLIC_API_URL` = `https://proyecto-ids-backend.vercel.app/api`
- `NEXT_PUBLIC_SOCKET_URL` = `https://proyecto-ids-backend.vercel.app`

*Así, la versión subida a la nube sabrá que debe conectarse al backend remoto, mientras que tu versión local seguirá usando tu backend de prueba.*

## Desarrollo local
Para desarrollo normal en PC:
```bash
npm install
npm run dev
```

### Corrida en Móvil (Acceso a la Cámara)
Para que el escáner (la cámara) funcione en tu celular durante el desarrollo local, el navegador exige que la conexión sea segura (HTTPS). La forma más fácil y rápida de lograrlo en Windows es usando **Localtunnel**, sin necesidad de cuentas ni certificados complejos:

**Paso 1: Levanta tu servidor normal**
En tu terminal de siempre, inicia el proyecto:
```bash
npm run dev -- -H 0.0.0.0
```

**Paso 2: Crea el túnel HTTPS (Nueva terminal)**
Abre una **segunda pestaña** en tu terminal (sin cerrar la anterior) y ejecuta:
```bash
npx localtunnel --port 3000
```
La consola te mostrará una URL similar a `https://algo-random.loca.lt`.

**Paso 3: Entra desde tu celular**
Abre esa URL desde el navegador de tu teléfono móvil.

**Paso 4: Pantalla de Seguridad Anti-Phishing**
La primera vez que entres, verás una pantalla blanca pidiéndote una "IP Address".
- Fíjate en la IP que aparece en un cuadrito arriba en esa misma pantalla (ej. `45.186.x.x`).
- Escribe esa IP exacta en la caja de texto.
- Dale al botón azul **"Continue"**.

¡Listo! Eso te redirigirá a la aplicación Frontend y podrás usar la cámara sin que el navegador la bloquee.

## Despliegue en Vercel
Este frontend SI es compatible con Vercel.

### Si el backend va en otro host
Configura en Vercel la variable de entorno:
```env
NEXT_PUBLIC_API_URL=https://tu-backend/api
```

## Flujo de la Aplicación
- El médico (u otro rol autorizado) se autentica contra el backend.
- El médico arma el récipe y la solicitud se envía y persiste en la base de datos a través de la API.
- El paciente detecta esa solicitud, la confirma y avanza al pago.
- La confirmación ahora está respaldada por la persistencia transaccional real del backend.

## Archivos clave
- `C:\Proyecto IDS Frontend\src\components\LoginView.tsx`
- `C:\Proyecto IDS Frontend\src\components\DoctorView.tsx`
- `C:\Proyecto IDS Frontend\src\components\PatientView.tsx`
- `C:\Proyecto IDS Frontend\src\lib\api.ts`
