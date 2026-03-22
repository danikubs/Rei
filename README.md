# REI - App + Marketplace (Node.js)

Functional REI prototype with two main views:

- `rei-app.html`: Producer flow (asset registration, diagnostics, finances, and wallet).

- `rei-mercado-v2.html`: Contract marketplace view.

The project runs on a Node.js + Express server and exposes endpoints to connect the frontend and backend.

## Stack

- Node.js
- Express
- HTML/CSS/JS (vanilla)
- Stellar wallet integration (kit installed on the frontend)

## Main Structure

- `server.js` - Express server and web routes
- `app-api.js` - APP flow API
- `rei-app.html` - main producer interface
- `rei-mercado-v2.html` - marketplace interface
- `app-store.json` - simple local persistence (generated/updated at runtime)
- `stellar_bridge.rs` and `mxne_wallet_adapter.rs` - Rust foundation for the blockchain bridge

## Requirements

- Node.js 18+ (Node.js 20+ recommended for the latest wallet ecosystem)

## Installation

```npm install
```

## Execution

```npm Start
```

The server attempts to start on port 3000; if it's busy, it automatically switches to the next available port.

Paths:

- `http://localhost:3000/app`
- `http://localhost:3000/mercado`

## Access (fixed login)

Enabled credentials:

- Email: `productor@gmail.com`
- Password: `ILOVEBAF`

Login via Stellar wallet is also available from the app login.

## API (base)

Base URL:

```text
/api/app
```

Relevant Endpoints:

- `POST /auth/login`
- `POST /auth/wallet`
- `GET /dashboard`
- `GET /animals`
- `POST /animals`
- `POST /wallet/deposit-mxne`
- `POST /wallet/withdraw-mxne`

## Notes

- `app-store.json` serves as local storage for testing.

- This repository is intended for demo/prototype use; for production, it is recommended to migrate to a real database with robust authentication and secure secret management.
