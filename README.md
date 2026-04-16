# Commercial Account Opening Accelerator

This repo now contains:
- a React frontend in `frontend`
- a Node.js backend in `backend`
- the original advisory-agent prompt in `prompt1_updaed.txt`
- project and specialist agent guidance in `AGENT.md` and `agents/`

## Frontend

- Stack: React + Vite
- Dev server: `npm run dev`
- API proxy: `/api` -> `http://localhost:8080`

## Backend

- Stack: Node.js using the built-in `http` module
- API: `POST /api/evaluate`
- Health: `GET /api/health`
- Port: `8080`

## Run locally

Backend:

```powershell
cd backend
$env:Path='C:\Program Files\nodejs;' + $env:Path
npm run dev
```

Frontend:

```powershell
cd frontend
$env:Path='C:\Program Files\nodejs;' + $env:Path
npm run dev
```

Open `http://localhost:5173`.

## Verification completed

- `cd backend && npm test`
- `cd frontend && npm run build`
