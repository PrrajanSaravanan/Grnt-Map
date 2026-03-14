# GrantWeave

Frontend (Vite + React) and backend (Express + WebSocket) in separate folders.

## Project structure

- **`frontend/`** – Vite + React app (port 5173 in dev)
- **`backend/`** – Express API + WebSocket server (port 3001)

## Run locally

**Prerequisites:** Node.js

1. **Install all dependencies** (root, backend, frontend):
   ```bash
   npm run install:all
   ```
   Or manually: `npm install` in repo root, then in `backend/` and `frontend/`.

2. **Environment** (no `.env` in project root—each app has its own)
   - **Frontend:** `frontend/.env` — copy from `frontend/.env.example` and add your Firebase config. Add `VITE_WS_URL=ws://localhost:3001` when running frontend and backend separately.
   - **Backend:** Optional `backend/.env` for `PORT` (see `backend/.env.example`).

3. **Run both frontend and backend** (recommended):
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173  
   - Backend API + WebSocket: http://localhost:3001  

   Or run separately in two terminals:
   ```bash
   npm run dev:backend   # backend only, port 3001
   npm run dev:frontend  # frontend only, port 5173 (proxies /api to backend)
   ```
   When running separately, set `VITE_WS_URL=ws://localhost:3001` in `frontend/.env` so the collab WebSocket connects to the backend.

4. **Production**
   - Build frontend: `npm run build` (output in `frontend/dist/`)
   - Run backend with `NODE_ENV=production`; it serves `frontend/dist` and handles `/api` and WebSocket on one port.

## Scripts (root)

| Script           | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Run backend + frontend together     |
| `npm run dev:backend`  | Run backend only (port 3001)  |
| `npm run dev:frontend` | Run frontend only (port 5173) |
| `npm run build`  | Build frontend to `frontend/dist`   |
| `npm run start`  | Run backend only (for production)   |
