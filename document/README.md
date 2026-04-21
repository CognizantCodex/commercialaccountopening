# API Swagger Files

This folder contains the live OpenAPI/Swagger files generated from the current codebase:

- `commercial-account-opening-openapi.yaml`
  Node.js API used by the root commercial account opening application in `src/` and `server/`.
- `kyc-fabric-platform-openapi.yaml`
  Spring Boot API used by the KYC Fabric workspace in `frontend/` and `backend/`.

Notes:

- The KYC Fabric API supports both `/api` and `/api/v1` base paths; both are included in the spec servers list.
- These files are based on the live route/controller implementations, not the older conceptual specs under `specs/`.
