# North Star: Next-Generation KYC Platform — Vision & Project Requirements

> **Document Type:** Product Vision & Project Requirements  
> **Status:** Draft  
> **Audience:** STP Partnering, Product, Technology, Operations, Compliance  

---

## 1. Executive Summary

The North Star initiative is a strategic transformation of the Know Your Customer (KYC) process from a historically painful, manual, and fragmented experience into a **strategic business advantage**. By leveraging agentic AI, continuous monitoring, and intelligent automation, the platform aims to deliver accuracy and compliance on the first attempt — every time.

This is not an incremental improvement. It is a fundamental redesign of KYC **technology, automation, and operating model**, built to be delivered incrementally, steadily, and in close partnership with all stakeholders including front office, operations, compliance, and technology.

---

## 2. Vision Statement

> **"Transform KYC from a painful experience into a strategic advantage by using agentic AI, continuous monitoring, and intelligent automation, so that we can deliver first-time right, every time."**

**First-time right** means: no rework, no callbacks, no re-reviews — between the three key actors in onboarding: the **client**, **front office**, and **operations**.

---

## 3. North Star Metrics (Success Criteria)

| Metric | Target | Description |
|---|---|---|
| **First-Time Right** | 100% | Every KYC case is complete, accurate, and compliant on first submission. No rework, no callbacks, no re-reviews. |
| **Zero NIGOs** | 0 | "Not In Good Order" submissions eliminated. Every document and data point validated before acceptance. |
| **Straight-Through Processing (STP)** | 100% (low/medium risk) | End-to-end processing without any manual touchpoints for low and medium risk clients. |
| **Data Collected Once** | Enforced | Customer data gathered once becomes the single source of truth across onboarding, periodic reviews, and continuous KYC. |
| **Reduction in Periodic Reviews** | ~90% | Shift from scheduled periodic reviews to event-driven continuous KYC. |

> **Note:** These are aspirational north-star goals. Not all will be achieved on day one. They define the direction and benchmark for progress.

---

## 4. Problem Statement & Pain Points

### 4.1 Known Pain Points

The following themes have been independently corroborated by both product/technology leadership and the voice-of-operations exercise:

- **Rework & Callbacks:** Data and documents frequently go back and forth between clients, front office, and operations due to quality issues on first submission.
- **Data Duplication:** When a party appears in multiple KYC cases (e.g., as a beneficial owner and a main client), the same information is requested repeatedly from bankers and clients.
- **Manual Data Entry:** Documents received are manually read and re-keyed into tooling. No automated extraction, classification, or validation.
- **Document Misclassification:** Until recently, all documents were stored as "KYC General" without granular classification (e.g., passport vs. utility bill vs. entity formation document).
- **Fragmented Onboarding Integrations:** Multiple front-office intake applications (Uno, USB Intake, IPB Intake, GPM Intake) each maintain their own MFE (Micro Frontend) integrations, with different versions, inconsistent mappings, and data quality issues when syncing back to the KYC platform.
- **Stale / Overridden Data:** Data conflicts between KYC and Meridian (the client data platform) result in overrides, stale reads, and inconsistencies — particularly around party and address data.
- **Reactive Periodic Reviews:** KYC reviews are scheduled and calendar-driven, not event-driven. Material changes in client data do not automatically trigger targeted reviews.
- **Manual QC:** Quality checks run only at the end of the compose stage, not continuously as data is gathered.
- **Manual Audit Response:** Dedicated teams spend significant time manually extracting and collating information to respond to internal and external audit inquiries.
- **Siloed Tools for Operations:** KYC data must be "handed off" rather than operated on collaboratively through the same record.

---

## 5. Strategic Approach

### 5.1 Agentic AI over Full AI Autonomy

KYC is deeply grounded in regulatory policy. Policy decisions must remain **deterministic** — AI cannot make policy decisions autonomously. The architectural approach is:

