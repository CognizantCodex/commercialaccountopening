# ADR-001: Use a case-centric REST API for Aurora onboarding workflows

- **Status**: Accepted
- **Date**: 2026-04-16
- **Context**: The seeded story centers on one commercial onboarding case moving through intake, document review, QC, monitoring, and governance. Both the UI and future backend need stable synchronous contracts for queue views and drill-through detail.
- **Decision**: Model the primary synchronous surface as a REST API rooted in `cases`, with companion resources for documents, QC resolutions, monitoring alerts, governance decisions, and executive summary data.
- **Rationale**: A case-centric resource model maps directly to the operational workflow, keeps frontend integration simple, and lets backend teams implement vertical slices without waiting for a larger domain split.
- **Alternatives**: GraphQL for aggregated screens; separate APIs per dashboard view; direct event-only integration without a query API.
- **Consequences**: The first contract version favors implementation speed and clarity over maximal flexibility. Aggregation-heavy use cases can still be added later behind dedicated read endpoints.
