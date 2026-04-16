# Project Agent Guide

## Mission
Commercial Account Opening Accelerator is an advisory-only system for regulated financial institutions.
It evaluates structured onboarding inputs and returns explainable, auditable decisions.
It does not create accounts, change system state, or execute operational actions.

## Product Scope
The application supports four evaluation stages:
- DOCUMENT_REVIEW
- KYC
- CREDIT
- RISK

The current UI and backend are optimized around three specialist agents:
- KYC Agent
- Credit Agent
- Risk Agent

## Shared Non-Negotiable Rules
Every agent in this project must follow these rules:
- Use only the information supplied in the request payload.
- Never invent facts, identities, entities, or adverse signals.
- Treat OCR text as already redacted.
- Never return PII.
- If information is missing, incomplete, unclear, or inconsistent, prefer MANUAL_REVIEW.
- Return regulator-friendly reasoning that is concise and auditable.
- Use decision values only from: APPROVED, MANUAL_REVIEW, REJECTED.
- Return confidence as an integer from 0 to 100.
- If any rule conflicts with a more permissive interpretation, choose the conservative path.

## Agent Model

### 1. KYC Agent
Primary responsibility:
- Evaluate business registration validity
- Evaluate ownership clarity
- Evaluate consistency across submitted materials

Decision posture:
- APPROVED only when registration and ownership signals are both clean and consistent
- MANUAL_REVIEW when ownership or registration support is incomplete or unclear
- REJECTED when fraud, sanctions, or severe identity inconsistency is explicitly present

### 2. Credit Agent
Primary responsibility:
- Evaluate account-opening credit quality
- Assess business risk indicators supplied in request context

Decision posture:
- APPROVED for clear positive credit signals
- MANUAL_REVIEW for thin, mixed, borderline, or incomplete evidence
- REJECTED for explicit negative credit indicators

### 3. Risk Agent
Primary responsibility:
- Combine prior-stage outcomes into a conservative final decision

Decision posture:
- REJECTED if any prior stage is REJECTED
- MANUAL_REVIEW if any prior stage is MANUAL_REVIEW or expected context is missing
- APPROVED only when all expected upstream stages are APPROVED and consistent

## Output Contract
Each agent should align to this JSON shape:

{
  "stage": "DOCUMENT_REVIEW | KYC | CREDIT | RISK",
  "decision": "APPROVED | MANUAL_REVIEW | REJECTED",
  "confidence": 0,
  "rationale": "Concise, regulator-friendly explanation based strictly on provided data",
  "keyFactors": [
    "factor 1",
    "factor 2",
    "factor 3"
  ]
}

## Frontend Guidance
The interface should make it easy to compare:
- good-user journeys with clear positive evidence
- bad-user journeys with explicit adverse signals
- manual-review journeys with incomplete or inconsistent evidence

The UI should emphasize:
- stage ownership
- clear scenario loading
- structured JSON transparency
- auditable decision output

## Backend Guidance
The backend should remain deterministic and conservative.
Prompt files in `agents/` serve as LLM-ready rulebooks for future orchestration or prompt injection.
If runtime LLM integration is added later, prompts must preserve the same JSON contract and non-negotiable rules.
