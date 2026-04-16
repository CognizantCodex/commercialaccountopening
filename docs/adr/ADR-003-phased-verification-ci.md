# ADR-003: Verify frontend immediately and backend automatically when it lands

- **Status**: Accepted
- **Date**: 2026-04-16
- **Context**: Work in this repository is happening in parallel. Frontend assets already exist, while backend implementation may arrive later from another worker.
- **Decision**: Add a lightweight GitHub Actions workflow that always discovers available surfaces, runs frontend lint/typecheck/test/build today, and enables backend Maven verification automatically once `backend/pom.xml` or `backend/mvnw` exists.
- **Rationale**: This keeps CI useful from day one without blocking the repo on absent directories or forcing placeholder backend code.
- **Alternatives**: Delay CI until all layers exist; fail hard when backend is missing; maintain separate manually enabled workflows.
- **Consequences**: Backend verification is intentionally conditional in the first iteration, so repository owners should remove the conditional guard once backend structure is permanently present.
