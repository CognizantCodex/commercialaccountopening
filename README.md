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
- AML Agent: `POST /api/aml/check_transaction`
- AML Case Review: `POST /api/aml/review_case`
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

## AML JSON endpoints

### Check transaction

```json
POST /api/aml/check_transaction
{
  "tx_id": "TX-9001",
  "transaction": {
    "txId": "TX-9001",
    "description": "Abrupt geographical shift with layering pattern",
    "geoShift": true,
    "velocitySpike": true,
    "layeringIndicator": true
  },
  "internal_kyc_vault": {
    "summary": "Customer already marked for enhanced due diligence."
  },
  "adverse_media_api": {
    "summary": "Negative media references potential money laundering investigation."
  }
}
```

### Review case

```json
POST /api/aml/review_case
{
  "case_id": "CASE-77",
  "riskLevel": "High",
  "confidenceScore": 91,
  "caseSummary": "AML case awaiting senior analyst approval.",
  "review": {
    "analystId": "analyst_id_101"
  }
}
```