- A **Policy Rules Engine** at the core — deterministic, compliance-driven, unchanged.
- An **Agentic Ecosystem** built around it — governed by policy, but capable of automating tasks currently performed by humans (advising, proposing, interpreting, presenting information to actors).

Agents operate within clearly defined **boundaries** with enforced **segregation of duty** to prevent hallucination and unintended behavior.

### 5.2 Continuous KYC Over Periodic Reviews

The current model of scheduled periodic reviews is to be replaced with **event-driven continuous KYC**:

- Agents autonomously listen for changes that can impact a client's KYC status.
- Changes are evaluated (re-scoring, risk assessment), and the system reacts in accordance with GFCC-approved policy.
- For clients with no triggering events over extended periods, policy guidance from GFCC will define targeted review thresholds.

### 5.3 Shift-Left: Embed KYC Into Onboarding

Rather than treating KYC as an independent downstream system:

- KYC screens will be **embedded directly** into front-office intake applications (Uno, USB, IPB, etc.), providing a single integration point.
- The same KYC ticket is worked on collaboratively by advisors and operations — no data shunting, no mappings, no manual copying.
- KYC will also be available as a **standalone application** within Connect (the Private Bank application framework), with identical look and feel.
- Advisor-facing experience (e.g., existing Source of Wealth flow) will be preserved where already rolled out.

### 5.4 Data Traceability and Auditability

Every data point ingested — whether from internal systems, advisor conversations, external registries, or third-party sources — must carry:

- **Source attribution**: Where the data came from.
- **Confidence score**: Reliability level of the source.
- **Audit trail**: Full traceability for regulators, risk, and control functions.

This is a foundational requirement of the platform, not an afterthought.

---

## 6. Key KYC Capabilities

| Capability | Description |
|---|---|
| **KYC Trigger / Case Initiation** | Event-driven or manually triggered case management |
| **Identity Verification (IDV/ID&V)** | Biometric and identity verification as a prerequisite to KYC; leveraging third-party providers (in progress) |
| **Data & Document Collection** | Automated sourcing, classification, extraction, and validation of data and documents |
| **Screening & Risk Assessment** | Sanctions, watchlist, adverse media screening; firm-wide risk scoring |
| **Continuous & Perpetual KYC** | Event-driven review lifecycle; autonomous monitoring and reactive workflow |
| **Workflow & Case Management** | Orchestrated workflows for simple (invisible automation) and complex (multi-actor) cases |
| **Regulatory & Jurisdictional Compliance** | Global appendices and local due diligence requirements enforced automatically |
| **Client & Advisor Experience** | Seamless, minimal-friction experience for both advisors and clients |

---

## 7. Platform Architecture

### 7.1 Layers

