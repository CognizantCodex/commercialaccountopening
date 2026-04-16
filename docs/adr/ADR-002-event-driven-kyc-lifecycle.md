# ADR-002: Publish lifecycle events for onboarding, monitoring, and governance

- **Status**: Accepted
- **Date**: 2026-04-16
- **Context**: Aurora’s narrative includes state transitions that matter beyond a single request-response cycle, including document upload, AI classification, QC failure, manual resolution, monitoring alerts, and governance logging.
- **Decision**: Define AsyncAPI v1 topics for each major lifecycle step and standardize message headers around `eventId`, `correlationId`, `occurredAt`, and `producer`.
- **Rationale**: Event contracts let monitoring, analytics, audit, and future automation services react independently while preserving a replayable story for explainability.
- **Alternatives**: Poll-only integrations; one generic event topic; direct point-to-point callbacks.
- **Consequences**: Teams must keep event schemas versioned and consistent with the REST model. The first version assumes Kafka-style topics, but the payloads remain portable to another broker if needed.
