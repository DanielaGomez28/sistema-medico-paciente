<!--
/**
 * @fileoverview Documenta el archivo README de +Salud.
 * @module README
 */
-->
﻿# Frontend SMP Farmahumana

Cliente Next.js del Sistema Médico-Paciente.

## Ejecución local

Este frontend queda configurado para correr LOCAL contra el backend Express/Socket.IO.

### Variables locales

Copiar `.env.example` a `.env.local`.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_CAPTCHA_PROVIDER=mock
NEXT_PUBLIC_MOCK_CAPTCHA_TOKEN=FARMACIA_OK
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

### Desarrollo local

```bash
npm install
npm run dev
```

### Backend esperado en local

- `http://localhost:4000`
- Frontend: `http://localhost:3000`

## Despliegue actual

### Variables desplegadas

```env
NEXT_PUBLIC_API_URL=https://proyecto-ids-backend.vercel.app/api
NEXT_PUBLIC_SOCKET_URL=https://proyecto-ids-backend.vercel.app
```

## Estado actual

- Login, portal médico, portal paciente y panel administrativo consumen la API real
- El CMS legal está conectado al backend
- El dashboard/admin médico-financiero usa endpoints reales
- Las secciones administrativas antiguas basadas en datos locales deben usarse sólo en local
- En Vercel no hay realtime persistente con Socket.IO; el frontend aplica degradación controlada
