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
  - `GET /api/entities`
  - `POST /api/entities`
  - `GET /api/entities/{entityId}`
  - `PUT /api/entities/{entityId}`
  - `DELETE /api/entities/{entityId}`
  - `GET /api/ubos`
  - `POST /api/ubos`
  - `GET /api/ubos/{uboId}`
  - `PUT /api/ubos/{uboId}`
  - `DELETE /api/ubos/{uboId}`
  - `GET /api/ubo-documents`
  - `POST /api/ubo-documents`
  - `GET /api/ubo-documents/{docId}`
  - `PUT /api/ubo-documents/{docId}`
  - `DELETE /api/ubo-documents/{docId}`
  - `GET /api/ubo-screening-results`
  - `POST /api/ubo-screening-results`
  - `GET /api/ubo-screening-results/{resultId}`
  - `PUT /api/ubo-screening-results/{resultId}`
  - `DELETE /api/ubo-screening-results/{resultId}`
  - `GET /api/ubo-audit-log`
  - `POST /api/ubo-audit-log`
  - `GET /api/ubo-audit-log/{logId}`
  - `PUT /api/ubo-audit-log/{logId}`
  - `DELETE /api/ubo-audit-log/{logId}`
  - `GET /api/ubo-ownership-chain`
  - `POST /api/ubo-ownership-chain`
  - `GET /api/ubo-ownership-chain/{chainId}`
  - `PUT /api/ubo-ownership-chain/{chainId}`
  - `DELETE /api/ubo-ownership-chain/{chainId}`
  - `GET /api/fincen-cdd/entities/{entityId}/assessment`
  - `POST /api/fincen-cdd/assessments`
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
