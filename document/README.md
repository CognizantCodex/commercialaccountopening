# API Swagger Files

This folder contains the live OpenAPI/Swagger files generated from the current codebase:

- `commercial-account-opening-openapi.yaml`
  Node.js API used by the root commercial account opening application in `src/` and `server/`.
- `kyc-fabric-platform-openapi.yaml`
  Spring Boot API used by the KYC Fabric workspace in `frontend/` and `backend/`.

Covered endpoints:

- Commercial Account Opening API
  - `GET /api/account-opening/health`
  - `GET /api/account-opening/workspace`
  - `PUT /api/account-opening/workspace`
  - `POST /api/account-opening/submit`
  - `POST /api/checkKYC`
  - `POST /api/check-kyc/applications`
  - `POST /api/check-risk/applications`

- KYC Fabric Platform API
  - `GET /platform/snapshot`
  - `GET /cases`
  - `POST /cases`
  - `POST /checkKYC`
  - `GET /cases/{caseId}`
  - `POST /cases/{caseId}/documents`
  - `POST /cases/{caseId}/evaluations/qc`
  - `POST /cases/{caseId}/tasks/{taskId}/resolve`
  - `POST /cases/{caseId}/actions/start-monitoring`
  - `POST /governance/decisions`
  - `POST /cases/{caseId}/resolve`
  - `POST /cases/{caseId}/monitoring`
  - `POST /governance/cases/{caseId}/decision`
  - `GET /cases/{caseId}/explainability`
  - `GET /activity/stream`

Notes:

- The KYC Fabric API supports both `/api` and `/api/v1` base paths; both are included in the spec servers list.
- These files are based on the live route/controller implementations, not the older conceptual specs under `specs/`.