```
┌────────────────────────────────────────────────────────────────┐
│                     Governance Layer                           │
│        (Human-in-the-Loop, AI Oversight Dashboard)            │
├────────────────────────────────────────────────────────────────┤
│                   Agentic Ecosystem                            │
│  Document Intelligence │ Data Acquisition │ QC │ Continuous KYC│
├────────────────────────────────────────────────────────────────┤
│                  Orchestration Engine                          │
│      (Sequencing, Task Assignment, Event Routing,              │
│       Exception Routing, Agent Boundary Enforcement)           │
├────────────────────────────────────────────────────────────────┤
│                  Intelligence Layer                            │
│  ID&V │ Global/Local Due Diligence Policies │ Risk Scoring     │
│  Firm-Wide Screening │ Policy Rules Engine                     │
├────────────────────────────────────────────────────────────────┤
│                     Data Layer                                 │
│  Data Products │ Reporting │ Traceability │ Audit Logs         │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

- **Cloud Provider:** AWS
- **AI Layer:** AI Agents (agentic model with policy guardrails)
- **Policy Layer:** Deterministic rules engine
- **Data Layer:** Data products layer for clean reporting
- **Governance:** Explainability engine, bias detection, full auditability
- **Observability:** AI Oversight Dashboard (real-time agent performance monitoring)

---

## 8. AI Agents

### 8.1 Orchestration Engine

The backbone of the KYC platform responsible for:

- Processing sequencing of KYC steps based on **client type** and **jurisdiction**.
- Assigning tasks to the appropriate agents with enforced **scope boundaries**.
- **Event routing**: Detecting material changes and triggering targeted flows in real time.
- **Exception routing**: Determining when human-in-the-loop intervention is required, and routing to the correct actor (advisor, operations, controls).

### 8.2 Document Intelligence Agent

**Responsibilities:**
- Classify incoming documents using the new three-tier taxonomy (replacing legacy document codes).
- Extract data from documents automatically.
- Validate extracted data against KYC policy requirements.
- Reconcile against pre-filled data from third-party sources — flagging discrepancies.

### 8.3 Data Acquisition Agent

**Responsibilities:**
- Source client data from internal systems (e.g., advisor-client conversations, CRM) and external sources (e.g., SEC registries, public financial data).
- Normalize data across sources and generate **confidence scores** per data point.
- Construct ownership graphs for entity clients.
- Draft AML risk summaries.
- Pre-fill KYC fields, validate in real time.

> **Constraint:** All external data sources must be pre-approved by GFCC. The set will start small and expand incrementally.

> **Note:** May be composed of multiple specialized sub-agents (one per source), coordinated by a master data acquisition orchestrator.

### 8.4 Quality Check Agent

**Responsibilities:**
- Execute **parallel, continuous quality checks** as data and documents are gathered — not only at the end of compose.
- Aggregate results to account for cross-field dependencies.
- Determine pass/fail status, route failed cases to human remediation.
- Route passed cases forward in the workflow (STP eligibility check or approval stages).

> **Current State:** A pilot version is in production in the US. Learnings from this pilot will inform the next-generation build.

### 8.5 Continuous KYC Agent

**Responsibilities:**
- Autonomously monitor client data from internal and external sources for material changes.
- Pull context from sanctions lists, watchlists, adverse media, and regulatory feeds (replacing the current batch nightly screening model).
- Evaluate risk considering entity relationships and jurisdiction-specific requirements.
- Auto-clear false positives, escalate genuine risks with **full reasoning packages**, or flag for human review.
- Incorporate feedback loop to improve future decision quality.
- Configurable rules for what can be auto-closed vs. what requires human review.

### 8.6 Audit Intelligence Agent *(New Concept)*

**Responsibilities:**
- Reduce manual effort in responding to internal and external audit inquiries.
- Automatically extract and collate relevant KYC information in the format required by auditors.

> **Status:** Concept stage; implementation approach to be defined.

---

## 9. Exception Handling Model

The platform uses a **three-tier exception model**:

| Tier | Scenario | Handler | Process |
|---|---|---|---|
| **Tier 0 — STP** | All data and documents collected autonomously; all QC rules pass; client is low/medium risk | Automated (no human) | Full straight-through processing; auto-approval per pre-approved STP rules |
| **Tier 1 — Advisor Exception** | Most data collected; specific items flagged as missing or requiring input | Advisor | Context-rich view of missing items; advisor resolves; QC re-runs; STP re-evaluated |
| **Tier 2 — Operations Exception** | Complex case; interpretation of information required; significant data gaps remain | Operations | Pre-populated context-rich package with all gathered information; operations remediates |

> **Governing Principle:** Exception handling is **persona-based, not title-based**. Routing is determined by the nature of the exception, not organizational hierarchy. Handlers may include advisors, analysts, operations specialists, boarding specialists, or control personnel.

---

## 10. Integration Strategy

### 10.1 Front-Office Embedding
- KYC will be available **embedded** inside all major intake applications.
- Screens will be configurable per LOB (Line of Business) — specific screens can be hidden or shown based on rollout readiness.
- Existing advisor UX for Source of Wealth (already rolled out) will be preserved and reused.

### 10.2 Meridian (Client Data Platform) Integration
- KYC will shift to a **read-only view** of Meridian data within the KYC flow. Demographic changes (name, address, etc.) are **maintenance activities** and will not be performed within KYC.
- KYC will still create new parties and establish relationships — this data will be **distributed to Meridian in real time**.
- Address override issue (known for 7+ years) will be resolved in this architecture.
- Branch-level data siloing in Meridian to be assessed in coordination with the Meridian modernization program.

### 10.3 Maintenance / Downstream Notifications
- Events detected during KYC (e.g., material changes) that are relevant to maintenance workflows should be surfaced to maintenance teams.
- KYC agents and capabilities will be reusable across the broader **Client Acquisition & Lifecycle Management** ecosystem, not siloed to KYC alone.

---

## 11. Human-in-the-Loop Governance

- A **governance layer** will always be present across all automated flows.
- Human-in-the-loop starts as a **control mechanism** — humans observe and can intervene.
- Over time, as AI model maturity is demonstrated (evidenced through the AI oversight dashboard), the amount of human oversight can be progressively reduced — with the endorsement of regulators, risk, and control teams.
- All AI decisions will produce **explainability artifacts** (reasoning, confidence, traceability) to support this regulatory evidence-building.

---

## 12. Third-Party Service Dependencies

| Service | Purpose | Status |
|---|---|---|
| **IDV/ID&V Provider** | Identity and biometric verification | In active development; MSA/contract pending |
| **LexisNexis (US)** | Individual screening | In use |
| **New Entity Screening Service** | Non-individual (entity) event-based screening (CAV-side) | Being evaluated |
| **Document Management / TEM Storage** | Document storage and digitization | Solution carried forward from CDD initiative |
| **GFCC-Approved Data Sources** | External KYC data sourcing | To be defined and approved incrementally |

---

## 13. Implementation Roadmap

### Phase 1 — Foundation: Individual Client KYC (Months 1–6)
- Core capabilities for **individual client** KYC: initial, scheduled, and periodic reviews.
- Upstream and downstream system integrations.
- STP rules for low/medium risk individual cases.
- Basic agentic capabilities (QC agent, initial document intelligence).

### Phase 2 — Entity Expansion & Continuous KYC Foundation (Months 4–9, parallel)
- Extend all Phase 1 capabilities to **entity clients**.
- Begin event subscription for continuous KYC monitoring (even if periodic reviews continue in parallel).
- Reuse foundational capabilities (entitlements, task management, approvals, external integrations).

### Phase 3 — Complex Flows & Advanced Approvals (Months 9–18)
- Specialized workflows: mortgage credit, remote departure, deposit capture, Spain annual refresh.
- Additional approval tiers: cross-region approvals, GFCC approvals, local MLRO approvals.
- Fully automate currently manual flows end-to-end.

### Phase 4 — File Review Process (Months 18+)
- Evaluate and redesign the file review process within the N2N (end-to-end) KYC framework.
- Determine whether a separate file review process remains necessary.

> **Note:** Items outside the KYC ecosystem (e.g., the scheduler) will be revamped over time but are not on the critical path for migrating off the legacy platform.

---

## 14. Rollout Plan (Tentative)

| Period | Region / Segment | Scope |
|---|---|---|
| Q3 2025 | **US — USB** | Individual client KYC (initial onboarding) |
| Q4 2025 | **US — USB** | Non-individual (entity) flows |
| Q1 2026 | **US — USB** | Periodic review flows; cutover planning |
| Q2 2026 | **IPB (per market)** | Staggered rollout per IPB market; Sabrina's team to define |
| 2026 | **Geneva** | Accelerated vs. original CDD roadmap |
| 2026 | **JKMA** | Previously out of scope; now included |
| 2026 | **US Small (US-Small)** | Near-parallel with USB; integration work to be confirmed |
| Mid-2027 | **Additional regions** | Based on local due diligence specifics and approval requirements |

> **Periodic Review Cutover:** 120-day launch lead time for periodics must be factored into all cutover plans to avoid lifecycle gaps.
>
> **Shared Clients (e.g., LatAm GFG):** These are exceptions that will be identified and potentially staggered per region.

---

## 15. Key Dependencies

| Dependency | Owner / Partner | Notes |
|---|---|---|
| **Becoming a Client (BAC) Program** | Technology / Product | Primary embedding target for KYC |
| **Strategic Client Information (Meridian Modernization)** | Meridian Team | Real-time integration and data consolidation required |
| **Strategic Global Parties** | Party Data Team | Entity relationship management; alignment required |
| **Document Digitization / TEM Storage** | Shared initiative from CDD | Solution to be carried forward |
| **GFCC Policy Guidance — Continuous KYC** | GFCC (Compliance) | Policy must define handling for zero-event clients and event reaction rules |
| **Third-Party Data Source Approvals** | GFCC / Legal | All new data sources require formal approval before use |
| **IDV/ID&V Vendor Contract** | Technology / Legal / Stuart/Rob Thomas | MSA not yet signed; treated as utmost priority |
| **Operating Model Design** | Operations / Anchana | Target tool selection for operations in progress |
| **Uniform / Regulatory Change (IPB)** | Compliance | Expected next year; may simplify IPB jurisdictional treatment |
| **UNIF / AUP Regulatory Changes** | Compliance | Annual tracking and alignment required |
| **STP Rules Definition** | GFCC / Product | Pre-approved rules need to be formally defined and ratified |
| **Agentic Model & Human-in-the-Loop Policy** | Compliance / Risk & Control / Technology | New concepts requiring formal policy articulation |

---

## 16. Governance & AI Risk Controls

- All AI agents operate strictly within the **policy rules engine** — no AI-generated policy decisions.
- **Explainability**: Every agent decision must produce a human-readable justification.
- **Bias Detection**: Built into the platform as a first-class concern.
- **AI Oversight Dashboard**: Real-time monitoring of all agent performance, accuracy, and recommendations.
- **Feedback Loops**: All agents incorporate outcome feedback to refine future decisions.
- **Scope Enforcement**: The orchestration engine enforces strict agent boundaries — no agent accesses data or takes actions outside its defined scope.
- **Human Override**: Humans can always intervene, override, and escalate.

---

## 17. Testing Approach

- Maximize **automated testing** to accelerate delivery velocity.
- Leverage existing platform logic through extraction, rationalization, and forward migration — no blank-paper requirements rewrites.
- Product teams will take an active role in testing prior to user rollout, particularly for exception flows, approval workflows, and critical integration dependencies.
- Deep-dive sessions to be scheduled for: approvals, exception flows, data desktop, and complex dependency scenarios.

---

## 18. Out of Scope (Explicit Exclusions)

- **Demographic / client maintenance** (name, address changes) — these are maintenance activities handled in a maintenance UI, not in KYC.
- **Policy decisions** — will not be delegated to AI; remain deterministic and human-governed.
- Items outside the immediate KYC ecosystem (e.g., scheduler revamp) are not on the current critical-path roadmap.

---

## 19. Open Questions & Items to Resolve

- [ ] GFCC policy for clients with zero triggering events over 5–10 years under continuous KYC model.
- [ ] Define the approved set of third-party data sources, with confidence scoring methodology.
- [ ] Finalize target operations tool of choice (in progress with Anchana and operations leadership).
- [ ] Confirm Meridian branch consolidation timeline and its impact on KYC integration strategy.
- [ ] Finalize IDV/ID&V vendor contract (MSA).
- [ ] Define formal STP rules and get pre-approval from Controls and GFCC.
- [ ] Resolve shared client strategy for cross-region rollouts (e.g., LatAm GFG, LUCK clients).
- [ ] Define maintenance event subscription model — what KYC agents subscribe to from the maintenance event stream.
- [ ] Determine whether file review process can be fully absorbed into N2N KYC (Phase 4 research item).
- [ ] Quantify and document data confidence scoring methodology for multi-source data acquisition.

---

*This document is a living artifact. It will be updated as deep-dive sessions are completed, policy guidance is received, and implementation details are finalized.*
