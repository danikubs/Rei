# REI - App + Mercado (Node.js)

Prototipo funcional de REI con dos vistas principales:

- `rei-app.html`: flujo de productor (registro de activos, diagnóstico, finanzas y wallet).
- `rei-mercado-v2.html`: vista de mercado de contratos.

El proyecto corre con un servidor Node.js + Express y expone endpoints para conectar frontend y backend.

## Stack

- Node.js
- Express
- HTML/CSS/JS (vanilla)
- Integración de wallet Stellar (kit instalado en frontend)

## Estructura principal

- `server.js` - servidor Express y rutas web
- `app-api.js` - API del flujo APP
- `rei-app.html` - interfaz principal del productor
- `rei-mercado-v2.html` - interfaz de mercado
- `app-store.json` - persistencia local simple (se genera/actualiza en runtime)
- `stellar_bridge.rs` y `mxne_wallet_adapter.rs` - base Rust para puente blockchain

## Requisitos

- Node.js 18+ (recomendado Node.js 20+ para ecosistema wallet más reciente)

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm start
```

El servidor intenta iniciar en `3000`; si está ocupado, sube automáticamente al siguiente puerto disponible.

Rutas:

- `http://localhost:3000/app`
- `http://localhost:3000/mercado`

## Acceso (login fijo)

Credenciales habilitadas:

- Correo: `productor@gmail.com`
- Contraseña: `ILOVEBAF`

También está disponible el inicio de sesión por wallet Stellar desde el login del APP.

## API (base)

Base URL:

```text
/api/app
```

Endpoints relevantes:

- `POST /auth/login`
- `POST /auth/wallet`
- `GET /dashboard`
- `GET /animals`
- `POST /animals`
- `POST /wallet/deposit-mxne`
- `POST /wallet/withdraw-mxne`

## Notas

- `app-store.json` funciona como almacenamiento local para pruebas.
- Este repositorio está orientado a demo/prototipo; para producción conviene migrar a DB real, auth robusta y manejo seguro de secretos.
