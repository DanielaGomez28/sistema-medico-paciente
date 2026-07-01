# Frontend SMP Farmahumana

## Ejecucion local
Este frontend queda configurado para correr LOCAL contra el backend Express/Socket.IO.

### Variables
Copiar `.env.example` a `.env.local`.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_CAPTCHA_PROVIDER=mock
NEXT_PUBLIC_MOCK_CAPTCHA_TOKEN=FARMAHUMANA_OK
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

### Desarrollo
```bash
npm install
npm run dev
```

### Backend esperado
El backend debe estar corriendo en:
- `http://localhost:4000`

El frontend queda en:
- `http://localhost:3000`

## Escaner en tiempo real
- En **PC** el escaner en tiempo real queda bloqueado a proposito.
- En **movil** solo se habilita si el navegador expone acceso a camara.
- Si no hay camara o el usuario esta en desktop, se usa la vinculacion manual.

## Flujo mock sin base de datos
- El medico arma el recipe.
- El frontend guarda la solicitud mock en `localStorage`.
- El paciente detecta esa solicitud, la confirma y avanza al pago mock.
- La confirmacion visible sigue dependiendo del mock local, no de una persistencia OLTP real.

## Archivos clave
- `C:\Proyecto IDS Frontend\src\components\LoginView.tsx`
- `C:\Proyecto IDS Frontend\src\components\DoctorView.tsx`
- `C:\Proyecto IDS Frontend\src\components\PatientView.tsx`
- `C:\Proyecto IDS Frontend\src\lib\api.ts`
- `C:\Proyecto IDS Frontend\src\lib\socket.ts`
