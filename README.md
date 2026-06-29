# Frontend SMP Farmahumana

## Estado actual
Este frontend funciona con mocks y flujos de prueba. El escaner en tiempo real queda restringido a movil.

## Cambios aplicados
- Cliente API corregido para Next.js/Vercel con `NEXT_PUBLIC_API_URL`.
- Sanitizacion basica de email, password y cedula antes de enviar.
- Escaner en tiempo real:
  - En PC queda bloqueado y se informa al usuario.
  - En movil con camara queda habilitado.
  - Sigue existiendo vinculación manual como fallback.

## Variables de entorno
Copiar `C:\Proyecto IDS Frontend\.env.example` a `.env.local`.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Desarrollo local
```bash
npm install
npm run dev
```

## Despliegue en Vercel
Este frontend SI es compatible con Vercel.

### Si el backend va en otro host
Configura:
```env
NEXT_PUBLIC_API_URL=https://tu-backend/api
```

## Flujo mock sin base de datos
- El medico arma el recipe.
- El frontend guarda la solicitud mock en `localStorage`.
- El paciente detecta esa solicitud, la confirma y avanza al pago mock.
- Como no hay OLTP real, la confirmacion visible depende del mock local, NO de una persistencia transaccional real.

## Archivos clave
- `C:\Proyecto IDS Frontend\src\components\LoginView.tsx`
- `C:\Proyecto IDS Frontend\src\components\DoctorView.tsx`
- `C:\Proyecto IDS Frontend\src\components\PatientView.tsx`
- `C:\Proyecto IDS Frontend\src\lib\api.ts`
